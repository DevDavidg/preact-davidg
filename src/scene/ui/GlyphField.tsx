import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { liveFor, sceneState } from '../sceneState'
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
}

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

export const GlyphField = ({ instances, atlas }: GlyphFieldProps) => {
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

  // Fade from scratch on a new atlas, rather than popping in on the first frame
  // after it resolves — which on a fast connection lands mid-scroll.
  useEffect(() => {
    opacity.current = 0
  }, [atlas])

  useFrame((state, delta) => {
    const build = sceneState.build
    opacity.current = THREE.MathUtils.damp(opacity.current, 1, 3.5, delta)

    material.sync({
      build,
      live: liveFor(build),
      time: state.clock.elapsedTime,
      velocity: sceneState.velocity,
      opacity: opacity.current,
    })
  })

  if (!instances.count) return null

  return (
    <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={2} />
  )
}
