import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Quality } from './capability'
import { holeCenter } from './blackHole'
import { reactorControl } from './control/reactorControl'
import { PLANETS, planetAnchor } from './planetSpec'
import { sceneState, swallowShape } from './sceneState'

const TRAIL = 28
/*
 * Hoisted out of `useFrame` on purpose. These used to be built inside the per-event
 * loop, which meant a `THREE.Color` allocation per event per frame — nine a frame on
 * cinema, for three constants. `lerp` writes into the scratch colour, so the tints
 * themselves are never mutated and can safely be shared.
 */
const COMET_TINT = new THREE.Color('#b8e7ff')
const NOVA_TINT = new THREE.Color('#89c8ff')
const CHAOS_TINT = new THREE.Color('#ff6938')
const VACUUM_TINT = new THREE.Color('#5f7d94')
const ROCK_TINT = new THREE.Color('#ffb072')
/*
 * A volley's flight, and it is also the distance solved. The head is
 * `lerp(start, aim, phase)` with `aim` a world's own anchor, so at phase 1 the rock is
 * exactly on the impact point: the arrival is scheduled by construction and there is
 * nothing to integrate, no broadphase and no contact test.
 *
 * In `age`, not in seconds — `age` runs at 1 + chaos·3.5, so at full CHAOS 3.4 is 0.76 s
 * of wall clock and the ~14 m launch offset below is crossed at about 18 m/s. Between a
 * comet's 3.8 and a nova's 5.5 on purpose: shorter and the streak is a frame of smear,
 * longer and a shower stops feeling like one thing arriving after another.
 */
const ROCK_LIFE = 3.4
/** Scratch for the aim solve. Module scope — a `Vector3` here would be per event, per frame. */
const AIM = new THREE.Vector3()
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 31.7) * 43758.5453
  return x - Math.floor(x)
}

/** A small reusable particle pool: comets, stellar eruptions and hot falling debris. */
export const CosmicEvents = ({ quality }: { quality: Quality }) => {
  const count = quality === 'cinema' ? 9 : 4
  const resources = useMemo(() => {
    const positions = new Float32Array(count * TRAIL * 3)
    const colors = new Float32Array(count * TRAIL * 3)
    const sizes = new Float32Array(count * TRAIL)
    const geometry = new THREE.BufferGeometry()
      .setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage))
      .setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage))
      .setAttribute('aSize', new THREE.BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage))
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: { uPixel: { value: 500 } },
      vertexShader: /* glsl */ `
        attribute float aSize; uniform float uPixel; varying vec3 vColor;
        void main(){
          vec4 p=modelViewMatrix*vec4(position,1.0);
          vColor=color*smoothstep(0.8,2.0,-p.z);
          gl_Position=projectionMatrix*p;
          gl_PointSize=clamp(aSize*uPixel/max(0.2,-p.z),1.0,36.0);
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        void main(){
          vec2 p=gl_PointCoord-0.5; float r=dot(p,p);
          if(r>0.25) discard;
          gl_FragColor=vec4(vColor,exp(-r*22.0)*(1.0-smoothstep(0.15,0.25,r)));
        }`,
    })
    return {
      geometry, material, positions, colors, sizes,
      particles: Array.from({ length: count }, (_, i) => ({
        age: -2 - hash(i + 8) * 20,
        generation: 0,
        /** 0 nova, 1 comet, 2 rock. Rolled at spawn, not derived from `i` — see the loop. */
        kind: 1,
        /** Which world this volley is aimed at, or −1 when it is aimed at the well. */
        body: -1,
        start: new THREE.Vector3(),
        aim: new THREE.Vector3(),
        direction: new THREE.Vector3(),
      })),
      point: new THREE.Vector3(),
      color: new THREE.Color(),
    }
  }, [count])

  useEffect(() => () => {
    resources.geometry.dispose()
    resources.material.dispose()
  }, [resources])

  useFrame(({ camera, size, viewport }, delta) => {
    const chaos = reactorControl.lawMix.CHAOS
    const vacuum = reactorControl.lawMix.VACUUM
    // How far CHAOS has got into taking the worlds apart. Read-only here: the
    // orchestrator publishes it in `advanceCollapse`, and `Planets` reads the same
    // number, which is what keeps the cracks agreeing with the rock coming out of them.
    const burn = sceneState.chaosBurn
    const collapse = swallowShape(sceneState.swallow)
    const dt = Math.min(delta, 0.1)
    resources.material.uniforms.uPixel.value = size.height * viewport.dpr * 0.5
    let brightest = 0
    let brightestAt = -1
    for (let i = 0; i < count; i++) {
      const event = resources.particles[i]
      const previous = event.age
      // VACUUM is not a quieter CHAOS, it is the law under which nothing
      // happens: events freeze mid-flight instead of merely slowing down.
      event.age += dt * (1 + chaos * 3.5) * (1 - vacuum)
      const seed = i * 47 + event.generation * 29
      if (previous < 0 && event.age >= 0) {
        /*
         * Kind is rolled here rather than being `i % 3`, and that one move is the whole
         * asteroid-rain implementation: under CHAOS the same nine slots (four on lite)
         * turn into a shower without a tenth ever being allocated. At chaos 1 the roll
         * takes 84% of respawns, so eight of the nine slots are rock; whatever CHAOS
         * does not claim still splits nova/comet the way it always did.
         */
        event.kind = hash(seed + 11) < 0.2 + chaos * 0.64 ? 2 : i % 3 === 0 ? 0 : 1
        if (event.kind === 2) {
          event.body = Math.floor(hash(seed + 9) * PLANETS.length) % PLANETS.length
          planetAnchor(PLANETS[event.body], camera.position.z, AIM)
          if (burn > 0.15 && hash(seed + 12) < burn) {
            /*
             * Past the burn threshold the world stops being the target and becomes the
             * source: the rock is something the planet has *lost*. Aimed at the well, so
             * what the visitor sees is a body shedding itself down the hole rather than
             * a body fading out. `body = -1` freezes the aim on `holeCenter` instead of
             * re-reading a world that is in the middle of disintegrating.
             */
            event.body = -1
            event.start.copy(AIM)
            event.aim.copy(holeCenter)
          } else {
            /*
             * Infall. Launched high and outboard of the target — up to 8.5 m across, 7
             * to 14 up and 4 to 15 behind — so the streak crosses frame diagonally and
             * terminates on the disc. A rock arriving along the view axis is a dot that
             * gets bigger, which reads as nothing at all.
             */
            event.aim.copy(AIM)
            event.start.set(
              AIM.x + (hash(seed + 1) - 0.5) * 17,
              AIM.y + 7 + hash(seed + 3) * 7,
              AIM.z + 4 + hash(seed + 5) * 11,
            )
          }
        } else {
          event.start.set((hash(seed + 1) - 0.5) * 24, (hash(seed + 3) - 0.5) * 15, -14 - hash(seed + 5) * 20)
            .applyQuaternion(camera.quaternion).add(camera.position)
          event.direction.set(-1.2 - hash(seed + 7) * 2, -0.2 - hash(seed + 8), -1)
            .applyQuaternion(camera.quaternion)
        }
      }
      const nova = event.kind === 0
      const rock = event.kind === 2
      /*
       * The world is still sliding down the corridor while the volley is in the air, so
       * the impact point is re-read every frame rather than frozen at launch.
       * `planetAnchor` is a smoothstep and three adds; two metres of corridor under the
       * lens during the 0.76 s flight moves an anchor ~0.4 m through its 2.2 m sweep,
       * which against a 2.3 m disc is a third of the way off it — a visible miss, and it
       * undoes the entire collision read.
       */
      if (rock && event.body >= 0) planetAnchor(PLANETS[event.body], camera.position.z, event.aim)
      const duration = rock ? ROCK_LIFE : nova ? 5.5 : 3.8
      if (event.age > duration) {
        event.generation++
        event.age = -4 - hash(i + event.generation * 13) * 21
      }
      const phase = Math.max(0, Math.min(1, event.age / duration))
      /*
       * A rock's flight is dim and its arrival is the event, so `phase^8` rather than
       * the nova's raised sine: at phase 0.9 it is still at 0.43 and at 1.0 it is 1 —
       * on screen a streak that detonates, not a streak that glows all the way in.
       * Floored at 0.18 so the streak exists at all on the way down, and it tops out at
       * 1.08 by construction: this feeds `sceneState.flash`, which the planets read as a
       * *weight*, and a flash of 3 would white out a hemisphere.
       */
      const light =
        event.age < 0 ? 0 : rock ? 0.18 + phase ** 8 * 0.9 : Math.sin(phase * Math.PI) ** 2
      const intensity = light * (1 - collapse.crossing) * (1 - vacuum)
      // Impacts contend for the flash channel alongside eruptions — the fireball on a
      // world's own limb is the brightest thing in the scene while it lasts.
      if ((nova || rock) && intensity > brightest) {
        brightest = intensity
        brightestAt = i
      }
      resources.color
        .copy(rock ? ROCK_TINT : nova ? NOVA_TINT : COMET_TINT)
        .lerp(CHAOS_TINT, chaos)
        .lerp(VACUUM_TINT, vacuum)
      for (let j = 0; j < TRAIL; j++) {
        const tail = j / TRAIL
        const point = resources.point.copy(event.start)
        if (nova) {
          const angle = j * 2.39996
          const radius = phase * (0.2 + hash(i * 37 + j) * 2.4)
          point.x += Math.cos(angle) * radius
          point.y += Math.sin(angle) * radius
          point.z += (hash(j + i * 6) - 0.5) * radius
        } else if (rock) {
          /*
           * One event is a volley, not a rock: the 28 trail slots are re-cut as seven
           * rocks of four points each, indexed `j >> 2` and `j & 3`. Same buffer, same
           * draw call, same upload, seven times the objects — and what reads as a shower
           * at fifteen metres is the *count* of streaks, not the length of any one of
           * them. This is why asteroid rain costs nothing on `lite`: the pool never grew,
           * so its four slots are up to 28 streaks instead of 4.
           */
          const which = j >> 2
          const lag = (j & 3) * 0.035
          point.lerp(event.aim, Math.max(0, phase - which * 0.05 - lag))
          /*
           * Lateral scatter, blown out 7.5× over the last twelve percent of the flight —
           * the impact turns a converging volley into an expanding one, and that is the
           * whole of the explosion. No second particle kind and no burst event: the rocks
           * that arrived are the debris. Twelve percent of 0.76 s is 90 ms, five frames
           * at 60 Hz, which is what a detonation should be: the flash damping below is
           * tuned to 55 ms so the light gets there inside it.
           */
          const spread =
            (0.85 + which * 0.4) * (1 + THREE.MathUtils.smoothstep(phase, 0.88, 1) * 6.5)
          point.x += (hash(seed + which * 5 + 1) - 0.5) * spread
          point.y += (hash(seed + which * 5 + 2) - 0.5) * spread * 0.8
          point.z += (hash(seed + which * 5 + 3) - 0.5) * spread
        } else {
          point.addScaledVector(event.direction, Math.max(0, event.age) - tail * 0.65)
        }
        point.lerp(holeCenter, collapse.drain * 0.98)
        point.toArray(resources.positions, (i * TRAIL + j) * 3)
        const gain =
          intensity *
          (nova ? 0.7 : rock ? 1 - (j & 3) * 0.22 : (1 - tail) ** 2) *
          (1 + chaos * 1.8)
        const offset = (i * TRAIL + j) * 3
        resources.colors[offset] = resources.color.r * gain
        resources.colors[offset + 1] = resources.color.g * gain
        resources.colors[offset + 2] = resources.color.b * gain
        // A rock fades along its own four points, not along the pooled 28 — `tail` is
        // meaningless once the buffer holds seven objects.
        resources.sizes[i * TRAIL + j] = rock
          ? 0.135 - (j & 3) * 0.022
          : (nova ? 0.075 : 0.11) * (1 - tail * 0.65)
      }
    }
    resources.geometry.attributes.position.needsUpdate = true
    resources.geometry.attributes.color.needsUpdate = true
    resources.geometry.attributes.aSize.needsUpdate = true

    /*
     * The eruptions light the room they happen in.
     *
     * Additive points are their own light source and nothing else's — a nova used
     * to brighten by five thousand pixels and leave every surface around it shaded
     * exactly as before, which reads as a sprite over the scene rather than as an
     * event in it.
     *
     * Not a `pointLight`, though, and that is not an optimisation: `Atmosphere`
     * carries the reason. Every material out here is unlit and holds its own light
     * directions, so a real lamp would cost uniforms and illuminate nothing at all.
     * The flash is published on `sceneState` instead and the materials that want a
     * second light read it as a uniform.
     *
     * One, not one per event: the brightest of the eruptions and impacts is the only
     * one whose contribution would survive being summed anyway. Damped rather than assigned,
     * so the frame where the tracked event changes is a dip and not a cut.
     */
    sceneState.flash = THREE.MathUtils.damp(
      sceneState.flash,
      brightest * (1 - vacuum),
      // A nova is a swell and 6 is right for it. An impact is a detonation, and at 6 the
      // fireball takes ~160 ms to arrive — long enough that the rock has already
      // scattered before the world it hit notices. 18 under full CHAOS lands it in ~55.
      6 + chaos * 12,
      dt,
    )
    if (brightestAt >= 0) {
      const hit = resources.particles[brightestAt]
      // The impact point, not the launch point. This is the single line that makes
      // `Planets`' existing 1/(1+r²·0.05) falloff put the fireball's light on the world
      // that was actually struck: r ≈ 1 there, so it lands at 95%, while a nova twenty
      // metres out lands at 5%.
      const source = hit.kind === 2 ? hit.aim : hit.start
      sceneState.flashX = source.x
      sceneState.flashY = source.y
      sceneState.flashZ = source.z
    }
  })

  return <points name="cosmic-events" geometry={resources.geometry} material={resources.material} frustumCulled={false} />
}
