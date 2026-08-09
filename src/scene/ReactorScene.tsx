import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { CaseStudy, Copy } from '../content'
import { SECTION_IDS } from '../lib/routes'
import { Atmosphere } from './Atmosphere'
import type { Quality } from './capability'
import { GridFloor } from './GridFloor'
import { Lattice } from './Lattice'
import { PORTAL_POSITION } from './layout'
import { ReactorCore } from './ReactorCore'
import { Rig } from './Rig'
import { FinaleGate } from './FinaleGate'
import { Structures } from './Structures'
import { refreshSceneColors, sceneColors } from './sceneColors'
import { livePowerFor, sceneState, useSceneStore } from './sceneState'
import './silenceClockWarning'
import { WorldConsoles } from './consoles/WorldConsoles'
import type { SceneMode } from './ui/ReactorType'
import { useSectionWindows } from './ui/useSectionWindows'

/**
 * Device pixel ratio per fidelity step. Capped at 1.5 rather than 2: the extra
 * quarter of resolution is not visible on this material palette and costs more
 * fill rate than every other saving combined.
 */
const DPR: Record<'full' | 'reduced' | 'minimal', [number, number]> = {
  full: [1, 1.5],
  reduced: [1, 1.25],
  minimal: [1, 1],
}

/**
 * Reports the first presented frame, so the preflight overlay can clear on real
 * readiness rather than on a timer, and the document knows when the voxel portrait
 * is genuinely drawing.
 */
const ReadySignal = () => {
  const setSceneReady = useSceneStore((state) => state.setSceneReady)
  const reported = useRef(false)

  useFrame(() => {
    if (reported.current) return
    reported.current = true
    setSceneReady(true)
  })

  useEffect(
    () => () => {
      setSceneReady(false)
    },
    [setSceneReady],
  )

  return null
}

/**
 * A lost GPU context has to be survivable. Without this the canvas keeps a dead
 * renderer and the page shows a black rectangle over half the content; here the
 * scene reports upward and the document takes over as if 3D had never been asked
 * for. `preventDefault` on the loss event is what allows the browser to restore.
 */
const ContextGuard = ({ onFailure }: { onFailure: () => void }) => {
  const gl = useThree((state) => state.gl)
  const setSceneReady = useSceneStore((state) => state.setSceneReady)

  useEffect(() => {
    const canvas = gl.domElement

    const handleLost = (event: Event) => {
      event.preventDefault()
      setSceneReady(false)
    }
    // Restoration is not guaranteed; if it does not come back, fail over.
    const handleRestored = () => refreshSceneColors()

    canvas.addEventListener('webglcontextlost', handleLost)
    canvas.addEventListener('webglcontextrestored', handleRestored)
    canvas.addEventListener('webglcontextcreationerror', onFailure)

    return () => {
      canvas.removeEventListener('webglcontextlost', handleLost)
      canvas.removeEventListener('webglcontextrestored', handleRestored)
      canvas.removeEventListener('webglcontextcreationerror', onFailure)
    }
  }, [gl, onFailure, setSceneReady])

  return null
}

/** Keeps the clear colour in sync with the document background. */
const ClearColour = () => {
  const scene = useThree((state) => state.scene)
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    refreshSceneColors()
    if (scene.background instanceof THREE.Color) {
      scene.background.copy(sceneColors.base)
    } else {
      scene.background = sceneColors.base.clone()
    }
    gl.setClearColor(sceneColors.base, 1)
  }, [scene, gl])

  return null
}

/**
 * On the lighter quality the renderer is on demand rather than on a loop: a frame
 * is requested while the visitor is scrolling and for a beat after they stop, then
 * nothing. That is the difference between a phone idling at 0% GPU and one heating
 * up on a static image.
 */
const DemandDriver = () => {
  const invalidate = useThree((state) => state.invalidate)
  const last = useRef(-1)
  const settle = useRef(0)

  useFrame(() => {
    if (sceneState.build !== last.current) {
      last.current = sceneState.build
      // Keep rendering briefly after the last change so damped motion can land.
      settle.current = 0.6
    }
    if (settle.current > 0) {
      settle.current -= 1 / 60
      invalidate()
    }
  })

  useEffect(() => {
    const request = () => invalidate()
    window.addEventListener('scroll', request, { passive: true })
    window.addEventListener('resize', request)
    request()
    return () => {
      window.removeEventListener('scroll', request)
      window.removeEventListener('resize', request)
    }
  }, [invalidate])

  return null
}

/**
 * The ignition flare.
 *
 * This replaces a full post-processing chain. `@react-three/postprocessing` plus
 * `postprocessing` cost roughly 200 kB gzipped to deliver two effects — a bloom
 * gated on the final chapter, and grain — and a ping-pong composer on every frame
 * to do it. The bloom only ever applied to one object, so it is drawn as an
 * additive billboard on that object instead, and the grain moved to a static CSS
 * overlay. Same read, a fraction of the cost, and no render target.
 */
const IgnitionFlare = () => {
  const mesh = useRef<THREE.Mesh>(null)

  const texture = useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')
    if (context) {
      const half = size / 2
      const gradient = context.createRadialGradient(half, half, 0, half, half, half)
      // A wide, soft falloff: a hard-edged additive disc reads as a shape rather
      // than as light spilling past the object.
      gradient.addColorStop(0, 'rgba(255,255,255,0.9)')
      gradient.addColorStop(0.25, 'rgba(255,255,255,0.28)')
      gradient.addColorStop(1, 'rgba(255,255,255,0)')
      context.fillStyle = gradient
      context.fillRect(0, 0, size, size)
    }
    return new THREE.CanvasTexture(canvas)
  }, [])

  const material = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: texture,
        color: sceneColors.accent.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    [texture],
  )

  useEffect(
    () => () => {
      texture.dispose()
      material.dispose()
    },
    [texture, material],
  )

  useFrame(() => {
    const power = livePowerFor(sceneState.build)
    material.color.copy(sceneColors.accent)
    // Soft end glow — structure/gate carry the finale, not a screen-filling blob.
    material.opacity = power * power * 0.28
    const sprite = mesh.current
    if (sprite) sprite.scale.setScalar(8 + power * 5)
  })

  return (
    <sprite
      ref={mesh as never}
      material={material}
      position={PORTAL_POSITION}
      renderOrder={3}
    />
  )
}

interface ReactorSceneProps {
  quality: Quality
  copy: Copy
  featured: CaseStudy[]
  onFailure: () => void
  mode?: SceneMode
  study?: CaseStudy
  sectionIds?: readonly string[]
}

/**
 * The persistent reactor room — the primary interface of the site.
 * Chapter windows come from the scroll rail above; world type carries the copy.
 */
export const ReactorScene = ({
  quality,
  copy,
  featured,
  onFailure,
  mode = 'home',
  study,
  sectionIds = SECTION_IDS,
}: ReactorSceneProps) => {
  const fidelity = useSceneStore((state) => state.fidelity)
  const windows = useSectionWindows(sectionIds)

  const cinema = quality === 'cinema'

  return (
    <div className="stage" aria-hidden="true">
      <Canvas
        dpr={DPR[fidelity]}
        frameloop={cinema ? 'always' : 'demand'}
        camera={{ fov: 42, near: 0.1, far: 64, position: [0, 1.75, 10.2] }}
        gl={{
          alpha: false,
          antialias: fidelity === 'full',
          powerPreference: cinema ? 'high-performance' : 'default',
          stencil: false,
        }}
        fallback={null}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
        }}
      >
        <ClearColour />
        <ContextGuard onFailure={onFailure} />
        <ReadySignal />
        {cinema ? null : <DemandDriver />}

        <Atmosphere />
        <Rig quality={quality} />
        <GridFloor quality={quality} />
        <Lattice quality={quality} />
        <Structures quality={quality} />
        <ReactorCore quality={quality} />
        <WorldConsoles
          copy={copy}
          featured={featured}
          quality={quality}
          windows={windows}
          mode={mode}
          study={study}
        />
        <FinaleGate />

        {fidelity === 'minimal' ? null : <IgnitionFlare />}
      </Canvas>
    </div>
  )
}
