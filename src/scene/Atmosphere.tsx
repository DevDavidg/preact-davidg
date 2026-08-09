import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FOG_DENSITY, PORTAL_POSITION } from './layout'
import { sceneColors } from './sceneColors'
import { livePowerFor, sceneState } from './sceneState'

/**
 * A soft radial falloff, generated rather than shipped as an asset. A flat
 * additive circle reads as a hard-edged shape on screen; this reads as light.
 */
const createGlowTexture = () => {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')
  if (context) {
    const half = size / 2
    const gradient = context.createRadialGradient(half, half, 0, half, half, half)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.32)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, size, size)
  }

  return new THREE.CanvasTexture(canvas)
}

/**
 * Depth and the portal at the end of the room.
 *
 * There are deliberately no scene lights: every material here is unlit and
 * carries its own hard-coded light directions, so `ambientLight` and friends
 * would cost uniforms and render nothing. The fog does the depth work for the
 * lattice and the portal, both of which are fog-aware basic materials.
 */
export const Atmosphere = () => {
  const portal = useRef<THREE.Mesh>(null)
  const fog = useRef<THREE.FogExp2>(null)

  const glow = useMemo(createGlowTexture, [])
  const portalMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: glow,
        color: sceneColors.accent.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    [glow],
  )
  const portalGeometry = useMemo(() => new THREE.PlaneGeometry(13, 13), [])

  useEffect(() => {
    return () => {
      glow.dispose()
      portalMaterial.dispose()
      portalGeometry.dispose()
    }
  }, [glow, portalMaterial, portalGeometry])

  useFrame((state) => {
    const power = livePowerFor(sceneState.build)
    if (fog.current) {
      fog.current.color.copy(sceneColors.base)
      // Ignition opens the end of the room a touch; the change stays restrained
      // so it reads as power coming on, not as the scene losing its depth.
      fog.current.density = FOG_DENSITY * (1 - power * 0.16)
    }
    portalMaterial.color.copy(sceneColors.accent)
    if (!portal.current) return
    const breathe =
      1 +
      power * 0.13 +
      Math.sin(state.clock.elapsedTime * 0.8) * 0.028 * power
    portal.current.scale.setScalar(breathe)
    // Effectively off until the final chapter, then accelerating. A radial plane
    // keeps this one extra draw cheap.
    // Visible earlier so the corridor end never reads as a black void.
    const approach = THREE.MathUtils.smoothstep(sceneState.build, 0.62, 0.92)
    portalMaterial.opacity =
      Math.max(power, approach * 0.55) * (0.28 + power * 0.55)
  })

  return (
    <>
      <fogExp2
        ref={fog}
        attach="fog"
        args={[`#${sceneColors.base.getHexString()}`, FOG_DENSITY]}
      />
      <mesh
        ref={portal}
        geometry={portalGeometry}
        material={portalMaterial}
        position={PORTAL_POSITION}
      />
    </>
  )
}
