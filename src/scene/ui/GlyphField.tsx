import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildFor, liveFor, sceneState, type Tier } from '../sceneState'
import { GlyphMaterial } from './GlyphMaterial'
import type { GlyphInstances } from './glyphLayout'

/**
 * Every piece of world typography in one instanced draw call: a unit prism, an
 * atlas, and per-fragment buffers describing where it starts, where it belongs
 * and which slice of the scroll moves it between the two.
 */

interface GlyphFieldProps {
  instances: GlyphInstances
  atlas: THREE.Texture
  tier: Tier
  /** Fires once the field has faded in far enough to be read. */
  onVisible?: () => void
}

/** Opacity at which the field can stand in for the DOM copy. */
const READABLE = 0.9

const ATTRIBUTES = [
  ['aChaos', 3],
  ['aHome', 3],
  ['aQuat', 4],
  ['aAxis', 3],
  ['aRect', 4],
  ['aSize', 3],
  ['aSeed', 1],
  ['aWindow', 4],
  ['aStyle', 3],
] as const

const SOURCE_KEYS = {
  aChaos: 'chaos',
  aHome: 'home',
  aQuat: 'quaternion',
  aAxis: 'axis',
  aRect: 'rect',
  aSize: 'size',
  aSeed: 'seed',
  aWindow: 'window',
  aStyle: 'style',
} as const satisfies Record<(typeof ATTRIBUTES)[number][0], keyof GlyphInstances>

export const GlyphField = ({
  instances,
  atlas,
  tier,
  onVisible,
}: GlyphFieldProps) => {
  const geometry = useMemo(() => {
    const field = new THREE.InstancedBufferGeometry()
    // Unit cube: GlyphMaterial scales by aSize (voxel edge or flat plate).
    const box = new THREE.BoxGeometry(1, 1, 1)
    field.setAttribute('position', box.getAttribute('position'))
    field.setAttribute('normal', box.getAttribute('normal'))
    field.setAttribute('uv', box.getAttribute('uv'))
    field.setIndex(box.getIndex())
    box.dispose()

    for (const [name, itemSize] of ATTRIBUTES) {
      const source = instances[SOURCE_KEYS[name]] as Float32Array
      field.setAttribute(
        name,
        new THREE.InstancedBufferAttribute(
          source.subarray(0, instances.count * itemSize),
          itemSize,
        ),
      )
    }

    field.instanceCount = instances.count
    // Fragments live in the attribute buffers, so the derived bounds are wrong.
    field.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 120)
    return field
  }, [instances])

  const material = useMemo(() => new GlyphMaterial(atlas), [atlas])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  const opacity = useRef(0)
  const reported = useRef(false)

  // Fade from scratch on a new atlas. Instance buffer reshuffles (window
  // remeasure) keep the current opacity so the DOM hand-off stays stable.
  useEffect(() => {
    opacity.current = 0
    reported.current = false
  }, [atlas])

  useFrame((state, delta) => {
    const build = buildFor(tier)
    // Fade the field in once rather than popping the first frame after the atlas
    // resolves, which lands mid-scroll on a fast connection.
    opacity.current = THREE.MathUtils.damp(opacity.current, 1, 3.5, delta)

    // The DOM copy cannot retire while this is still transparent, or the reader
    // gets a gap with neither layer legible.
    if (!reported.current && opacity.current >= READABLE) {
      reported.current = true
      onVisible?.()
    }

    material.sync({
      build,
      live: liveFor(build),
      time: state.clock.elapsedTime,
      velocity: tier === 'still' ? 0 : sceneState.velocity,
      opacity: opacity.current,
    })
  })

  if (!instances.count) return null

  return (
    <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={2} />
  )
}
