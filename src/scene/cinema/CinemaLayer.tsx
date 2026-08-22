import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  ToneMapping,
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

/**
 * The cinema layer: everything only a capable desktop ever downloads.
 *
 * This module is the single lazy boundary for the advanced animation stack, and
 * it exists as a *boundary* rather than as a component that happens to import
 * some libraries. Three separate guarantees hang off that:
 *
 * 1. `vite.config.ts` pins every dependency reached from here into one chunk
 *    named `cinema`, and `scripts/bundle-budget.mjs` measures that chunk against
 *    its own budget. A phone's budget did not move when this landed, because a
 *    phone resolves `lite` and never imports this file.
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
const SAMPLES: Record<Fidelity, number> = { full: 4, reduced: 2, minimal: 0 }

export const CinemaLayer = ({ fidelity }: CinemaLayerProps) => {
  const gl = useThree((state) => state.gl)
  const bloom = useRef<BloomEffect>(null)
  const aberration = useRef<ChromaticAberrationEffect>(null)

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

  useFrame(() => {
    const build = sceneState.build
    const swallow = swallowShape(sceneState.swallow)
    const power = livePowerFor(build)
    // The hero transit: the moment the lens passes through the optic's core.
    const transit = Math.max(
      0,
      1 - Math.abs(build - HERO_BUILD) / (HERO_BUILD * 0.5),
    )

    const bloomEffect = bloom.current
    if (bloomEffect) {
      /*
       * Bloom is reserved for the three moments the room actually emits light:
       * flying through the optic's core, the portal powering on, and the well
       * taking the room in. Left at a constant it would simply make everything
       * slightly milky, which is how bloom usually ends up looking like a preset.
       */
      bloomEffect.intensity =
        0.35 +
        transit * transit * 1.5 +
        power * 0.9 +
        swallow.pull * 2.2 +
        reactorControl.uplink * 0.6
      // CHAOS runs hot, so it lowers the bar for what counts as a highlight.
      bloomEffect.luminanceMaterial.threshold = 0.62 - liveLaw.heat * 0.22
    }

    const aberrationEffect = aberration.current
    if (aberrationEffect) {
      /*
       * Lens distortion as a function of the swallow, so falling into the well
       * bends the image at its edges — and unbends it exactly if the visitor
       * scrolls back out, because like every other layer of that ending this is a
       * pure function of scroll position and not a triggered animation.
       */
      const amount = swallow.grip * 0.0035 + transit * 0.0012
      aberrationEffect.offset.set(amount, amount * 0.6)
    }
  })

  return (
    <EffectComposer
      // The scene renders linear and is mapped by the last pass below.
      frameBufferType={THREE.HalfFloatType}
      multisampling={SAMPLES[fidelity]}
      // No effect here samples depth or normals, so neither buffer is allocated.
      depthBuffer={false}
      enableNormalPass={false}
    >
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
