import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, Noise } from '@react-three/postprocessing'
import { BlendFunction, type BloomEffect } from 'postprocessing'
import * as THREE from 'three'
import { useCopy } from '../i18n/copy'
import { Artifacts } from './Artifacts'
import { Atmosphere } from './Atmosphere'
import { GridFloor } from './GridFloor'
import { Lattice } from './Lattice'
import { Rig } from './Rig'
import {
  onDesignDebugChange,
  refreshSceneColors,
  sceneColors,
} from './sceneColors'
import { Structures } from './Structures'
import { buildFor, liveFor, type Tier } from './sceneState'
import { useSectionWindows } from './ui/useSectionWindows'
import { WorldCopy } from './ui/WorldCopy'

/**
 * Two passes, both earning their cost: bloom so the accent rim actually glows
 * when the room powers on, and a whisper of grain to kill banding in the fog.
 */
const Post = ({ tier }: { tier: Tier }) => {
  const bloom = useRef<BloomEffect>(null)

  useFrame(() => {
    if (!bloom.current) return
    bloom.current.intensity = 0.16 + liveFor(buildFor(tier)) * 0.7
  })

  // Composer black-frame sources while the camera parallaxes on pointermove:
  // MSAA, half-float ping-pong, and mipmap bloom. Keep the pass cheap and
  // 8-bit so a missed buffer never reads as a solid void behind the overlays.
  return (
    <EffectComposer
      multisampling={0}
      enableNormalPass={false}
      depthBuffer={false}
      stencilBuffer={false}
      frameBufferType={THREE.UnsignedByteType}
    >
      <Bloom
        ref={bloom}
        intensity={0.16}
        luminanceThreshold={0.42}
        luminanceSmoothing={0.3}
        levels={3}
        mipmapBlur={false}
      />
      <Noise
        premultiply
        blendFunction={BlendFunction.SOFT_LIGHT}
        opacity={0.035}
      />
    </EffectComposer>
  )
}

/** Reduced-motion visitors get a single rendered frame, not a paused loop. */
const StillFrame = () => {
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    invalidate()
    // Shaders and fonts settle a beat after mount; render once more so the
    // frozen frame is the finished one.
    const timer = window.setTimeout(invalidate, 400)
    return () => window.clearTimeout(timer)
  }, [invalidate])

  return null
}

/**
 * Keeps the clear color (and a demand-loop invalidate) in sync when the DEV
 * design menu retints CSS tokens. Materials copy `sceneColors` each frame.
 */
const SceneThemeSync = () => {
  const scene = useThree((state) => state.scene)
  const gl = useThree((state) => state.gl)
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    const applyBackground = () => {
      if (scene.background instanceof THREE.Color) {
        scene.background.copy(sceneColors.base)
      } else {
        scene.background = sceneColors.base.clone()
      }
      gl.setClearColor(sceneColors.base, 1)
      invalidate()
    }

    refreshSceneColors()
    applyBackground()
    return onDesignDebugChange(applyBackground)
  }, [scene, gl, invalidate])

  return null
}

/**
 * The persistent atelier. Mounted once for the whole page and never unmounted
 * between sections — that continuity is the point of the signature.
 *
 * Copy and section geometry are read here, above the canvas, and handed down as
 * props: React context does not cross the R3F reconciler boundary, and one
 * measurement shared by the panels and the world typography beats two.
 */
export const AtelierScene = ({ tier }: { tier: Tier }) => {
  const { copy } = useCopy()
  const windows = useSectionWindows()
  const shots = useMemo(
    () => copy.work.items.map((item) => item.image),
    [copy.work.items],
  )

  return (
    // The wrapper carries the fixed positioning: R3F sets `position: relative`
    // and `height: 100%` inline on its own container, which would win over a class.
    <div className="stage" aria-hidden="true">
      <Canvas
        dpr={[1, tier === 'cinema' ? 1.75 : 1.5]}
        frameloop={tier === 'still' ? 'demand' : 'always'}
        camera={{ fov: 42, near: 0.1, far: 64, position: [0, 1.75, 10.2] }}
        gl={{
          alpha: false,
          antialias: true,
          powerPreference: 'high-performance',
          stencil: false,
        }}
      >
        <color attach="background" args={[`#${sceneColors.base.getHexString()}`]} />
        <SceneThemeSync />
        <Atmosphere tier={tier} />
        <Rig tier={tier} />
        <GridFloor tier={tier} />
        <Lattice tier={tier} />
        <Structures tier={tier} />
        <Artifacts tier={tier} shots={shots} />
        <WorldCopy copy={copy} tier={tier} windows={windows} />
        {tier === 'cinema' && <Post tier={tier} />}
        {tier === 'still' && <StillFrame />}
      </Canvas>
    </div>
  )
}
