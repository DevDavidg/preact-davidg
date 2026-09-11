/**
 * The flyby's framing, checked without a canvas.
 *
 * Three worlds sweep past the lens down the corridor, and the thing that goes wrong
 * with them is not physical — it is compositional, and it is invisible to every
 * other check in this directory. The first version of the pass hung each world on
 * the axis and swept it outboard only as the lens drew level, so the whole approach
 * — the stretch where the disc grows from a speck to two thirds of the frame —
 * happened with a bright globe sitting exactly behind the copy. Nothing failed. It
 * typechecked, it built, `check-cosmos` passed, and the corridor was unreadable.
 *
 * So this file asserts the composition: that a world large enough to matter is never
 * in the middle of the frame, that each one really does come close (a flyby that
 * stays small is the opposite failure and just as silent), and that no world's body
 * grows through a colonnade column.
 *
 * Measured through the same functions the Rig uses — `cameraProgressFor` for the
 * pacing remap, `corridorLateral` for the lane, `CAMERA_PATH`/`TARGET_PATH` for the
 * shot — so a retune of the camera moves these numbers with it rather than leaving
 * them describing a camera that no longer exists.
 *
 *   pnpm exec tsx scripts/check-planets.ts
 */
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {
  ARTIFACTS,
  CAMERA_PATH,
  cameraProgressFor,
  corridorLateral,
  TARGET_PATH,
} from '../src/scene/layout'
import {
  earthOrbitAngle,
  earthPass,
  orbitAround,
  PLANETS,
  planetAnchor,
} from '../src/scene/planetSpec'
import { BASE_FOV } from '../src/scene/viewportFit'

const SAMPLES = 1201

/**
 * Bay depths and half-depth, from `Structures.tsx`: five bays, 0.86 m-deep bases.
 * Columns stand at x = ±3.5, so depth is the only axis a sweep cannot escape along.
 */
const BAYS = [6.4, 2.2, -2.0, -5.6, -9.2]
const BAY_HALF_DEPTH = 0.43

/**
 * The copy's box on screen, in half-widths and half-heights, and what may enter it.
 *
 * A box and not a column, and the distinction is the whole reason the worlds have a
 * `y` at all. The console copy — heading, body, two action rows — occupies the middle
 * of the frame both ways: roughly 0.40 of a half-width either side of centre and 0.42
 * of a half-height. A world sitting above that box does not obscure it, and since the
 * frame is 1.78 half-widths wide but only 1 half-height tall, lifting a world clear is
 * cheaper than pushing it sideways. Testing a full-height column instead rules out
 * placements that are demonstrably fine on screen.
 *
 * `BIG` is the disc size at which a world stops being scenery and starts being a
 * backdrop. Under it a world may cross the copy, because at under a third of a
 * half-height it reads as a distant body behind type rather than as a wall.
 */
const COPY_HALF_WIDTH = 0.4
const COPY_HALF_HEIGHT = 0.42
const BIG = 0.3

interface Framed {
  build: number
  depth: number
  x: number
  y: number
  radius: number
  /** Metres to the nearest console plate ahead of the lens, or Infinity if none. */
  plate: number
  /** How far through Earth's lap the lens is; 0 for every build outside it. */
  pass: number
}

const POSITION = new THREE.Vector3()
const TARGET = new THREE.Vector3()
const ANCHOR = new THREE.Vector3()
const ORBIT = new THREE.Vector3()
const REL = new THREE.Vector3()
const FORWARD = new THREE.Vector3()
const RIGHT = new THREE.Vector3()
const UP = new THREE.Vector3()
const WORLD_UP = new THREE.Vector3(0, 1, 0)

/** Where a world lands on screen at this build, in half-widths and half-heights. */
const frame = (index: number, build: number, aspect: number): Framed => {
  const lane = corridorLateral(aspect)
  CAMERA_PATH.getPointAt(cameraProgressFor(build), POSITION)
  TARGET_PATH.getPointAt(build, TARGET)
  // The lane MULTIPLIES, exactly as `Rig.tsx` and `consoles/placement.ts` apply it.
  // `+=` put this measuring camera a metre to starboard of the real one — and since
  // `corridorLateral` returns exactly 1.0 at every landscape aspect, at all three
  // tested shapes — which certified two worlds as clear of the copy while they were
  // 0.20 half-heights inside it.
  POSITION.x *= lane
  TARGET.x *= lane
  /*
   * The lap around Earth, reproduced exactly as `Rig` flies it.
   *
   * Without this the file measures a camera that is not being rendered: for the
   * whole of Earth's pass the real lens is somewhere on a circle around the planet,
   * not on the rail. Note the anchor and the pass are both read from the *rail's* z
   * — the un-orbited path point — which is the same rule the Rig follows and the
   * reason `sceneState.railZ` exists.
   */
  const railZ = POSITION.z
  const pass = earthPass(railZ)
  if (pass > 0.0005 && pass < 0.9995) {
    planetAnchor(PLANETS[0], railZ, ORBIT)
    orbitAround(POSITION, ORBIT, earthOrbitAngle(pass))
    TARGET.lerp(ORBIT, Math.sin(Math.PI * pass) * 0.92)
  }
  FORWARD.copy(TARGET).sub(POSITION).normalize()
  RIGHT.crossVectors(FORWARD, WORLD_UP).normalize()
  UP.crossVectors(RIGHT, FORWARD)
  const spec = PLANETS[index]
  // Rail z again, captured before the orbit moved POSITION.
  planetAnchor(spec, railZ, ANCHOR)
  REL.copy(ANCHOR).sub(POSITION)
  const depth = REL.dot(FORWARD)
  // A half-frame-height, in metres, at this depth. The frame is two of them tall
  // and 2·aspect of them wide, so a length divided by it is in half-heights.
  const halfHeight = Math.max(depth, 1e-4) * Math.tan(THREE.MathUtils.degToRad(BASE_FOV) / 2)
  let plate = Infinity
  for (const slot of ARTIFACTS) {
    const ahead = POSITION.z - slot.position[2]
    if (ahead > 0.2) plate = Math.min(plate, ahead)
  }
  return {
    build,
    depth,
    x: REL.dot(RIGHT) / (halfHeight * aspect),
    y: REL.dot(UP) / halfHeight,
    radius: spec.size / halfHeight,
    plate,
    pass,
  }
}

const report: string[] = []

// Desktop and laptop shapes. `corridorLateral` reads aspect, so the lane — and with
// it every horizontal number below — is different at each one.
for (const aspect of [16 / 9, 1.6, 4 / 3]) {
  for (let index = 0; index < PLANETS.length; index += 1) {
    const spec = PLANETS[index]
    let peak: Framed | null = null
    let whole: Framed | null = null
    let closest = Infinity
    /*
     * The closest a large disc ever gets to the copy box, signed. Not merely "no
     * intrusion" but a margin, because every placement in `planetSpec` is a
     * numerical optimum and an optimum sits exactly on its constraint: the raw
     * search answer for Earth grazes the box at 0.001 half-heights, and the next
     * camera tweak would fail it silently.
     */
    let slack = Infinity
    const intrusions: Framed[] = []

    for (let i = 0; i < SAMPLES; i += 1) {
      const shot = frame(index, i / (SAMPLES - 1), aspect)
      if (shot.depth <= 0.1) continue
      /*
       * Two different notions of "in shot", because the loose one is worthless on
       * its own.
       *
       * A world sweeping past the lens ends up beside it — depth near zero, x far
       * outside the frame — and the apparent-size arithmetic divides by that depth,
       * so an off-screen world reports a disc twenty times the frame. Merely
       * *touching* the frame edge is no better: an earlier version of this file
       * certified a world as "coming close" on a disc of 0.51 half-heights whose
       * centre sat 1.28 half-widths off screen, overlapping the border by a
       * hundredth of a half-width. On the real frame that is a hairline, and the
       * screenshot of the beat it was supposed to own showed no moon at all.
       *
       * So `centred` — the centre inside the frame, hence at least half the body
       * visible — is what the size bounds are measured over, and `whole` — the
       * entire disc inside the frame *and* clear of the copy — is what proves the
       * visitor actually gets to look at the planet.
       */
      const centred = Math.abs(shot.x) < 1 && Math.abs(shot.y) < 1
      /*
       * Circle against box, in half-height units: the distance from the disc's
       * centre to the nearest point of the copy box. The horizontal leg is scaled by
       * aspect because `x` is in half-widths while `radius` is in half-heights, and
       * a metre is a metre — without it the test would be looser horizontally than
       * the screen actually is.
       */
      const dx = Math.max(0, Math.abs(shot.x) - COPY_HALF_WIDTH) * aspect
      const dy = Math.max(0, Math.abs(shot.y) - COPY_HALF_HEIGHT)
      const gap = Math.hypot(dx, dy) - shot.radius
      const clearsCopy = gap >= 0
      /*
       * ...and only if the world is in FRONT of the plate the copy sits on.
       *
       * This is the clause that lets the worlds be close at all. The copy does not
       * float in space — it renders on a console plate that is opaque and, since the
       * depth-occluder fix, writes depth. A world *behind* that plate is occluded by
       * it and cannot obscure a single letter, so forbidding it there was protecting
       * nothing while costing a quarter of every world's apparent size. Measured:
       * allowing it takes Earth's disc from 0.76 to 0.95 of a half-height, Saturn's
       * from 0.48 to 0.63 and the moon's from 0.48 to 0.60.
       *
       * The margin is 0.3 m because a plate is not a plane at its own z — it has a
       * frame and a rim standing proud of it — and a world level with a plate is a
       * world the plate cannot be relied on to hide.
       */
      /*
       * ...and the copy box does not exist while the lens is off the rail.
       *
       * During Earth's lap the camera leaves the corridor and aims at the planet, so
       * Earth is deliberately dead centre and there is no console copy being read to
       * protect — the shot *is* the planet. Holding the box up through that window
       * asserts a composition the page is not trying to make, and it fails on the
       * one frame the whole detour exists for.
       */
      const onRail = index !== 0 || shot.pass <= 0.02 || shot.pass >= 0.98
      const inFront = onRail && shot.depth < shot.plate - 0.3
      // Only an intrusion if some of the body is on screen to obscure the copy with —
      // and the same window is where the margin above is worth measuring.
      if (shot.radius > BIG && inFront && Math.abs(shot.x) - shot.radius / aspect < 1) {
        if (!clearsCopy) intrusions.push(shot)
        slack = Math.min(slack, gap)
      }
      if (centred) {
        closest = Math.min(closest, shot.depth)
        if (!peak || shot.radius > peak.radius) peak = shot
      }
      if (
        clearsCopy &&
        Math.abs(shot.x) + shot.radius / aspect < 1 &&
        Math.abs(shot.y) + shot.radius < 1 &&
        (!whole || shot.radius > whole.radius)
      ) {
        whole = shot
      }
    }

    assert.ok(peak, `world ${index} never renders with its centre in frame`)
    const label = `world ${index} @ ${aspect.toFixed(2)}`

    /*
     * It has to actually come close, and "close" is the pass rather than the
     * approach. The complaint that started this rework was that the planets looked
     * far away; the worst centred disc these placements produce is 0.41 (the moon
     * at 4:3), so 0.40 is the ratchet with about 3% of headroom under it.
     */
    assert.ok(
      peak.radius > 0.4,
      `${label} never reads as a near body — largest centred disc ` +
        `${peak.radius.toFixed(2)} of a half-height at ${peak.depth.toFixed(2)} m`,
    )
    /*
     * ...and the visitor gets to see the whole of it, off the copy, on every shape.
     *
     * A 4:3 frame is 25% narrower in half-widths for the same half-height, so it
     * gets its own number rather than the exemption it used to get — that exemption
     * is precisely what let Earth ship with a 4:3 whole-disc of exactly zero while
     * this file reported it as passing.
     *
     * 0.22 rather than 0.25 since the lap: Saturn's best fully-framed moment used to
     * fall early, while the lens was still running straight down the rail, and the
     * detour round Earth moves the camera through exactly that stretch. Its own beat
     * at build 0.33 is untouched — 0.35 on the wide shapes — so this is the narrow
     * frame losing an incidental early view, not Saturn's pass getting worse.
     */
    assert.ok(
      index === 0 || (whole && whole.radius > (aspect >= 1.6 ? 0.33 : 0.22)),
      `${label} is never fully in frame and clear of the copy — best ` +
        `${(whole?.radius ?? 0).toFixed(2)} of a half-height`,
    )
    // Daylight between the disc and the copy, not merely the absence of overlap.
    assert.ok(
      slack > 0.03,
      `${label} grazes the copy — ${slack.toFixed(3)} of a half-height between the ` +
        `disc and the box, which is inside the rounding on these placements`,
    )
    // ...and it must not become the frame. Past a half-height the disc is taller
    // than the frame it is in and there is no composition left to speak of.
    assert.ok(
      peak.radius < 1.05,
      `${label} swallows the frame — disc ${peak.radius.toFixed(2)} of a ` +
        `half-height, centred, at ${peak.depth.toFixed(2)} m`,
    )
    // The near plane is 0.1 m; a body still centred in shot that reaches it gets
    // sliced open on screen.
    assert.ok(
      closest - spec.size > 0.35,
      `${label} clips the lens while still in shot — surface ` +
        `${(closest - spec.size).toFixed(2)} m out`,
    )
    /*
     * Earth is judged on its lap instead of on the copy box.
     *
     * The camera leaves the rail to go round it, so "fits in frame beside the copy"
     * is the wrong question — the right one is whether the detour was worth taking.
     * The disc has to be genuinely large while the lens is going round it, which is
     * the entire point of leaving.
     */
    if (index === 0) {
      assert.ok(
        peak.radius > 0.55,
        `${label} is small on its own lap — largest centred disc ` +
          `${peak.radius.toFixed(2)} of a half-height at ${peak.depth.toFixed(2)} m`,
      )
    }

    // And the composition itself.
    assert.equal(
      intrusions.length,
      0,
      `${label} crosses the copy while large — ` +
        intrusions
          .slice(0, 3)
          .map(
            (t) =>
              `build ${t.build.toFixed(3)}: x ${t.x.toFixed(2)} y ${t.y.toFixed(2)}, ` +
              `disc ${t.radius.toFixed(2)}, ${t.depth.toFixed(2)} m`,
          )
          .join('; '),
    )

    // Every shape, not just the wide one: the `if (aspect === 16/9)` this replaces
    // is what hid the 4:3 whole-disc of zero that the assertion above now forbids.
    report.push(
      `w${index}@${aspect.toFixed(2)} whole ${(whole?.radius ?? 0).toFixed(2)} ` +
        `peak ${peak.radius.toFixed(2)} (${peak.depth.toFixed(1)}m) slack ${slack.toFixed(3)}`,
    )
  }
}

// The colonnade. Depth is the axis the sweep cannot escape along, so a world whose
// sphere overlaps a bay's depth span can grow through a column at some x.
for (let index = 0; index < PLANETS.length; index += 1) {
  const spec = PLANETS[index]
  /*
   * Saturn's rings reach 2.27 body radii, but the depth they occupy is not that.
   * `rotation.set(tilt, spin, 0)` composes as Rx·Ry, so the ring's normal tilts in
   * the y-z plane and the spin turns it about its own axis without changing its
   * z-extent: the footprint along depth is the outer radius times sin(tilt), which
   * at 26.9° is under half of it. Taking the full radius instead — the obvious
   * "worst case" — makes the assertion unsatisfiable, since it would demand 5.2 m
   * between bays that stand 3.6 m apart.
   */
  const reachZ = Math.max(
    spec.size,
    spec.ring ? spec.size * 2.27 * Math.abs(Math.sin(spec.tilt)) : 0,
  )
  for (const bay of BAYS) {
    const clear =
      Math.abs(spec.at[2] - bay) - (reachZ + BAY_HALF_DEPTH)
    // A margin and not a touch: `> 0` let a size bump shave this to nothing, and the
    // colonnade is what actually caps worlds 1 and 2. A tenth of a body radius.
    assert.ok(
      clear > 0.15,
      `world ${index} at z ${spec.at[2]} grows through the bay at z ${bay} — ` +
        `${clear.toFixed(2)} m of clearance`,
    )
  }
}

console.log(`planets ok — ${report.join(', ')}`)
