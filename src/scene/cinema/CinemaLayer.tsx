import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  ToneMapping,
  wrapEffect,
} from '@react-three/postprocessing'
import {
  ToneMappingMode,
  type BloomEffect,
  type ChromaticAberrationEffect,
} from 'postprocessing'
import type { Fidelity } from '../sceneState'
import { livePowerFor, sceneState, swallowShape } from '../sceneState'
import { liveLaw, reactorControl } from '../control/reactorControl'
import { HERO_BUILD } from '../layout'
import { sceneColors } from '../sceneColors'
import {
  captureRs,
  captureRsRetro,
  claimLensing,
  LENS_FAR,
  LENS_NEAR,
  DISK_OUTER_RS,
  HOLE_SPIN,
  holeAxis,
  holeCenter,
  holeGlowFor,
  holeRadiusFor,
  iscoRs,
  ringWidthFor,
} from '../blackHole'
import { BlackHoleEffect } from './BlackHoleEffect'

/**
 * The cinema layer: everything only a capable desktop ever downloads.
 *
 * This module is the single lazy boundary for the advanced animation stack, and
 * it exists as a *boundary* rather than as a component that happens to import
 * some libraries. Three separate guarantees hang off that:
 *
 * 1. `scripts/bundle-budget.mjs` measures everything reachable from *this module
 *    and nowhere else* against its own budget, walking the Vite manifest — so the
 *    boundary is the import graph rather than a chunk name. A phone's budget did
 *    not move when this landed, because a phone resolves `lite` and never imports
 *    this file.
 * 2. `usePerformanceGovernor` can demote out of cinema mid-session, and this
 *    unmounts cleanly when it does — including handing tone mapping back to the
 *    renderer, which is the one piece of global state the composer takes over.
 * 3. Nothing here may be imported from a module on the critical path. The rule is
 *    the same one `src/scene/control/reactorControl.ts` follows for Three itself.
 *
 * Note what is deliberately NOT in the chain. Depth of field is the obvious
 * candidate and it is wrong here: almost every surface in this room is
 * transparent with `depthWrite: false` (see `src/scene/ReconstructMaterial.ts`),
 * so the depth buffer a DoF pass would sample is largely empty and the effect
 * would blur the few opaque things while leaving the shard cloud crisp — the
 * exact inverse of the intent. The scene already has a *shading*-based depth
 * falloff in `ReconstructMaterial`'s `depthFocus` term, which knows about
 * transparency because it runs inside the material. Grain and vignette stay in
 * CSS (`app/scene.css`) because they have to work on the static experience too,
 * where there is no renderer at all.
 */

export interface CinemaLayerProps {
  fidelity: Fidelity
}

/** Multisampling per fidelity: the composer's own MSAA, not the canvas's. */
const SAMPLES: Record<Fidelity, number> = { full: 2, reduced: 0, minimal: 0 }

/**
 * Geodesic integration steps per fidelity.
 *
 * The only knob on the black hole that costs real frame time, so it is the one
 * the governor's decision reaches. `reduced` halves it: the shadow, the ring and
 * the beamed limb all survive, the third-order image does not, and nobody who has
 * not read this file will notice which one they were shown.
 */
const GEODESIC_STEPS: Record<Fidelity, number> = {
  full: 88,
  reduced: 44,
  minimal: 28,
}

const BlackHole = wrapEffect(BlackHoleEffect)

/**
 * Window-space depth of a point `metres` down the lens axis.
 *
 * Read straight off the projection matrix rather than derived from `near` and
 * `far`, because window depth is violently non-linear and a hand-rolled
 * conversion that drifts from the actual projection puts the line in the wrong
 * place by more than the whole range it has to resolve. At this lens, twenty-four
 * metres and twenty-one metres are three thousandths of window depth apart — which
 * is also why the guard's soft edge has to be computed here, in metres, instead of
 * being a small number added to a depth.
 */
const windowDepth = (projection: ArrayLike<number>, metres: number): number => {
  const z = -metres
  const w = projection[11] * z + projection[15]
  return Math.abs(w) < 1e-6
    ? 0
    : ((projection[10] * z + projection[14]) / w) * 0.5 + 0.5
}

/**
 * What a fully-charged quiescent nucleus is worth on the `uCharge` scale.
 *
 * `holeGlowFor` is normalised, and this is the unit it is spent in. The room's own
 * ignition term reaches about 1.12 at the end of the corridor, so a nucleus that
 * tops out at half of that leaves the corridor's charge still visibly *lighting*
 * the well rather than being lost under a floor — which is the story the room is
 * telling and the one thing a floor could have taken away from it.
 */
const NUCLEUS_CHARGE = 0.56

/**
 * The far end of the temperature ramp, in the renderer's working space.
 *
 * The composer runs linear, and `sceneColors` are already linear because
 * `THREE.Color.set` converts on the way in. A literal `vec3(1.0)` written in the
 * shader would be the same value, but keeping it here means the disk's hottest
 * point is mixed the same way as every other colour in the scene.
 */
const WHITE = new THREE.Color(1, 1, 1)
/*
 * The well under its laws. CHAOS is ember over black at every stop of the
 * ramp; VACUUM is the hue drained out, pale and cold.
 */
const CHAOS_HOT = new THREE.Color('#ff3a1a')
const CHAOS_COOL = new THREE.Color('#a31608')
const CHAOS_CHILL = new THREE.Color('#6e1004')
const CHAOS_EMBER = new THREE.Color('#330502')
const VACUUM_HOT = new THREE.Color('#779bac')
const VACUUM_COOL = new THREE.Color('#334858')
const VACUUM_EMBER = new THREE.Color('#101d2d')

export const CinemaLayer = ({ fidelity }: CinemaLayerProps) => {
  const gl = useThree((state) => state.gl)
  const bloom = useRef<BloomEffect>(null)
  const aberration = useRef<ChromaticAberrationEffect>(null)
  const hole = useRef<BlackHoleEffect>(null)

  /**
   * Scratch for the well's per-frame geometry.
   *
   * The disk's plane basis has to be rebuilt every frame — the axis precesses —
   * and doing it into allocated vectors would put three `Vector3`s per frame into
   * the nursery for the entire length of the page.
   */
  const scratch = useMemo(
    () => ({
      axis: new THREE.Vector3(0, 1, 0),
      diskX: new THREE.Vector3(1, 0, 0),
      diskY: new THREE.Vector3(0, 0, 1),
      toClip: new THREE.Matrix4(),
      rayBasis: new THREE.Matrix4(),
      hot: new THREE.Color(),
      cool: new THREE.Color(),
      chill: new THREE.Color(),
      ember: new THREE.Color(),
    }),
    [],
  )
  /**
   * The disk's own phase, accumulated.
   *
   * Deliberately *not* a pure function of scroll, unlike everything else in the
   * ending. Structure is scrubbable — the stator turns back when the visitor
   * scrolls up, because a mechanism that did not would be broken. A fluid is not:
   * matter that had already fallen past the inner edge does not come back out
   * because the wheel moved the other way, and a disk running backwards reads as a
   * video being rewound rather than as an ending being replayed. So the flow only
   * ever goes one way, and the *rate* is what the scroll owns.
   */
  const flow = useRef(0)

  /*
   * Tone mapping has to move to the end of the chain.
   *
   * `ReactorScene` sets `gl.toneMapping = ACESFilmicToneMapping`, which maps
   * every surface as it is drawn. With a composer in front, bloom then blooms
   * *already-compressed* values, so the highlights it is supposed to find have
   * been rolled off before it sees them and the effect reads as a flat haze. The
   * renderer hands the scene over linear, the composer blooms in HDR, and the
   * last pass maps it — which is the only order in which a bloom threshold means
   * anything. Restored on unmount so a governor demotion leaves the renderer as
   * it found it.
   */
  useEffect(() => {
    const previous = gl.toneMapping
    gl.toneMapping = THREE.NoToneMapping
    return () => {
      gl.toneMapping = previous
    }
  }, [gl])

  /*
   * The gate's own billboard stands down while this layer is mounted. Two
   * accretion disks in one aperture is not twice the light, it is a bright smear
   * with no structure in it — and the claim is released on unmount so a governor
   * demotion hands the finale back rather than leaving it dark.
   */
  useEffect(claimLensing, [])

  useFrame((state, delta) => {
    const build = sceneState.build
    const swallow = swallowShape(sceneState.swallow)
    const power = livePowerFor(build)
    // The hero transit: the moment the lens passes through the optic's core.
    const transit = Math.max(
      0,
      1 - Math.abs(build - HERO_BUILD) / (HERO_BUILD * 0.5),
    )

    const camera = state.camera
    const rs = holeRadiusFor(build, sceneState.swallow)
    /*
     * How much of the frame the shadow covers, in half-frame-heights.
     *
     * Hoisted out of the pass's own block because bloom below reads it too: the
     * one honest answer to "is the well the picture yet" is how big the well is,
     * and having the composer's two passes derive that from the same line is what
     * stops one of them from glowing over an event horizon the other has already
     * drawn. Measured on the shadow's *worst* side — with spin the retrograde edge
     * of the D reaches further, and a figure fitted to the narrow side would claim
     * the frame was clear while half of it was black.
     */
    const distance = camera.position.distanceTo(holeCenter)
    const shadow = captureRsRetro(HOLE_SPIN) * rs
    const halfFov = THREE.MathUtils.degToRad(
      camera instanceof THREE.PerspectiveCamera ? camera.fov : 42,
    )
    const subtended = Math.atan2(shadow, Math.max(distance, shadow * 1.02))
    const apparent = Math.tan(Math.min(subtended, 1.45)) / Math.tan(halfFov / 2)

    const holeEffect = hole.current
    if (holeEffect) {
      /*
       * The disk's plane, rebuilt from the axis.
       *
       * `diskX` starts from world Z rather than world Y for the obvious reason:
       * the axis *is* very nearly world Y, and crossing two parallel vectors
       * yields nothing to normalise. The corridor runs down Z, so that is the one
       * direction guaranteed not to be the axis.
       */
      holeAxis(scratch.axis, state.clock.elapsedTime)
      scratch.diskX.set(0, 0, 1).cross(scratch.axis).normalize()
      scratch.diskY.copy(scratch.axis).cross(scratch.diskX).normalize()

      scratch.toClip.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse,
      )
      scratch.rayBasis.copy(scratch.toClip).invert()

      /*
       * How much of the frame the pass is allowed to touch.
       *
       * Tracks `apparent` above — the object, not a scroll value — so neither a
       * wider lens nor a taller viewport can leave the ring hanging outside the
       * region that draws it.
       *
       * The multiplier is the one part of this that belongs to the story rather
       * than to the geometry. While the room is still standing the mask has to
       * cover the disk (about three retro-shadow radii) without reaching the
       * contact console at reading distance. Once the swallow begins it opens,
       * because from there on the room bending around the well is the ending.
       *
       * And it is floored by nothing, which is a decision rather than an omission.
       * A masked screen-space lens can take light *out* of its own disc — every
       * pixel inside it is sampled from a ray that landed somewhere else — but it
       * cannot put the matching light back outside, because outside is not its to
       * write. The footprint is therefore a net loss of whatever was standing
       * there, and against a sparse sky that reads as a dark bite rather than as a
       * lens. Floored at a third of a half-frame on the establishing shot it took
       * the galaxy's near arm with it, which is the one thing this whole change
       * exists in order not to do. Sized to the object, the loss is confined to the
       * few degrees the object was always going to dominate — and inside them there
       * is a shadow, a photon ring and a disk to dominate with.
       */
      /*
       * Toward the end the well is the frame, so the mask has to be able to reach
       * the corners — and by then the interior is shadow, which costs nothing.
       *
       * Everything here is monotonic on purpose. A wide mask over empty depth is
       * what painted the whole viewport void-black, and driving the region off
       * `suction` would reopen that once per gulp; intensity rides `uSuction`
       * inside the pass instead. The ceiling used to be a hard step at
       * `beyond > 0.08`, which put a visible jump in the size of the lensed
       * region at one scroll position; it is a ramp over the same stretch now.
       * The region itself follows the drain, so it tracks how much room has
       * actually gone in rather than how far down the rail the visitor is.
       */
      const ceiling = THREE.MathUtils.lerp(
        5.4,
        8.2,
        THREE.MathUtils.smoothstep(swallow.beyond, 0.02, 0.3),
      )
      const mask = Math.min(
        ceiling,
        Math.max(
          apparent * THREE.MathUtils.lerp(3.4, 7.2, swallow.drain),
          swallow.drain * swallow.drain * 4.6,
        ),
      )

      // A fluid, so the rate is what scroll owns; see `flow` above.
      // Gulps spin the disk harder for a beat — suction you can see in the band.
      //
      // The dilation factor is the clock the far observer keeps: proper time at
      // distance r runs at √(1 − Rs/r) of coordinate time, so as the lens closes
      // on the well the whole disk is *heard* to slow. Applied to the rate, never
      // to the accumulator — scrolling back up must not rewind the fluid, and a
      // per-radius factor would wind the inner rim against the outer edge into
      // hash within a minute (see the flow note in `bhDisk`).
      const dilate = Math.sqrt(
        Math.max(1 - rs / Math.max(distance, rs * 1.02), 0.02),
      )
      flow.current +=
        Math.min(delta, 0.1) * (0.22 + swallow.drain * 4.6 + swallow.surge * 7.2 + reactorControl.lawMix.CHAOS * 3) * dilate * (1 - reactorControl.lawMix.VACUUM * 0.92)

      /*
       * How hard the disk is burning — and it never stops burning.
       *
       * The two terms below are the *room's* contributions: the corridor's own
       * ignition, and the ending. Both are zero for the first three quarters of the
       * page, and since every emissive term in the pass is multiplied by this, the
       * well was drawn dark for exactly as long as it was drawn at all. `holeGlowFor`
       * is the floor under them — the nucleus's own accretion, which is what a
       * galaxy's middle is doing whether or not anyone is flying toward it.
       */
      const charge =
        Math.max(
          holeGlowFor(build) * NUCLEUS_CHARGE,
          THREE.MathUtils.smoothstep(build, 0.78, 0.96) *
            (0.22 + power * 0.9 + reactorControl.uplink * 0.5),
          swallow.amount * 0.7,
        ) *
        (1 + swallow.suction * 1.15)

      holeEffect.setSteps(GEODESIC_STEPS[fidelity])
      holeEffect.uniform('uCam').value.copy(camera.position)
      holeEffect.uniform('uToClip').value.copy(scratch.toClip)
      holeEffect.uniform('uRayBasis').value.copy(scratch.rayBasis)
      holeEffect.uniform('uHole').value.copy(holeCenter)
      holeEffect.uniform('uRs').value = rs
      holeEffect.uniform('uSpin').value = HOLE_SPIN
      holeEffect.uniform('uCapturePro').value = captureRs(HOLE_SPIN)
      holeEffect.uniform('uCaptureRetro').value = captureRsRetro(HOLE_SPIN)
      holeEffect.uniform('uAxis').value.copy(scratch.axis)
      holeEffect.uniform('uDiskX').value.copy(scratch.diskX)
      holeEffect.uniform('uDiskY').value.copy(scratch.diskY)
      holeEffect.uniform('uInner').value = iscoRs(HOLE_SPIN) * rs
      /*
       * The disk's outer edge, in metres, and only a little of it is scroll.
       *
       * The expansion term used to be worth 45% on the drain, which was how the
       * disk grew while `RS_OPEN` was small. `RS_OPEN` now carries that growth —
       * `rs` more than doubles across the ending — so the same 45% on top put the
       * outer edge at 35 m against a corridor 24 m long, i.e. a glowing sheet
       * stretching well behind the lens. Trimmed to 18%: the disk stays about ten Rs
       * across in its own units, which is what `DISK_OUTER_RS` is documented to be,
       * and the growth the visitor sees is the well's, not the disk's.
       */
      holeEffect.uniform('uOuter').value = Math.min(
        DISK_OUTER_RS * rs * (1 + swallow.drain * 0.18 + swallow.suction * 0.15),
        /*
         * ...but never past the lens, which the 18% above did not settle. `rs` more
         * than doubled after that trim and swallowed the saving: at the crossing it
         * reaches ~2.7 m, so ten Rs of disk is 32 m against a lens parked at
         * `PLUNGE_RADIUS`, 10.2 m out. The camera was ending the page three Rs deep
         * *inside* its own accretion disk, and what a disk draws from in there is not
         * a disk — it is a foreground wing with no outer edge, which is the formless
         * brown fog over the left half of both finale screenshots. James et al. gave
         * Gargantua 4.6 to 9.4 Rs, a 2:1 annulus, with the camera well outside it.
         *
         * 0.72 of the lens's own distance keeps the object in front of the observer
         * at every stop and gives the disk back an edge. A no-op for the whole
         * corridor: on the establishing shot ten Rs is 0.78 m against a ceiling of
         * 23 m, and at the bottom of the corridor 2.4 m against 8.1 m.
         */
        distance * 0.72,
      )
      holeEffect.uniform('uMask').value = mask
      /*
       * The photon ring's width. `ringWidthFor` carries the reasoning; the only
       * thing decided here is which edge of the D the pixel floor is fitted to, and
       * it is the prograde one — `apparent` is the retrograde edge, and the
       * flattened side of the D is `captureRs / captureRsRetro` of it.
       */
      holeEffect.uniform('uRingWidth').value = ringWidthFor(
        apparent * (captureRs(HOLE_SPIN) / captureRsRetro(HOLE_SPIN)),
        state.size.height,
      )
      /*
       * The near guard, in the same window-space depth the depth texture holds.
       *
       * Almost all the way to the singularity, with the soft edge a tenth short —
       * both computed in metres by `windowDepth` above. The gate is *at* the well
       * so it clears both and is bent around it, which is right; everything the
       * corridor contains is inside them, which is also right, because the corridor
       * is in front of the well and nothing in front of a well is lensed by it.
       *
       * The pair replaced one line at seven tenths with the soft edge written as
       * `uNearGuard - 0.004`, and three thousandths of window depth at this lens is
       * most of the corridor: everything from about fifteen metres out was inside
       * the transition. That did not matter while the guard only decided whether to
       * *overwrite* a fragment, because the things it was protecting sat at reading
       * distance and were clear of the band anyway. It matters now that the same
       * line decides whether a bent ray may *fetch* one (see the guard at the end of
       * `bhSky`): every body in the corridor landed somewhere inside that band and
       * came back as a half-strength ghost of itself lensed beside the nucleus while
       * the body itself stood untouched elsewhere in the frame.
       *
       * The width is `LENS_NEAR`/`LENS_FAR` rather than a pair of numbers written
       * here, because the band's edges are a *rule* about what the well may lens
       * and not a fit to this shot — see `blackHole.ts`, where the rule and the
       * measurement that forces it are recorded together. The first attempt at
       * this pair was fitted to the establishing frame and read 0.86/0.97, which
       * left Saturn at 0.933 of the lens's own distance sitting inside the
       * transition: three quarters of its ghost survived, rings and all, hanging
       * above the nucleus on the opening shot.
       */
      const projection = camera.projectionMatrix.elements
      holeEffect.uniform('uNearGuard').value = windowDepth(
        projection,
        distance * LENS_FAR,
      )
      holeEffect.uniform('uNearSoft').value = windowDepth(
        projection,
        distance * LENS_NEAR,
      )
      /*
       * Hold the guard to the room's remaining span, not raw scroll.
       *
       * `amount` opens the mask and grows Rs; `radius` is how much corridor is
       * still standing. Lifting on amount alone let the disk overwrite wires that
       * had not yet fallen in. Tied to radius, protection lasts until the field
       * has actually taken the room.
       */
      /*
       * Re-fitted when `radius` moved onto the drain. The window is authored in
       * *scroll*, not in radius: protection has to last until the field has
       * actually taken the room, and the new curve reaches any given span
       * earlier — 0.12/0.55 against it would have ended the guard at swallow
       * 0.77 rather than 0.91 and let the disk overwrite geometry that had not
       * fallen in yet, which is the exact regression the note above records.
       */
      holeEffect.uniform('uDepthGuard').value = (1 - swallow.drain) ** 2

      holeEffect.uniform('uSwallow').value = swallow.amount
      /*
       * The bend's own schedule — see `uLensGain` in the effect for why it is not
       * the tide's. Six percent through the corridor, which is a nucleus that sits
       * *in* its sky rather than on it, and full once the ending is underway.
       * Driven off `drain` rather than off `build` so it opens for whichever law
       * got there: VISCOUS by scroll, CHAOS and VACUUM on their own clocks.
       */
      holeEffect.uniform('uLensGain').value = 0.06 + swallow.drain * 0.94
      /*
       * The crossing, at nearly full authority.
       *
       * Held at 0.12 before, because at full strength the ending was an empty
       * frame. It was empty because the pass applied one `survives` to everything
       * it drew, so the eclipse took the disk, the sky and the photon ring out
       * together and there was nothing left to be the last thing. The pass now
       * schedules the ring after the rest (see `ringSurvives`), so this can do what
       * it is for: 0.85 leaves the disk at a sixth of its brightness and the
       * filament at four tenths, which is the ending — a closing ring on black —
       * rather than a portrait that never resolves.
       */
      holeEffect.uniform('uEclipse').value = swallow.crossing * 0.85
      holeEffect.uniform('uFlow').value = flow.current
      // The crossing cools the disk before it takes the light: charge fades and
      // the palette slides toward ink, so the ending is a dimming and a reddening
      // rather than a cut to black.
      holeEffect.uniform('uCharge').value =
        charge *
        (1 - swallow.crossing * 0.35) *
        // VACUUM starves the disk as well as draining its hue: an empty sky is
        // fed by a quieter well.
        (1 - reactorControl.lawMix.VACUUM * 0.78) *
        (1 + reactorControl.lawMix.CHAOS * 0.5)
      holeEffect.uniform('uSuction').value = swallow.suction

      /*
       * The palette, read as temperature.
       *
       * The room is amber and champagne, so the disk is too: the outer flow keeps
       * the corridor's accent, the inner rim runs pale toward the ink, and the
       * limb rushing at the lens goes past ink toward white with the faintest cool
       * lean. A literal blackbody ramp would put a blue-white wedge in a room that
       * has no blue in it anywhere — physically correct and completely foreign.
       */
      /*
       * Re-fitted against the reference render's own ramp rather than against the
       * room's accent, because the old triple was brown in linear light and brown is
       * exactly what it drew. `THREE.Color.set` converts sRGB on the way in, and in
       * linear #bd6d3e is R:G:B = 1 : 0.29 : 0.10 against the 1 : 0.064 : 0.006 of
       * the #bf3507 the tint ramp in the pass cites as its outer arc — seventeen
       * times too much blue, and that ratio is the whole of the difference between
       * amber and mud. Same fault in #6a2a14 at 1 : 0.156 : 0.047. The hue is what is
       * being corrected here; the *values* are the disk's own brightness law's job.
       */
      scratch.hot.set('#fff1d8')
      scratch.cool.set('#c85212')
      scratch.chill.copy(sceneColors.ink).lerp(WHITE, 0.5 * (1 - swallow.crossing * 0.6))
      // The cold end of the Doppler ramp: a receding limb does not go blue in
      // this room, it burns down to ember and then toward ink.
      scratch.ember.set('#5a1204')
      /*
       * Law wear on the well itself.
       *
       * The laws recolour the sky and the worlds (`CosmicWorld`); the disk the
       * sky is falling into has to answer the same law or the frame disagrees
       * with itself. CHAOS spends the whole ramp on ember-red over black — the
       * hot rim, the cool flow and both Doppler ends — and VACUUM drains it to
       * a pale, cold disc and dims the feed, which is what an empty room orbits.
       */
      const chaosMix = reactorControl.lawMix.CHAOS
      const vacuumMix = reactorControl.lawMix.VACUUM
      if (chaosMix > 1e-3) {
        scratch.hot.lerp(CHAOS_HOT, chaosMix * 0.85)
        scratch.cool.lerp(CHAOS_COOL, chaosMix * 0.9)
        scratch.chill.lerp(CHAOS_CHILL, chaosMix * 0.85)
        scratch.ember.lerp(CHAOS_EMBER, chaosMix * 0.9)
      }
      if (vacuumMix > 1e-3) {
        scratch.hot.lerp(VACUUM_HOT, vacuumMix * 0.85)
        scratch.cool.lerp(VACUUM_COOL, vacuumMix * 0.85)
        scratch.chill.lerp(VACUUM_COOL, vacuumMix * 0.95)
        scratch.ember.lerp(VACUUM_EMBER, vacuumMix * 0.85)
      }
      holeEffect.uniform('uHot').value.copy(scratch.hot)
      holeEffect.uniform('uCool').value.copy(scratch.cool)
      holeEffect.uniform('uChill').value.copy(scratch.chill)
      holeEffect.uniform('uEmber').value.copy(scratch.ember)
      holeEffect.uniform('uVoid').value.copy(sceneColors.abyss)
    }

    const bloomEffect = bloom.current
    if (bloomEffect) {
      /*
       * Bloom is reserved for the three moments the room actually emits light:
       * flying through the optic's core, the portal powering on, and the well
       * taking the room in. Left at a constant it would simply make everything
       * slightly milky, which is how bloom usually ends up looking like a preset.
       *
       * Once the geodesic pass is drawing the disk, bloom only kisses the ring —
       * stacking a heavy bloom on top of an already-HDR well washed the shadow to
       * grey and fought the hole for the same pixels (and flashed black when the
       * luminance buffer went empty for a frame).
       */
      /*
       * ...and it stands down on the shadow, not on a scroll value.
       *
       * This used to ride the finale's build ramp and cap the room's terms at a
       * tenth of themselves. A tenth is not nothing when one of those terms is
       * `surge * 1.8`: `surge` is `suction` squared and `suction` peaks at 1.62, so
       * at the third gulp — the exact stop where the shadow already covers the
       * viewport — half a unit of bloom was still being spread across an event
       * horizon, and the darkest thing the site draws measured tan grey. The middle
       * of this object has to be the darkest thing in frame; there is no reading of
       * it in which that is negotiable.
       *
       * `apparent` is the honest trigger, and it is the same line the mask is sized
       * from. Under a twelfth of a half-frame the well is a jewel in a galaxy and
       * the room owns the light; by a third of one the shadow is the largest thing
       * in frame and there is nothing left for a room bloom to be about. A window
       * fitted to the *end* of the rail instead — where the shadow is nearly two
       * half-frames across — leaves the stand-down at a fifth through the gulps,
       * which is the stretch that needed it.
       */
      const holeOwns = THREE.MathUtils.smoothstep(apparent, 0.08, 0.32)
      /*
       * Crossfaded to a kiss, not scaled toward one.
       *
       * The room's bloom used to be multiplied by `1 - holeOwns * 0.9`, and a tenth
       * of `surge * 1.8` is not a tenth of nothing: `surge` is `suction` squared and
       * `suction` peaks at 1.62, so the third gulp still spread half a unit of bloom
       * over an event horizon and the shadow's interior measured tan grey. A lerp to
       * a fixed 0.16 ends that outright — past the stand-down the only bloom in the
       * chain is the one the ring is entitled to, and the gulp's own flash lives in
       * the disk, where `uSuction` already spends it.
       *
       * 0.08 is still the floor on the room's side: an empty luminance mip blanks
       * the composer for a frame, and the corridor's quiet stretches can produce one.
       */
      bloomEffect.intensity = THREE.MathUtils.lerp(
        Math.max(
          0.08,
          (0.35 +
            transit * transit * 1.5 +
            power * 0.55 +
            swallow.surge * 1.8 +
            swallow.pull * 0.45 +
            reactorControl.uplink * 0.45) *
            // VACUUM gets no halo either — a starved disk on a black sky has
            // nothing for a haze to feed on.
            (1 - reactorControl.lawMix.VACUUM * 0.4),
        ),
        0.16,
        holeOwns,
      )
      // CHAOS runs hot, so it lowers the bar for what counts as a highlight;
      // VACUUM raises it — the few lights left are hard points, not a glow.
      bloomEffect.luminanceMaterial.threshold =
        0.62 -
        liveLaw.heat * 0.22 +
        holeOwns * 0.18 +
        reactorControl.lawMix.VACUUM * 0.12
    }

    const aberrationEffect = aberration.current
    if (aberrationEffect) {
      /*
       * Lens distortion as a function of the swallow, so falling into the well
       * bends the image at its edges — and unbends it exactly if the visitor
       * scrolls back out, because like every other layer of that ending this is a
       * pure function of scroll position and not a triggered animation.
       */
      /*
       * Restrained since the well started lensing for real: the geodesic pass
       * already bends the image, and a fringe on top of a bend reads as a broken
       * encode rather than as glass. Gulps get a tiny extra fringe only.
       *
       * "Tiny" is what the gulp term was supposed to be and was not. `surge` is
       * `suction` squared and `suction` peaks at 1.62, so 0.003 was worth 0.0079 at
       * the third gulp — three times the whole of `grip`, and eight pixels of split
       * on a 1024-wide frame. On the wound-up starfield behind the well, where every
       * star is a pixel or two wide, that is not glass: it is a field of red and
       * cyan confetti, and it was the single loudest artefact in the ending. Sized
       * against `surge`'s real peak now, so the beat lands at about the same fringe
       * `grip` carries.
       */
      /*
       * `surge` trimmed again, for the same reason it was trimmed the first time and
       * one the first pass missed: it is not merely large at its peak, it is large
       * *where the frame is busiest*. The third gulp is the stop where the room's
       * type and shards are wound into filaments a pixel or two wide right across
       * the lensed region, and 0.0011 against a peak of 2.62 put four pixels of
       * split on every one of them — magenta and cyan piping along every strand.
       * At 0.0006 the beat still reads as the glass flexing and the filaments stay
       * one colour.
       */
      const amount = sceneState.distortion *
        (swallow.grip * 0.0022 + swallow.surge * 0.0006)
      aberrationEffect.offset.set(amount, amount * 0.6)
    }
  })

  return (
    <EffectComposer
      // The scene renders linear and is mapped by the last pass below.
      frameBufferType={THREE.HalfFloatType}
      multisampling={SAMPLES[fidelity]}
      /*
       * Depth, for one reason only: the black hole pass has to know what the room
       * put in *front* of the well so it can leave it alone. `BlackHoleEffect`
       * declares `EffectAttribute.DEPTH`, which is what makes the composer allocate
       * and wire the depth texture; this flag makes the render target it is
       * attached to carry a depth attachment in the first place.
       *
       * Note this is not the depth buffer a depth-of-field pass would want, and the
       * distinction is why one is here and the other is not: most of this room
       * writes no depth at all, so what the buffer holds is exactly the set of
       * opaque surfaces — settled console plates, the gate's structure — that
       * genuinely occlude. A blur driven off it would blur nothing; an occlusion
       * test against it is right for precisely the same reason.
       */
      depthBuffer
      enableNormalPass={false}
    >
      {/*
        First, and therefore its own pass and *before* bloom.

        `BlackHoleEffect` declares itself a convolution, which is what makes
        `@react-three/postprocessing` give it an `EffectPass` of its own instead of
        merging it into the pass below. Order then does the rest: bloom's
        luminance pass reads whatever the previous pass wrote, so mounted here the
        disk, the photon ring and the beamed limb all glow. Mounted after bloom —
        or merged into the same pass — the brightest object the site draws would
        have been the only one with no light spilling off it.
      */}
      <BlackHole ref={hole} />
      <Bloom
        ref={bloom}
        // Mipmap blur is the cheap, wide, artefact-free kernel — the alternative
        // is a fixed kernel that either bands or costs several extra passes.
        mipmapBlur
        intensity={0.35}
        luminanceThreshold={0.62}
        luminanceSmoothing={0.22}
        radius={0.72}
      />
      {/* Offset is driven per frame above; the modulation defaults are what the
          effect ships with, and its prop type does not accept them as optional. */}
      <ChromaticAberration ref={aberration} offset={[0, 0]} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}

export default CinemaLayer
