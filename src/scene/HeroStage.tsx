/**
 * The first circle.
 *
 * A precision optic that holds itself shut while the visitor reads, then irises
 * open along the corridor the moment they scroll. Four things carry it:
 *
 * 1. One buffer. Every facet lives in a single merged geometry and the peel is a
 *    vertex displacement (`heroPeel`), so the shell is two draw calls instead of
 *    one per facet. The budget that frees up pays for the housing below.
 * 2. A housing. Aperture rings, meridian veins, an additive core and two fresnel
 *    glow shells turn a faceted ball into an instrument with a front, a centre
 *    and a rim of real atmosphere.
 * 3. One clock. Every glowing part reads `pulse` at a locked phase offset, so the
 *    shell, the rings, the core and the cue breathe as one object.
 * 4. Straight opening. The aperture is a pure function of scroll — no damping on
 *    the opening axis — and facets sweep along the corridor axis rather than
 *    scattering, so scrubbing the wheel scrubs the shell.
 */
import { useEffect, useMemo, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Quality } from './capability'
import { buildHeroShell, TRIS_PER_SHARD } from './heroShell'
import { applyLinePeel, applyLitPeel, createPeelUniforms } from './heroPeel'
import { CAMERA_PATH, REACTOR_CORE } from './layout'
import { idleAmount, pulse, pulseAt, sectionPhase } from './pulse'
import { sceneColors } from './sceneColors'
import { clamp01, sceneState } from './sceneState'
import { computeViewportFit, heroSizeFit } from './viewportFit'

const HERO_FADE_START = 0.055
const HERO_FADE_END = 0.18
/** The aperture commits on the first scroll pixel — no dead zone before it moves. */
const OPEN_START = 0.008
const OPEN_END = 0.155
const BASE_SEPARATION = 0.022
const SHELL_RADIUS = 0.78

/** Locked phases off the master clock — one tempo, four amplitudes. */
const CORE_PHASE = sectionPhase(0)
const RING_PHASE = sectionPhase(1)
const CUE_PHASE = sectionPhase(2)
const RIM_PHASE = Math.PI

const _dir = new THREE.Vector3()
const _camStart = new THREE.Vector3()
const _structural = new THREE.Color()

/**
 * The axis the shell opens along: from the shell toward where the camera starts.
 * Facets sweep back down it and past the lens, which reads as entering the
 * corridor rather than as an explosion.
 */
const heroViewAxis = () => {
  CAMERA_PATH.getPointAt(0, _camStart)
  return _dir
    .set(
      _camStart.x - REACTOR_CORE[0],
      _camStart.y - REACTOR_CORE[1],
      _camStart.z - REACTOR_CORE[2],
    )
    .normalize()
    .clone()
}

/**
 * Graphite body.
 *
 * Kept deliberately dark: at metalness ~0.95 the base colour tints every
 * reflection, so a lighter body turns the whole shell into flat brown paint.
 * Dark here means the champagne only ever appears as *light* — highlight, rim,
 * env bounce — which is what separates machined metal from a coloured ball.
 */
const structuralColor = (target: THREE.Color) =>
  target.copy(sceneColors.base).lerp(sceneColors.ink, 0.085)

/** Soft studio gradient → PMREM. Reads as bounced light without a path tracer. */
const createStudioEnv = (gl: THREE.WebGLRenderer) => {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    // Graphite studio, not a warm room. At metalness ~0.96 this gradient *is*
    // the surface colour, so a brown env paints a brown ball; keeping it neutral
    // lets the champagne arrive as highlight instead of as pigment.
    const gradient = ctx.createLinearGradient(0, 0, 0, size)
    gradient.addColorStop(0, '#28313d')
    gradient.addColorStop(0.45, '#0a0d12')
    gradient.addColorStop(0.74, '#15110d')
    gradient.addColorStop(1, '#241a12')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    // Key bloom, deliberately wide and low-amplitude. A tight hot spot lands
    // whole flat facets on pure white, which reads as a rendering fault rather
    // than as a glint.
    const bloom = ctx.createRadialGradient(
      size * 0.72,
      size * 0.28,
      4,
      size * 0.72,
      size * 0.28,
      size * 0.62,
    )
    bloom.addColorStop(0, 'rgba(255,206,150,0.3)')
    bloom.addColorStop(0.35, 'rgba(230,200,145,0.12)')
    bloom.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = bloom
    ctx.fillRect(0, 0, size, size)

    // A cool counter-bounce on the opposite side keeps the metal from reading
    // as a single warm wash.
    const cool = ctx.createRadialGradient(
      size * 0.2,
      size * 0.62,
      4,
      size * 0.2,
      size * 0.62,
      size * 0.38,
    )
    cool.addColorStop(0, 'rgba(150,180,210,0.3)')
    cool.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = cool
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

/**
 * Volumetric limb glow.
 *
 * This replaces a camera-facing additive plane. A billboarded sprite always
 * reads as a sticker pasted behind the object: it has a flat edge, it never
 * wraps, and it slides against the shell as the camera moves. This is a
 * back-faced sphere whose alpha is a fresnel of the view vector, so the light
 * genuinely sits *around* the optic — brightest where the surface turns away at
 * the limb, invisible dead centre so the core still reads through it.
 */
const glowVertexShader = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vPosW;

void main() {
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPosW = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const glowFragmentShader = /* glsl */ `
uniform vec3 uInner;
uniform vec3 uOuter;
uniform float uIntensity;
uniform float uPower;

varying vec3 vNormalW;
varying vec3 vPosW;

void main() {
  vec3 view = normalize(cameraPosition - vPosW);
  // Brightest where the back face is square to the lens, falling to zero at the
  // shell's own silhouette. The inverse — peaking at the silhouette — is what
  // produces a hard-edged ring of light, which reads as a pasted-on halo.
  // The bright centre is hidden behind the opaque optic, so what survives is a
  // glow that starts at the shell's rim and fades outward with no visible edge.
  float facing = abs(dot(normalize(vNormalW), view));
  float glow = pow(clamp(facing, 0.0, 1.0), uPower);
  vec3 tint = mix(uOuter, uInner, glow);
  gl_FragColor = vec4(tint, glow * uIntensity);
}
`

const createGlowMaterial = (power: number) =>
  new THREE.ShaderMaterial({
    vertexShader: glowVertexShader,
    fragmentShader: glowFragmentShader,
    uniforms: {
      uInner: { value: new THREE.Color() },
      uOuter: { value: new THREE.Color() },
      uIntensity: { value: 0 },
      uPower: { value: power },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
    toneMapped: false,
  })

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

export const HeroStage = ({
  quality,
  cue,
}: {
  quality: Quality
  cue: string
}) => {
  const root = useRef<THREE.Group>(null)
  const shell = useRef<THREE.Group>(null)
  const housing = useRef<THREE.Group>(null)
  const outerRing = useRef<THREE.Mesh>(null)
  const innerRing = useRef<THREE.Mesh>(null)
  const core = useRef<THREE.Mesh>(null)
  const glowNear = useRef<THREE.Mesh>(null)
  const glowFar = useRef<THREE.Mesh>(null)
  const cueGroup = useRef<THREE.Group>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const keyLight = useRef<THREE.DirectionalLight>(null)
  const fillLight = useRef<THREE.DirectionalLight>(null)
  const rimLight = useRef<THREE.PointLight>(null)
  const coreGlow = useRef<THREE.PointLight>(null)

  const presence = useRef(1)
  const hovered = useRef(-1)
  const hoverAmts = useRef<Float32Array | null>(null)
  const fireAmts = useRef<Float32Array | null>(null)
  const fireGoals = useRef<Float32Array | null>(null)

  const invalidate = useThree((state) => state.invalidate)
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const aspect = useThree((state) => state.viewport.aspect)
  const heightPx = useThree((state) => state.size.height)
  const fit = computeViewportFit(aspect, heightPx)
  const stageScale = heroSizeFit(fit)

  const cinema = quality === 'cinema'
  const detail = cinema ? 2 : 1

  const viewAxis = useMemo(heroViewAxis, [])
  const envMap = useMemo(() => createStudioEnv(gl), [gl])
  const shellGeo = useMemo(
    () => buildHeroShell(SHELL_RADIUS, detail, viewAxis),
    [detail, viewAxis],
  )

  /** Per-facet hover / fire, uploaded as a 1-pixel-tall lookup. */
  const shardState = useMemo(() => {
    const data = new Float32Array(shellGeo.count * 4)
    const texture = new THREE.DataTexture(
      data,
      shellGeo.count,
      1,
      THREE.RGBAFormat,
      THREE.FloatType,
    )
    texture.minFilter = THREE.NearestFilter
    texture.magFilter = THREE.NearestFilter
    texture.needsUpdate = true
    return { data, texture }
  }, [shellGeo.count])

  const peel = useMemo(
    () => createPeelUniforms(shardState.texture, shellGeo.count),
    [shardState.texture, shellGeo.count],
  )

  useEffect(() => {
    hoverAmts.current = new Float32Array(shellGeo.count)
    fireAmts.current = new Float32Array(shellGeo.count)
    fireGoals.current = new Float32Array(shellGeo.count)
  }, [shellGeo.count])

  const geometries = useMemo(() => {
    // 3 radial segments = a triangular cross-section: a machined bevel that
    // catches the rim light, not a soft tube.
    const outer = new THREE.TorusGeometry(1.02, 0.036, 3, cinema ? 96 : 56)
    const inner = new THREE.TorusGeometry(0.9, 0.018, 3, cinema ? 72 : 44)
    const meridian = new THREE.TorusGeometry(
      SHELL_RADIUS * 1.01,
      0.0055,
      3,
      cinema ? 84 : 48,
    )
    return {
      outer,
      inner,
      meridian,
      core: new THREE.IcosahedronGeometry(0.3, cinema ? 2 : 1),
      // Two shells: a tight one that hugs the limb, a wide one that gives the
      // optic a bed of atmosphere to sit in.
      glowNear: new THREE.SphereGeometry(1.16, cinema ? 48 : 28, cinema ? 32 : 20),
      glowFar: new THREE.SphereGeometry(1.95, cinema ? 40 : 24, cinema ? 28 : 16),
      cuePlate: new THREE.BoxGeometry(1.75, 0.44, 0.1),
      cueChevron: createChevronGeometry(),
      cueLabel: new THREE.PlaneGeometry(1.58, 0.33),
    }
  }, [cinema])

  const materials = useMemo(() => {
    const face = new THREE.MeshPhysicalMaterial({
      color: structuralColor(new THREE.Color()),
      metalness: 0.96,
      // Flat-shaded facets share one normal, so a tight specular lobe lights the
      // *entire* facet at once and clips to a white triangle. A broader lobe puts
      // the reading back on the env reflection, which varies facet to facet.
      roughness: 0.38,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      envMap,
      envMapIntensity: 1.35,
      emissive: sceneColors.accent.clone(),
      emissiveIntensity: 1,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    })
    const wire = new THREE.LineBasicMaterial({
      color: sceneColors.ink.clone(),
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      toneMapped: false,
    })
    const ring = new THREE.MeshPhysicalMaterial({
      color: structuralColor(new THREE.Color()),
      metalness: 0.95,
      roughness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMap,
      envMapIntensity: 1.15,
      emissive: sceneColors.accent.clone(),
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0,
    })
    const ringInner = ring.clone()
    const meridian = new THREE.MeshBasicMaterial({
      color: sceneColors.signal.clone(),
      transparent: true,
      opacity: 0,
      toneMapped: false,
      depthWrite: false,
    })
    const coreMat = new THREE.MeshBasicMaterial({
      color: sceneColors.signal.clone(),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
    // Tight rim, then a wide atmospheric bed. Lower power = the falloff reaches
    // further past the optic, so the near shell stays a crisp lip of light and
    // the far one spreads into haze.
    const glowNearMat = createGlowMaterial(1.7)
    const glowFarMat = createGlowMaterial(2.1)
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

    return {
      face,
      wire,
      ring,
      ringInner,
      meridian,
      core: coreMat,
      glowNear: glowNearMat,
      glowFar: glowFarMat,
      cueBody,
      cueAccent,
      cueLabel,
      cueTexture,
    }
  }, [cue, envMap])

  // The displacement has to be attached before the first compile, not in a frame.
  useEffect(() => {
    applyLitPeel(materials.face, peel)
    applyLinePeel(materials.wire, peel)
    peel.uCorridor.value.copy(viewAxis).multiplyScalar(0.85)
  }, [materials.face, materials.wire, peel, viewAxis])

  useEffect(
    () => () => {
      envMap.dispose()
      shellGeo.faces.dispose()
      shellGeo.wires.dispose()
      shardState.texture.dispose()
      Object.values(geometries).forEach((geometry) => geometry.dispose())
      materials.face.dispose()
      materials.wire.dispose()
      materials.ring.dispose()
      materials.ringInner.dispose()
      materials.meridian.dispose()
      materials.core.dispose()
      materials.glowNear.dispose()
      materials.glowFar.dispose()
      materials.cueBody.dispose()
      materials.cueAccent.dispose()
      materials.cueLabel.dispose()
      materials.cueTexture.dispose()
    },
    [envMap, shellGeo, shardState, geometries, materials],
  )

  useEffect(
    () => () => {
      document.body.style.cursor = ''
    },
    [],
  )

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

    const live = presence.current
    const rootNode = root.current
    if (rootNode) rootNode.visible = live > 0.01
    if (live <= 0.01) return

    // Straight with scroll: the aperture is the scroll value, undamped.
    const open = clamp01((build - OPEN_START) / (OPEN_END - OPEN_START))
    const fling = THREE.MathUtils.smoothstep(build, 0.07, 0.18) ** 0.7
    // Ornament yields to the scroll read the instant the visitor moves.
    const idle = idleAmount(1 - open)

    const master = pulse.master
    const corePulse = pulseAt(CORE_PHASE)
    const ringPulse = pulseAt(RING_PHASE)
    const cuePulse = pulseAt(CUE_PHASE)
    const rimPulse = pulseAt(RIM_PHASE)

    // ---- per-facet pointer state -------------------------------------------
    const hovers = hoverAmts.current
    const fires = fireAmts.current
    const goals = fireGoals.current
    let stateDirty = false
    let settling = false
    if (hovers && fires && goals) {
      const hoverTarget = hovered.current
      for (let index = 0; index < shellGeo.count; index++) {
        const wantHover = hoverTarget === index && open < 0.25 && goals[index] < 0.5
        const nextHover = THREE.MathUtils.damp(
          hovers[index],
          wantHover ? 1 : 0,
          7,
          delta,
        )
        const nextFire = THREE.MathUtils.damp(fires[index], goals[index], 3.2, delta)
        if (
          Math.abs(nextHover - hovers[index]) > 1e-4 ||
          Math.abs(nextFire - fires[index]) > 1e-4
        ) {
          hovers[index] = nextHover
          fires[index] = nextFire
          shardState.data[index * 4] = nextHover
          shardState.data[index * 4 + 1] = nextFire
          stateDirty = true
          settling = true
        }
      }
    }
    if (stateDirty) shardState.texture.needsUpdate = true

    // ---- shell -------------------------------------------------------------
    peel.uOpen.value = open
    peel.uFling.value = fling
    peel.uTime.value = time
    peel.uBase.value = BASE_SEPARATION
    peel.uBreathe.value = 0.014 * idle
    peel.uGlowColor.value.copy(sceneColors.accent).multiplyScalar(0.5)
    peel.uRimColor.value
      .copy(sceneColors.signal)
      .lerp(sceneColors.accent, rimPulse * 0.6)
    peel.uRimGain.value = (0.22 + rimPulse * 0.3 * idle) * live

    structuralColor(_structural)
    materials.face.color.copy(_structural).lerp(sceneColors.ink, 0.08 + master * 0.06)
    materials.face.emissive
      .copy(sceneColors.accent)
      .lerp(sceneColors.signal, master * 0.55)
    materials.face.emissiveIntensity = (0.05 + master * 0.07 * idle) * live
    materials.face.envMapIntensity = 1.05 + master * 0.25
    materials.face.opacity = live
    materials.face.depthWrite = open < 0.18

    materials.wire.color
      .copy(sceneColors.ink)
      .lerp(sceneColors.accent, 0.2 + rimPulse * 0.4)
      .lerp(sceneColors.signal, master * 0.18)
    materials.wire.opacity = (0.34 + rimPulse * 0.34 * idle) * live * (1 - fling * 0.7)

    if (rootNode) {
      const idleYaw = Math.sin(time * 0.045) * 0.12 * idle
      const idlePitch = Math.cos(time * 0.0315) * 0.05 * idle
      rootNode.rotation.y = THREE.MathUtils.damp(
        rootNode.rotation.y,
        sceneState.pointerX * 0.028 * idle + idleYaw,
        2.2,
        delta,
      )
      rootNode.rotation.x = THREE.MathUtils.damp(
        rootNode.rotation.x,
        -sceneState.pointerY * 0.018 * idle + idlePitch,
        2.2,
        delta,
      )
      rootNode.position.y = REACTOR_CORE[1] + Math.sin(time * 0.55) * 0.028 * idle
      rootNode.scale.setScalar(stageScale * (1 + Math.sin(time * 0.7) * 0.012 * idle))
    }
    if (shell.current) shell.current.rotation.y = time * 0.035 * idle

    // ---- housing -----------------------------------------------------------
    // The rings hold the view axis while the shell turns inside them, which is
    // what separates "instrument" from "spinning ball".
    const housingNode = housing.current
    if (housingNode) {
      housingNode.quaternion.copy(camera.quaternion)
      housingNode.scale.setScalar(1 + open * 0.28)
    }
    if (outerRing.current) outerRing.current.rotation.z = time * 0.06 * idle
    if (innerRing.current) innerRing.current.rotation.z = -time * 0.1 * idle - open * 0.9

    const ringLive = live * (1 - open * 0.55)
    materials.ring.color.copy(_structural)
    materials.ring.emissive
      .copy(sceneColors.accent)
      .lerp(sceneColors.signal, ringPulse * 0.5)
    materials.ring.emissiveIntensity = 0.18 + ringPulse * 0.5 * idle + open * 0.5
    materials.ring.envMapIntensity = 1 + ringPulse * 0.4
    materials.ring.opacity = ringLive
    materials.ringInner.color.copy(_structural)
    materials.ringInner.emissive.copy(sceneColors.signal)
    materials.ringInner.emissiveIntensity = 0.25 + (1 - ringPulse) * 0.55 * idle
    materials.ringInner.opacity = ringLive * 0.9

    materials.meridian.color
      .copy(sceneColors.signal)
      .lerp(sceneColors.accent, master * 0.35)
    materials.meridian.opacity = (0.14 + master * 0.16 * idle) * live * (1 - open)

    // ---- core + limb glow --------------------------------------------------
    // The core is the reward for the aperture opening: hidden when shut, brightest
    // as the facets clear, gone with the hero.
    const coreReveal = THREE.MathUtils.smoothstep(open, 0.05, 0.55)
    if (core.current) {
      core.current.scale.setScalar(0.68 + corePulse * 0.07 + coreReveal * 0.5)
      core.current.rotation.y = time * 0.12
      core.current.rotation.x = time * 0.07
    }
    materials.core.color.copy(sceneColors.signal).lerp(sceneColors.accent, corePulse)
    materials.core.opacity =
      (0.16 + corePulse * 0.14 * idle + coreReveal * 0.5) * live

    // The limb wraps the shell rather than sitting behind it, so it breathes on
    // the master clock and widens as the aperture lets more light out.
    const nearUniforms = materials.glowNear.uniforms
    nearUniforms.uInner.value.copy(sceneColors.accent).lerp(sceneColors.signal, 0.35)
    nearUniforms.uOuter.value.copy(sceneColors.signal)
    nearUniforms.uIntensity.value =
      (0.26 + master * 0.13 * idle + coreReveal * 0.42) * live
    if (glowNear.current) {
      glowNear.current.scale.setScalar(1 + master * 0.012 * idle + open * 0.34)
    }

    const farUniforms = materials.glowFar.uniforms
    farUniforms.uInner.value.copy(sceneColors.accent).multiplyScalar(0.55)
    farUniforms.uOuter.value.copy(sceneColors.accent).lerp(sceneColors.signal, 0.6)
    farUniforms.uIntensity.value =
      (0.07 + master * 0.05 * idle + coreReveal * 0.1) * live
    if (glowFar.current) {
      glowFar.current.scale.setScalar(1 + master * 0.02 * idle + open * 0.5)
    }

    // ---- cue ---------------------------------------------------------------
    const cueVisibility = live * (1 - THREE.MathUtils.smoothstep(build, 0.04, 0.14))
    materials.cueBody.color.copy(_structural)
    materials.cueBody.emissive.copy(sceneColors.accent)
    materials.cueBody.emissiveIntensity = 0.1 + cuePulse * 0.22
    materials.cueBody.opacity = (0.9 + cuePulse * 0.08) * cueVisibility
    materials.cueBody.envMapIntensity = 0.55 + cuePulse * 0.25
    materials.cueAccent.color.copy(sceneColors.accent)
    materials.cueAccent.emissive.copy(sceneColors.accent)
    materials.cueAccent.emissiveIntensity = 0.45 + cuePulse * 0.55
    materials.cueAccent.opacity = (0.88 + cuePulse * 0.1) * cueVisibility
    materials.cueLabel.opacity = (0.94 + cuePulse * 0.06) * cueVisibility
    if (cueGroup.current) {
      cueGroup.current.visible = cueVisibility > 0.035
      cueGroup.current.position.set(0, -0.98 + Math.sin(time * 1.35) * 0.035 * idle, 0.78)
      cueGroup.current.scale.setScalar(0.9 + cuePulse * 0.035)
      // Face the lens without orbiting off-centre (lookAt skewed the badge).
      cueGroup.current.quaternion.copy(camera.quaternion)
    }

    // ---- lighting ----------------------------------------------------------
    if (hemi.current) {
      hemi.current.color.copy(sceneColors.ink)
      hemi.current.groundColor.copy(sceneColors.base).lerp(sceneColors.accent, 0.12)
      hemi.current.intensity = (0.42 + master * 0.12) * live
    }
    if (keyLight.current) {
      keyLight.current.color.copy(sceneColors.ink).lerp(sceneColors.accent, 0.18)
      // Enough to separate one facet from the next, not enough to clip. On flat
      // facets a punctual lobe is all-or-nothing — every pixel shares a normal,
      // so the facet is either unlit or solid white with no gradient across it.
      // Raking from the side rather than from overhead spreads the falloff over
      // many facets instead of detonating one.
      keyLight.current.intensity = (0.62 + master * 0.18) * live
      keyLight.current.position.set(
        3.1 + Math.sin(time * 0.25) * 0.35 * idle,
        1.35,
        2.2 + Math.cos(time * 0.22) * 0.3 * idle,
      )
    }
    if (fillLight.current) {
      fillLight.current.color.copy(sceneColors.signal)
      fillLight.current.intensity = (0.28 + pulse.counter * 0.22) * live
    }
    if (rimLight.current) {
      const angle = time * 0.55 * (0.25 + idle * 0.75)
      // Orbits well clear of the shell. At the old 1.6 the light passed within
      // ~0.8 of the facets, and inverse-square put those facets far past white.
      rimLight.current.position.set(
        Math.cos(angle) * 2.7,
        0.35 + Math.sin(time * 0.7) * 0.2 * idle,
        Math.sin(angle) * 2.7,
      )
      rimLight.current.color.copy(sceneColors.accent).lerp(sceneColors.signal, rimPulse)
      rimLight.current.intensity = (0.85 + rimPulse * 0.5) * live
    }
    if (coreGlow.current) {
      coreGlow.current.color.copy(sceneColors.signal).lerp(sceneColors.accent, corePulse)
      coreGlow.current.intensity =
        (0.55 + corePulse * 0.65) * live * (0.35 + coreReveal * 0.9)
    }

    if (!cinema && (settling || live > 0.015)) invalidate()
  })

  const shardAt = (event: ThreeEvent<PointerEvent>) =>
    event.faceIndex === undefined || event.faceIndex === null
      ? -1
      : Math.floor(event.faceIndex / TRIS_PER_SHARD)

  const handleMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    const index = shardAt(event)
    if (index === hovered.current) return
    hovered.current = index
    document.body.style.cursor = index >= 0 ? 'pointer' : ''
    invalidate()
  }

  const handleOut = () => {
    if (hovered.current === -1) return
    hovered.current = -1
    document.body.style.cursor = ''
    invalidate()
  }

  const handleClick = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    const index = shardAt(event)
    const goals = fireGoals.current
    if (index < 0 || !goals || goals[index] > 0.5) return
    goals[index] = 1
    hovered.current = -1
    document.body.style.cursor = ''
    invalidate()
  }

  return (
    <group ref={root} position={REACTOR_CORE}>
      <hemisphereLight ref={hemi} args={['#f3eee4', '#050608', 0.45]} />
      <directionalLight ref={keyLight} position={[2.2, 3.2, 2.6]} intensity={1.2} />
      <directionalLight ref={fillLight} position={[-2.6, 0.8, 1.4]} intensity={0.3} />
      <pointLight ref={rimLight} distance={5.2} decay={2} intensity={1.5} />
      <pointLight ref={coreGlow} position={[0, 0.05, 0]} distance={3.2} decay={2} />

      <mesh
        ref={glowFar}
        geometry={geometries.glowFar}
        material={materials.glowFar}
        frustumCulled={false}
        renderOrder={-2}
      />
      <mesh
        ref={glowNear}
        geometry={geometries.glowNear}
        material={materials.glowNear}
        frustumCulled={false}
        renderOrder={-1}
      />

      <group ref={shell}>
        <mesh
          geometry={shellGeo.faces}
          material={materials.face}
          frustumCulled={false}
          onPointerMove={handleMove}
          onPointerOut={handleOut}
          onClick={handleClick}
        />
        <lineSegments
          geometry={shellGeo.wires}
          material={materials.wire}
          frustumCulled={false}
          renderOrder={2}
        />
        {cinema ? (
          <>
            <mesh geometry={geometries.meridian} material={materials.meridian} />
            <mesh
              geometry={geometries.meridian}
              material={materials.meridian}
              rotation={[Math.PI / 2, 0, 0]}
            />
            <mesh
              geometry={geometries.meridian}
              material={materials.meridian}
              rotation={[0, Math.PI / 2, 0]}
            />
          </>
        ) : null}
      </group>

      <mesh
        ref={core}
        geometry={geometries.core}
        material={materials.core}
        frustumCulled={false}
        renderOrder={1}
      />

      <group ref={housing}>
        <mesh ref={outerRing} geometry={geometries.outer} material={materials.ring} />
        <mesh
          ref={innerRing}
          geometry={geometries.inner}
          material={materials.ringInner}
        />
      </group>

      <group ref={cueGroup} position={[0, -0.92, 0.72]}>
        <mesh geometry={geometries.cuePlate} material={materials.cueBody} />
        <mesh
          geometry={geometries.cueChevron}
          material={materials.cueAccent}
          position={[0, -0.3, 0.03]}
          scale={0.88}
        />
        <mesh
          geometry={geometries.cueLabel}
          material={materials.cueLabel}
          position={[0, 0.02, 0.06]}
        />
      </group>
    </group>
  )
}
