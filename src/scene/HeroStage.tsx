/**
 * Opening product shot — soft, immersive faceted shell.
 *
 * Pass 1: fake-RT lighting (hemi + orbiting rim + shared PMREM env on Physical).
 * Pass 2: eased color waves + staggered peel that clears the corridor gently.
 * Pass 3: idle breathe / reverse pulse / cue badge that faces the lens.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Quality } from './capability'
import { REACTOR_CORE } from './layout'
import { sceneColors } from './sceneColors'
import { clamp01, sceneState } from './sceneState'
import { computeViewportFit, heroSizeFit } from './viewportFit'

const HERO_FADE_START = 0.055
const HERO_FADE_END = 0.18
const BASE_SEPARATION = 0.022
const HOVER_EXTRUDE = 0.07
const FIRE_DISTANCE = 2.8
const SCROLL_BREAK = 1.85
const FACE_GAP = 0.93
const PANEL_THICKNESS = 0.1
/** Slow idle envelope — soft, never strobing. */
const PULSE_HZ = 0.85
const IDLE_BREATHE = 0.014
const IDLE_SPIN = 0.045

const TRAVERSE = new THREE.Vector3(0.62, 0.28, 1).normalize()
const _side = new THREE.Vector3()
const _a = new THREE.Vector3()
const _b = new THREE.Vector3()
const _c = new THREE.Vector3()
const _ab = new THREE.Vector3()
const _ac = new THREE.Vector3()
const _la = new THREE.Vector3()
const _lb = new THREE.Vector3()
const _lc = new THREE.Vector3()
const _n = new THREE.Vector3()
const _warm = new THREE.Color()
const _champagne = new THREE.Color()

/** Raised-cosine pulse in [0, 1] — softer attack/decay than raw sin. */
const softPulse = (t: number, hz: number, phase = 0) =>
  0.5 - 0.5 * Math.cos(t * hz * Math.PI * 2 + phase)

const easeOutCubic = (t: number) => {
  const x = clamp01(t)
  return 1 - (1 - x) ** 3
}

interface ShardSpec {
  geometry: THREE.BufferGeometry
  skeleton: THREE.BufferGeometry
  centroid: THREE.Vector3
  normal: THREE.Vector3
  phase: number
}

const pushTri = (
  positions: number[],
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  normal: THREE.Vector3,
  along: number,
) => {
  positions.push(
    p0.x + normal.x * along,
    p0.y + normal.y * along,
    p0.z + normal.z * along,
    p1.x + normal.x * along,
    p1.y + normal.y * along,
    p1.z + normal.z * along,
    p2.x + normal.x * along,
    p2.y + normal.y * along,
    p2.z + normal.z * along,
  )
}

const extrudeTriangle = (
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  normal: THREE.Vector3,
  thickness: number,
): THREE.BufferGeometry => {
  const half = thickness * 0.5
  _la.copy(a).multiplyScalar(FACE_GAP)
  _lb.copy(b).multiplyScalar(FACE_GAP)
  _lc.copy(c).multiplyScalar(FACE_GAP)

  const positions: number[] = []
  pushTri(positions, _la, _lb, _lc, normal, half)
  pushTri(positions, _lc, _lb, _la, normal, -half)

  const rim: [THREE.Vector3, THREE.Vector3][] = [
    [_la, _lb],
    [_lb, _lc],
    [_lc, _la],
  ]
  for (const [from, to] of rim) {
    const o0 = [
      from.x + normal.x * half,
      from.y + normal.y * half,
      from.z + normal.z * half,
    ]
    const o1 = [
      to.x + normal.x * half,
      to.y + normal.y * half,
      to.z + normal.z * half,
    ]
    const i0 = [
      from.x - normal.x * half,
      from.y - normal.y * half,
      from.z - normal.z * half,
    ]
    const i1 = [
      to.x - normal.x * half,
      to.y - normal.y * half,
      to.z - normal.z * half,
    ]
    positions.push(...o0, ...i0, ...i1, ...o0, ...i1, ...o1)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  return geometry
}

const buildSkeleton = (
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  normal: THREE.Vector3,
  thickness: number,
): THREE.BufferGeometry => {
  const half = thickness * 0.5
  const ga = a.clone().multiplyScalar(FACE_GAP)
  const gb = b.clone().multiplyScalar(FACE_GAP)
  const gc = c.clone().multiplyScalar(FACE_GAP)

  const outer = [ga, gb, gc].map((p) => p.clone().addScaledVector(normal, half))
  const inner = [ga, gb, gc].map((p) => p.clone().addScaledVector(normal, -half))

  const pairs: THREE.Vector3[] = []
  const ring = (pts: THREE.Vector3[]) => {
    for (let i = 0; i < 3; i++) pairs.push(pts[i], pts[(i + 1) % 3])
  }
  ring(outer)
  ring(inner)
  for (let i = 0; i < 3; i++) pairs.push(outer[i], inner[i])

  const positions = new Float32Array(pairs.length * 3)
  pairs.forEach((point, index) => {
    positions[index * 3] = point.x
    positions[index * 3 + 1] = point.y
    positions[index * 3 + 2] = point.z
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return geometry
}

const buildShards = (radius: number, detail: number): ShardSpec[] => {
  const source = new THREE.IcosahedronGeometry(radius, detail)
  const nonIndexed = source.index ? source.toNonIndexed() : source
  const position = nonIndexed.getAttribute('position')
  const triangleCount = Math.floor(position.count / 3)
  const shards: ShardSpec[] = []

  for (let index = 0; index < triangleCount; index++) {
    const first = index * 3
    _a.fromBufferAttribute(position, first)
    _b.fromBufferAttribute(position, first + 1)
    _c.fromBufferAttribute(position, first + 2)

    const centroid = new THREE.Vector3()
      .addVectors(_a, _b)
      .add(_c)
      .multiplyScalar(1 / 3)

    _ab.subVectors(_b, _a)
    _ac.subVectors(_c, _a)
    _n.crossVectors(_ab, _ac).normalize()
    if (_n.dot(centroid) < 0) _n.negate()

    const localA = _a.clone().sub(centroid)
    const localB = _b.clone().sub(centroid)
    const localC = _c.clone().sub(centroid)
    const normal = _n.clone()

    shards.push({
      geometry: extrudeTriangle(localA, localB, localC, normal, PANEL_THICKNESS),
      skeleton: buildSkeleton(localA, localB, localC, normal, PANEL_THICKNESS),
      centroid,
      normal,
      phase: (index * 2.399) % (Math.PI * 2),
    })
  }

  source.dispose()
  if (nonIndexed !== source) nonIndexed.dispose()
  return shards
}

const createTraverseParticles = (count: number) => {
  const positions = new Float32Array(count * 3)
  const along = new Float32Array(count)
  const lateral = new Float32Array(count * 3)

  const side = new THREE.Vector3()
  const up = new THREE.Vector3(0, 1, 0)
  if (Math.abs(TRAVERSE.dot(up)) > 0.9) up.set(1, 0, 0)
  const right = new THREE.Vector3().crossVectors(TRAVERSE, up).normalize()
  const binormal = new THREE.Vector3().crossVectors(right, TRAVERSE).normalize()

  for (let index = 0; index < count; index++) {
    along[index] = index / count
    const radial = 0.18 + (index % 5) * 0.1
    const angle = index * 2.399
    lateral[index * 3] = Math.cos(angle) * radial
    lateral[index * 3 + 1] = Math.sin(angle) * radial * 0.72
    lateral[index * 3 + 2] = ((index % 3) - 1) * 0.04

    side
      .copy(right)
      .multiplyScalar(lateral[index * 3])
      .addScaledVector(binormal, lateral[index * 3 + 1])
      .addScaledVector(TRAVERSE, lateral[index * 3 + 2])

    const travel = (along[index] - 0.5) * 2.4
    positions[index * 3] = TRAVERSE.x * travel + side.x
    positions[index * 3 + 1] = TRAVERSE.y * travel + side.y
    positions[index * 3 + 2] = TRAVERSE.z * travel + side.z
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return { geometry, along, lateral, right, binormal }
}

/** Soft studio gradient → PMREM. Reads as bounced light without a path tracer. */
const createStudioEnv = (gl: THREE.WebGLRenderer) => {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, size)
    gradient.addColorStop(0, '#2a3340')
    gradient.addColorStop(0.45, '#0d1117')
    gradient.addColorStop(0.72, '#1a1410')
    gradient.addColorStop(1, '#3a2818')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    // Soft key bloom in the upper-right of the env.
    const bloom = ctx.createRadialGradient(size * 0.72, size * 0.28, 4, size * 0.72, size * 0.28, size * 0.45)
    bloom.addColorStop(0, 'rgba(255,196,130,0.55)')
    bloom.addColorStop(0.4, 'rgba(230,200,145,0.14)')
    bloom.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = bloom
    ctx.fillRect(0, 0, size, size)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.colorSpace = THREE.SRGBColorSpace

  const pmrem = new THREE.PMREMGenerator(gl)
  const envMap = pmrem.fromEquirectangular(texture).texture
  texture.dispose()
  pmrem.dispose()
  return envMap
}

const createCueTexture = (label: string) => {
  const canvas = document.createElement('canvas')
  canvas.width = 768
  canvas.height = 160
  const context = canvas.getContext('2d')
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height)
    const fill = context.createLinearGradient(0, 0, canvas.width, canvas.height)
    fill.addColorStop(0, 'rgba(13, 17, 23, 0.96)')
    fill.addColorStop(1, 'rgba(21, 27, 35, 0.96)')
    context.fillStyle = fill
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = '#ffb454'
    context.lineWidth = 5
    context.strokeRect(12, 12, canvas.width - 24, canvas.height - 24)
    context.font = '700 50px "IBM Plex Mono", ui-monospace, monospace'
    context.fillStyle = '#f3eee4'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(label, canvas.width / 2, canvas.height / 2)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

const createChevronGeometry = () => {
  // Tip points down — scroll enters the corridor below.
  const shape = new THREE.Shape()
  shape.moveTo(0, -0.16)
  shape.lineTo(0.14, 0.02)
  shape.lineTo(0.06, 0.02)
  shape.lineTo(0.06, 0.16)
  shape.lineTo(-0.06, 0.16)
  shape.lineTo(-0.06, 0.02)
  shape.lineTo(-0.14, 0.02)
  shape.closePath()
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 2,
  })
  geometry.translate(0, 0, -0.03)
  return geometry
}

const structuralColor = (target: THREE.Color) =>
  target.copy(sceneColors.base).lerp(sceneColors.ink, 0.14)

export const HeroStage = ({
  quality,
  cue,
}: {
  quality: Quality
  cue: string
}) => {
  const root = useRef<THREE.Group>(null)
  const shell = useRef<THREE.Group>(null)
  const cueGroup = useRef<THREE.Group>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const keyLight = useRef<THREE.DirectionalLight>(null)
  const fillLight = useRef<THREE.DirectionalLight>(null)
  const rimLight = useRef<THREE.PointLight>(null)
  const coreGlow = useRef<THREE.PointLight>(null)
  const presence = useRef(1)
  const hoverAmts = useRef<Float32Array | null>(null)
  const fireAmts = useRef<Float32Array | null>(null)
  const fireTargets = useRef<Float32Array | null>(null)
  const breakSmooth = useRef(0)
  const [hoveredIndex, setHoveredIndex] = useState(-1)

  const invalidate = useThree((state) => state.invalidate)
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const aspect = useThree((state) => state.viewport.aspect)
  const heightPx = useThree((state) => state.size.height)
  const fit = computeViewportFit(aspect, heightPx)
  const stageScale = heroSizeFit(fit)

  const particleCount = quality === 'cinema' ? 28 : 16
  const detail = quality === 'cinema' ? 2 : 1

  const envMap = useMemo(() => createStudioEnv(gl), [gl])
  const shards = useMemo(() => buildShards(0.78, detail), [detail])
  const particleField = useMemo(
    () => createTraverseParticles(particleCount),
    [particleCount],
  )

  useEffect(() => {
    hoverAmts.current = new Float32Array(shards.length)
    fireAmts.current = new Float32Array(shards.length)
    fireTargets.current = new Float32Array(shards.length)
  }, [shards.length])

  const cuePlate = useMemo(() => new THREE.BoxGeometry(1.75, 0.44, 0.1), [])
  const cueChevron = useMemo(() => createChevronGeometry(), [])
  const cueLabelGeo = useMemo(() => new THREE.PlaneGeometry(1.58, 0.33), [])

  const materials = useMemo(() => {
    const particles = new THREE.PointsMaterial({
      color: sceneColors.ink.clone(),
      size: 0.02,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      sizeAttenuation: true,
      toneMapped: false,
    })
    const cueBody = new THREE.MeshPhysicalMaterial({
      color: structuralColor(new THREE.Color()),
      metalness: 0.78,
      roughness: 0.22,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      envMap,
      envMapIntensity: 0.7,
      flatShading: true,
      transparent: true,
      opacity: 0,
      emissive: sceneColors.accent.clone(),
      emissiveIntensity: 0.12,
    })
    const cueAccent = new THREE.MeshPhysicalMaterial({
      color: sceneColors.accent.clone(),
      metalness: 0.55,
      roughness: 0.28,
      clearcoat: 0.6,
      envMap,
      envMapIntensity: 0.55,
      emissive: sceneColors.accent.clone(),
      emissiveIntensity: 0.65,
      flatShading: true,
      transparent: true,
      opacity: 0,
    })
    const cueTexture = createCueTexture(cue)
    const cueLabel = new THREE.MeshBasicMaterial({
      map: cueTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    })

    return { particles, cueBody, cueAccent, cueLabel, cueTexture }
  }, [cue, envMap])

  const shardMaterials = useMemo(
    () =>
      shards.map(() => ({
        face: new THREE.MeshPhysicalMaterial({
          color: structuralColor(new THREE.Color()),
          metalness: 0.88,
          roughness: 0.18,
          clearcoat: 0.92,
          clearcoatRoughness: 0.08,
          envMap,
          envMapIntensity: 0.95,
          flatShading: true,
          emissive: sceneColors.accent.clone(),
          emissiveIntensity: 0,
          transparent: true,
          opacity: 1,
        }),
        wire: new THREE.LineBasicMaterial({
          color: sceneColors.ink.clone(),
          transparent: true,
          opacity: 0.62,
          depthWrite: false,
          toneMapped: false,
        }),
      })),
    [shards, envMap],
  )

  useEffect(
    () => () => {
      envMap.dispose()
      cuePlate.dispose()
      cueChevron.dispose()
      cueLabelGeo.dispose()
      shards.forEach((shard) => {
        shard.geometry.dispose()
        shard.skeleton.dispose()
      })
      particleField.geometry.dispose()
      materials.particles.dispose()
      materials.cueBody.dispose()
      materials.cueAccent.dispose()
      materials.cueLabel.dispose()
      materials.cueTexture.dispose()
      shardMaterials.forEach(({ face, wire }) => {
        face.dispose()
        wire.dispose()
      })
    },
    [
      envMap,
      cuePlate,
      cueChevron,
      cueLabelGeo,
      shards,
      particleField,
      materials,
      shardMaterials,
    ],
  )

  useEffect(() => {
    document.body.style.cursor = hoveredIndex >= 0 ? 'pointer' : ''
    return () => {
      document.body.style.cursor = ''
    }
  }, [hoveredIndex])

  useFrame((state, delta) => {
    const build = sceneState.build
    const time = state.clock.elapsedTime
    const reveal = THREE.MathUtils.smoothstep(time, 0.08, 1.2)
    const fade =
      1 - clamp01((build - HERO_FADE_START) / (HERO_FADE_END - HERO_FADE_START))
    const presenceTarget = reveal * fade
    presence.current =
      presenceTarget < 0.015
        ? 0
        : THREE.MathUtils.damp(presence.current, presenceTarget, 3.6, delta)

    const globalPulse = softPulse(time, PULSE_HZ)
    const breakTarget = THREE.MathUtils.smoothstep(build, 0.04, 0.16)
    breakSmooth.current = THREE.MathUtils.damp(
      breakSmooth.current,
      breakTarget,
      2.4,
      delta,
    )
    const breakApart = breakSmooth.current
    const fling = easeOutCubic(THREE.MathUtils.smoothstep(build, 0.07, 0.18))
    const idleGate = 1 - breakApart

    const rootNode = root.current
    if (rootNode) {
      rootNode.visible = presence.current > 0.01
      const idleYaw = Math.sin(time * IDLE_SPIN) * 0.12 * idleGate
      const idlePitch = Math.cos(time * IDLE_SPIN * 0.7) * 0.05 * idleGate
      rootNode.rotation.y = THREE.MathUtils.damp(
        rootNode.rotation.y,
        sceneState.pointerX * 0.028 * idleGate + idleYaw,
        2.2,
        delta,
      )
      rootNode.rotation.x = THREE.MathUtils.damp(
        rootNode.rotation.x,
        -sceneState.pointerY * 0.018 * idleGate + idlePitch,
        2.2,
        delta,
      )
      const floatY = Math.sin(time * 0.55) * 0.028 * idleGate
      rootNode.position.y = REACTOR_CORE[1] + floatY
      const breatheScale = stageScale * (1 + Math.sin(time * 0.7) * 0.012 * idleGate)
      rootNode.scale.setScalar(breatheScale)
    }

    const amts = hoverAmts.current
    const fires = fireAmts.current
    const fireGoals = fireTargets.current
    const shellNode = shell.current
    if (amts && fires && fireGoals && shellNode) {
      let settling = false
      for (let index = 0; index < shards.length; index++) {
        const fired = fireGoals[index] > 0.5
        const hoverTarget =
          !fired && hoveredIndex === index && breakApart < 0.25 ? 1 : 0
        const nextHover = THREE.MathUtils.damp(amts[index], hoverTarget, 7, delta)
        const nextFire = THREE.MathUtils.damp(fires[index], fireGoals[index], 3.2, delta)
        if (
          Math.abs(nextHover - amts[index]) > 1e-4 ||
          Math.abs(nextFire - fires[index]) > 1e-4 ||
          nextHover > 0.001 ||
          breakApart > 0.001 ||
          (nextFire > 0.001 && nextFire < 0.999)
        ) {
          settling = true
        }
        amts[index] = nextHover
        fires[index] = nextFire

        const spec = shards[index]
        const child = shellNode.children[index] as THREE.Group | undefined
        const mats = shardMaterials[index]
        if (!spec || !child || !mats) continue

        // Reverse of the global envelope + per-facet phase.
        const reversePulse = softPulse(time, PULSE_HZ, Math.PI + spec.phase)
        const colorWave = softPulse(time, PULSE_HZ * 0.55, spec.phase * 1.3)
        const stagger = clamp01(
          breakApart * 1.55 - (spec.phase / (Math.PI * 2)) * 0.55,
        )
        const throwAmt = easeOutCubic(stagger)
        const breathe =
          Math.sin(time * 1.1 + spec.phase) * IDLE_BREATHE * idleGate * (1 - nextHover)

        const push =
          BASE_SEPARATION +
          breathe +
          throwAmt * SCROLL_BREAK * (0.88 + (index % 5) * 0.05) +
          fling * 0.55 +
          nextHover * HOVER_EXTRUDE +
          nextFire * FIRE_DISTANCE

        child.position.copy(spec.centroid).addScaledVector(spec.normal, push)
        child.rotation.z = THREE.MathUtils.damp(
          child.rotation.z,
          throwAmt * (0.55 + spec.phase * 0.12) +
            nextFire * (0.65 + (index % 5) * 0.1) +
            Math.sin(time * 0.4 + spec.phase) * 0.03 * idleGate,
          3.5,
          delta,
        )
        child.rotation.x = THREE.MathUtils.damp(
          child.rotation.x,
          throwAmt * (0.35 + (index % 3) * 0.08) + nextFire * 0.4,
          3.5,
          delta,
        )
        const scaleTarget = 1 - throwAmt * 0.42 - nextFire * 0.15
        child.scale.setScalar(
          THREE.MathUtils.damp(child.scale.x, scaleTarget, 4, delta),
        )
        child.visible = nextFire < 0.985 && presence.current > 0.015

        const faceLive =
          (1 - nextFire) * presence.current * (1 - throwAmt * 0.88)
        const wireLive =
          (1 - nextFire) * presence.current * (1 - fling * 0.75)

        // Soft palette: base → ink → ignition → champagne wave.
        structuralColor(mats.face.color)
        mats.face.color.lerp(sceneColors.ink, 0.08 + colorWave * 0.1 + nextHover * 0.18)
        _warm.copy(sceneColors.accent)
        _champagne.copy(sceneColors.signal)
        mats.face.emissive.copy(_warm).lerp(_champagne, reversePulse * 0.55)
        mats.face.emissiveIntensity =
          reversePulse * 0.1 * idleGate +
          colorWave * 0.05 * idleGate +
          nextHover * 0.42 +
          nextFire * 0.7 +
          throwAmt * 0.22
        mats.face.envMapIntensity = 0.75 + globalPulse * 0.35 + nextHover * 0.25
        mats.face.opacity = faceLive
        mats.face.depthWrite = throwAmt < 0.18
        mats.face.transparent = true

        mats.wire.color
          .copy(sceneColors.ink)
          .lerp(sceneColors.accent, 0.2 + reversePulse * 0.45 + nextHover * 0.35)
          .lerp(sceneColors.signal, colorWave * 0.2)
        mats.wire.opacity =
          (0.38 + reversePulse * 0.42 + nextHover * 0.2 + throwAmt * 0.15) * wireLive
      }
      if (settling && quality !== 'cinema') invalidate()
    }

    if (shell.current) {
      shell.current.rotation.y = time * 0.035 * idleGate
    }

    const particleAttr = particleField.geometry.getAttribute('position')
    for (let index = 0; index < particleCount; index++) {
      const t = (particleField.along[index] + time * 0.045) % 1
      const travel = (t - 0.5) * 2.4
      _side
        .copy(particleField.right)
        .multiplyScalar(particleField.lateral[index * 3])
        .addScaledVector(particleField.binormal, particleField.lateral[index * 3 + 1])
        .addScaledVector(TRAVERSE, particleField.lateral[index * 3 + 2])
      particleAttr.setXYZ(
        index,
        TRAVERSE.x * travel + _side.x,
        TRAVERSE.y * travel + _side.y,
        TRAVERSE.z * travel + _side.z,
      )
    }
    particleAttr.needsUpdate = true

    materials.particles.color
      .copy(sceneColors.ink)
      .lerp(sceneColors.accent, 0.12 + globalPulse * 0.22)
      .lerp(sceneColors.signal, (1 - globalPulse) * 0.12)
    materials.particles.opacity =
      0.22 * presence.current * (1 - breakApart * 0.8) * (0.7 + globalPulse * 0.3)

    const cueVisibility =
      presence.current * (1 - THREE.MathUtils.smoothstep(build, 0.04, 0.14))
    structuralColor(materials.cueBody.color)
    materials.cueBody.emissive.copy(sceneColors.accent)
    materials.cueBody.emissiveIntensity = 0.1 + globalPulse * 0.22
    materials.cueBody.opacity = (0.9 + globalPulse * 0.08) * cueVisibility
    materials.cueBody.envMapIntensity = 0.55 + globalPulse * 0.25
    materials.cueAccent.color.copy(sceneColors.accent)
    materials.cueAccent.emissive.copy(sceneColors.accent)
    materials.cueAccent.emissiveIntensity = 0.45 + globalPulse * 0.55
    materials.cueAccent.opacity = (0.88 + globalPulse * 0.1) * cueVisibility
    materials.cueLabel.opacity = (0.94 + globalPulse * 0.06) * cueVisibility
    if (cueGroup.current) {
      cueGroup.current.visible = cueVisibility > 0.035
      const bob = Math.sin(time * 1.35) * 0.035
      cueGroup.current.position.set(0, -0.98 + bob, 0.78)
      cueGroup.current.scale.setScalar(0.9 + globalPulse * 0.035)
      // Face the lens without orbiting off-centre (lookAt skewed the badge).
      cueGroup.current.quaternion.copy(camera.quaternion)
    }

    // Soft RT-ish lighting: hemi bounce + key + warm fill + orbiting rim.
    if (hemi.current) {
      hemi.current.color.copy(sceneColors.ink)
      hemi.current.groundColor.copy(sceneColors.base).lerp(sceneColors.accent, 0.12)
      hemi.current.intensity = (0.42 + globalPulse * 0.12) * presence.current
    }
    if (keyLight.current) {
      keyLight.current.color.copy(sceneColors.ink).lerp(sceneColors.accent, 0.18)
      keyLight.current.intensity = (1.15 + globalPulse * 0.35) * presence.current
      keyLight.current.position.set(
        2.1 + Math.sin(time * 0.25) * 0.35,
        3.2,
        2.6 + Math.cos(time * 0.22) * 0.3,
      )
    }
    if (fillLight.current) {
      fillLight.current.color.copy(sceneColors.signal)
      fillLight.current.intensity =
        (0.28 + (1 - globalPulse) * 0.22) * presence.current
    }
    if (rimLight.current) {
      const angle = time * 0.55
      rimLight.current.position.set(
        Math.cos(angle) * 1.6,
        0.35 + Math.sin(time * 0.7) * 0.2,
        Math.sin(angle) * 1.6,
      )
      rimLight.current.color.copy(sceneColors.accent).lerp(sceneColors.signal, reverseSoft(globalPulse))
      rimLight.current.intensity = (1.4 + globalPulse * 1.1) * presence.current
    }
    if (coreGlow.current) {
      coreGlow.current.color
        .copy(sceneColors.signal)
        .lerp(sceneColors.accent, globalPulse)
      coreGlow.current.intensity =
        (0.55 + softPulse(time, PULSE_HZ, Math.PI) * 0.65) * presence.current * idleGate
    }

    if (quality !== 'cinema' && presence.current > 0.015) invalidate()
  })

  const handleShardOver = (index: number) => {
    const fired = fireTargets.current?.[index] ?? 0
    if (fired > 0.5) return
    setHoveredIndex(index)
    invalidate()
  }

  const handleShardOut = (index: number) => {
    setHoveredIndex((current) => (current === index ? -1 : current))
    invalidate()
  }

  const handleShardClick = (index: number) => {
    const goals = fireTargets.current
    if (!goals || goals[index] > 0.5) return
    goals[index] = 1
    setHoveredIndex(-1)
    invalidate()
  }

  return (
    <group ref={root} position={REACTOR_CORE}>
      <hemisphereLight ref={hemi} args={['#f3eee4', '#050608', 0.45]} />
      <directionalLight ref={keyLight} position={[2.2, 3.2, 2.6]} intensity={1.2} />
      <directionalLight ref={fillLight} position={[-2.6, 0.8, 1.4]} intensity={0.3} />
      <pointLight ref={rimLight} distance={5.2} decay={2} intensity={1.5} />
      <pointLight ref={coreGlow} position={[0, 0.05, 0]} distance={2.8} decay={2} />

      <group ref={shell}>
        {shards.map((shard, index) => (
          <group key={`hero-shard-${index}`} position={shard.centroid}>
            <mesh
              geometry={shard.geometry}
              material={shardMaterials[index].face}
              frustumCulled={false}
              onPointerOver={(event) => {
                event.stopPropagation()
                handleShardOver(index)
              }}
              onPointerOut={(event) => {
                event.stopPropagation()
                handleShardOut(index)
              }}
              onClick={(event) => {
                event.stopPropagation()
                handleShardClick(index)
              }}
            />
            <lineSegments
              geometry={shard.skeleton}
              material={shardMaterials[index].wire}
              frustumCulled={false}
              renderOrder={2}
            />
          </group>
        ))}
      </group>

      <points
        geometry={particleField.geometry}
        material={materials.particles}
        frustumCulled={false}
      />

      <group ref={cueGroup} position={[0, -0.92, 0.72]}>
        <mesh geometry={cuePlate} material={materials.cueBody} />
        <mesh
          geometry={cueChevron}
          material={materials.cueAccent}
          position={[0, -0.3, 0.03]}
          scale={0.88}
        />
        <mesh
          geometry={cueLabelGeo}
          material={materials.cueLabel}
          position={[0, 0.02, 0.06]}
        />
      </group>
    </group>
  )
}

const reverseSoft = (value: number) => 1 - value
