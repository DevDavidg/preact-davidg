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
  DISK_OUTER_RS,
  HOLE_SPIN,
  holeAxis,
  holeCenter,
  holeGateFor,
  holeRadiusFor,
  iscoRs,
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
 * The far end of the temperature ramp, in the renderer's working space.
 *
 * The composer runs linear, and `sceneColors` are already linear because
 * `THREE.Color.set` converts on the way in. A literal `vec3(1.0)` written in the
 * shader would be the same value, but keeping it here means the disk's hottest
 * point is mixed the same way as every other colour in the scene.
 */
const WHITE = new THREE.Color(1, 1, 1)

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

    const holeEffect = hole.current
    if (holeEffect) {
      const camera = state.camera
      const rs = holeRadiusFor(build, sceneState.swallow)

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
       * Derived from the shadow's own apparent size — the angle 2.6 Rs subtends
       * from here, expressed in half-frame-heights through the lens's actual
       * field of view — so the mask tracks the object rather than a scroll value,
       * and neither a wider lens nor a taller viewport can leave the ring hanging
       * outside the region that draws it.
       *
       * The multiplier is the one part of this that belongs to the story rather
       * than to the geometry. While the room is still standing the mask has to
       * cover the disk (about three retro-shadow radii) without reaching the
       * contact console at reading distance. Once the swallow begins it opens,
       * because from there on the room bending around the well is the ending.
       */
      const distance = camera.position.distanceTo(holeCenter)
      // The mask is sized off the shadow's *worst* side: with spin, the
      // retrograde edge of the D reaches further than the prograde one, and a
      // mask fit to the smaller side would clip the ring on the wide side.
      const shadow = captureRsRetro(HOLE_SPIN) * rs
      const halfFov = THREE.MathUtils.degToRad(
        camera instanceof THREE.PerspectiveCamera ? camera.fov : 42,
      )
      const subtended = Math.atan2(shadow, Math.max(distance, shadow * 1.02))
      const apparent =
        Math.tan(Math.min(subtended, 1.45)) / Math.tan(halfFov / 2)

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
        delta * (0.22 + swallow.drain * 4.6 + swallow.surge * 7.2) * dilate

      const charge = Math.max(
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
      holeEffect.uniform('uOuter').value =
        DISK_OUTER_RS * rs * (1 + swallow.drain * 0.18 + swallow.suction * 0.15)
      holeEffect.uniform('uMask').value = mask
      holeEffect.uniform('uGate').value = holeGateFor(build)
      /*
       * The near guard, in the same window-space depth the depth texture holds.
       *
       * Read straight off the projection matrix rather than derived from `near`
       * and `far`, because window depth is violently non-linear — at this lens
       * twenty-four metres and twenty-one metres are three thousandths apart — and
       * a hand-rolled conversion that drifts from the actual projection would put
       * the line in the wrong place by more than the whole range it has to
       * resolve. Seven tenths of the way to the singularity clears the gate, which
       * stands almost at it, and still catches a console at reading distance.
       */
      const projection = camera.projectionMatrix.elements
      const guardZ = -distance * 0.7
      const guardW = projection[11] * guardZ + projection[15]
      holeEffect.uniform('uNearGuard').value =
        Math.abs(guardW) < 1e-6
          ? 0
          : ((projection[10] * guardZ + projection[14]) / guardW) * 0.5 + 0.5
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
        charge * (1 - swallow.crossing * 0.35)
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
      scratch.hot.set('#ffd4a0')
      scratch.cool.set('#bd6d3e')
      scratch.chill.copy(sceneColors.ink).lerp(WHITE, 0.5 * (1 - swallow.crossing * 0.6))
      // The cold end of the Doppler ramp: a receding limb does not go blue in
      // this room, it burns down to ember and then toward ink.
      scratch.ember.set('#6a2a14')
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
      const holeOwns = holeGateFor(build) * (0.55 + swallow.amount * 0.45)
      // Keep an empty luminance mip from blanking the composer for a frame.
      bloomEffect.intensity = Math.max(
        0.08,
        (0.35 +
          transit * transit * 1.5 +
          power * 0.55 +
          swallow.surge * 1.8 +
          swallow.pull * 0.45 +
          reactorControl.uplink * 0.45) *
          (1 - holeOwns * 0.9),
      )
      // CHAOS runs hot, so it lowers the bar for what counts as a highlight.
      bloomEffect.luminanceMaterial.threshold =
        0.62 - liveLaw.heat * 0.22 + holeOwns * 0.18
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
      const amount =
        swallow.grip * 0.0022 + transit * 0.0012 + swallow.surge * 0.0011
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
