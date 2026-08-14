import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  clearHot,
  markHot,
  play,
  punch,
  pushLog,
  reactorControl,
} from '../control/reactorControl'
import { ReconstructMaterial } from '../ReconstructMaterial'
import { clamp01, liveFor, sceneState } from '../sceneState'
import { toShards } from '../shardGeometry'
import { punchScale, softAssemble, softDisassemble } from '../ui/assembleDrama'
import {
  LEDGER_BARS,
  ledgerBar,
  ledgerChassis,
  totemChassis,
  vaultChassis,
  vaultSeal,
  type ChassisKind,
} from './chassis'

/**
 * A featured project, as a bay in the room.
 *
 * The reading plate beside it carries the words; this carries the evidence — the
 * actual screenshot, arriving as photo debris that locks into a housing. It
 * shares the console's beat exactly (same enter/exit), so the work and the words
 * about the work are never on screen at different times.
 *
 * Cinema only. On the lighter quality the plate alone tells the story and the
 * bay is the first thing that should not exist.
 */

/** Aspect of the project shots. */
const PANEL_ASPECT = 0.625

/** Assemble value at which the module counts as seated. */
const LOCK_AT = 0.88

interface ModuleRigProps {
  /** Console width in world units — the bay is sized and offset from it. */
  consoleWidth: number
  consoleHeight: number
  /** Which lane the console sits in; the bay takes the other one. */
  side: -1 | 0 | 1
  enter: number
  span: number
  exit: number
  exitSpan: number
  moduleIndex: number
  shot: string
  chassis: ChassisKind
  label: string
}

const _matrix = new THREE.Matrix4()
const _position = new THREE.Vector3()
const _quaternion = new THREE.Quaternion()
const _scale = new THREE.Vector3()

export const ModuleRig = ({
  consoleWidth,
  consoleHeight,
  side,
  enter,
  span,
  exit,
  exitSpan,
  moduleIndex,
  shot,
  chassis,
  label,
}: ModuleRigProps) => {
  const group = useRef<THREE.Group>(null)
  const seal = useRef<THREE.Mesh>(null)
  const bars = useRef<THREE.InstancedMesh>(null)
  const focus = useRef(0)
  const hover = useRef(0)
  const locked = useRef(false)
  const invalidate = useThree((state) => state.invalidate)

  // Sized off the plate it belongs to, then bounded by the plate's own height so
  // a bay never towers over the copy it is evidence for. The shot's aspect is
  // preserved either way — a stretched screenshot reads as a mistake.
  const height = Math.min(
    consoleWidth * 1.15 * PANEL_ASPECT,
    consoleHeight * 1.1,
  )
  const width = height / PANEL_ASPECT
  // The bay takes the lane the plate is not using, so the pair straddles the
  // lens instead of stacking on one side of it.
  const away = side === 0 ? 1 : (-side as 1 | -1)
  const offsetX = away * (consoleWidth / 2 + width / 2 + 0.45)

  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const [near, setNear] = useState(false)

  /*
   * A shot is fetched one beat before its bay is needed, never on mount.
   *
   * Three full-resolution screenshots decoded at load cost about a megabyte
   * before the visitor has scrolled past the hero, for images that are not on
   * screen for another two chapters.
   */
  useFrame(() => {
    if (near) return
    if (sceneState.build >= enter - Math.max(span, 0.02) * 1.2) setNear(true)
  })

  useEffect(() => {
    if (!near) return
    let cancelled = false
    const loader = new THREE.TextureLoader()
    loader.load(
      shot,
      (loaded) => {
        if (cancelled) {
          loaded.dispose()
          return
        }
        loaded.colorSpace = THREE.SRGBColorSpace
        loaded.anisotropy = 4
        setTexture(loaded)
      },
      undefined,
      // A failed shot leaves a shaded housing. The document still carries the
      // real image, so this must never surface as an error.
      () => undefined,
    )
    return () => {
      cancelled = true
    }
  }, [near, shot])

  useEffect(
    () => () => {
      texture?.dispose()
    },
    [texture],
  )

  const panelGeometry = useMemo(() => {
    const source = new THREE.PlaneGeometry(width, height, 12, 8)
    const shards = toShards(source)
    source.dispose()
    return shards
  }, [width, height])

  const chassisGeometry = useMemo(() => {
    if (chassis === 'vault') return vaultChassis(width, height)
    if (chassis === 'ledger') return ledgerChassis(width, height)
    return totemChassis(width, height)
  }, [chassis, width, height])

  const sealGeometry = useMemo(
    () => (chassis === 'vault' ? vaultSeal(width) : null),
    [chassis, width],
  )

  const barGeometry = useMemo(
    () => (chassis === 'ledger' ? ledgerBar() : null),
    [chassis],
  )

  const panelMaterial = useMemo(
    () =>
      new ReconstructMaterial({
        spread: 3.4,
        jitter: 0.72,
        depthSpan: 0.16,
      }),
    [],
  )

  const frameMaterial = useMemo(
    () =>
      new ReconstructMaterial({
        spread: 0.6,
        jitter: 0.14,
        depthSpan: 0.04,
        opacity: 0.92,
      }),
    [],
  )

  useEffect(() => {
    panelMaterial.uniforms.uMap.value =
      texture ?? panelMaterial.uniforms.uMap.value
    panelMaterial.uniforms.uHasMap.value = texture ? 1 : 0
  }, [panelMaterial, texture])

  useEffect(
    () => () => {
      panelGeometry.dispose()
      chassisGeometry.dispose()
      sealGeometry?.dispose()
      barGeometry?.dispose()
      panelMaterial.dispose()
      frameMaterial.dispose()
    },
    [
      panelGeometry,
      chassisGeometry,
      sealGeometry,
      barGeometry,
      panelMaterial,
      frameMaterial,
    ],
  )

  useFrame((state, delta) => {
    const build = sceneState.build
    const time = state.clock.elapsedTime
    const progress = clamp01((build - enter) / Math.max(span, 0.001))
    const leaving = clamp01((build - exit) / Math.max(exitSpan, 0.001))
    const assemble = softAssemble(progress)
    const { presence: leavePresence, scatter } = softDisassemble(leaving)
    const presence = assemble * leavePresence

    const node = group.current
    if (node) {
      node.visible = presence > 0.02
      node.scale.setScalar(punchScale(assemble, scatter))
    }
    if (presence <= 0.02) {
      locked.current = false
      return
    }

    focus.current = THREE.MathUtils.damp(
      focus.current,
      sceneState.focus === moduleIndex ? 1 : 0,
      6,
      delta,
    )
    hover.current = THREE.MathUtils.damp(
      hover.current,
      reactorControl.hotId === `module-${moduleIndex}` ? 1 : 0,
      9,
      delta,
    )

    /*
     * The slam.
     *
     * A module that simply finishes fading in has arrived; a module that lands
     * has *seated*. One latch, fired once per pass, gives the moment a sound, a
     * short camera kick and a line in the log — which is the whole difference
     * between a page loading content and a machine accepting a part.
     */
    if (!locked.current && assemble >= LOCK_AT && leaving < 0.2) {
      locked.current = true
      play('lock', moduleIndex)
      play('whoosh')
      punch(0.45)
      pushLog(`module ${String(moduleIndex + 1).padStart(2, '0')} · ${label}`)
    }
    if (locked.current && assemble < LOCK_AT - 0.12) locked.current = false

    const live = liveFor(build)
    const lit = focus.current * 0.6 + hover.current * 0.4

    panelMaterial.setShape({ spread: 3.4, jitter: 0.72, drift: 1 })
    panelMaterial.sync({
      build,
      live,
      focus: lit,
      time,
      velocity: sceneState.velocity,
      assembleAt: assemble * 0.82,
    })
    panelMaterial.uniforms.uOpacity.value = presence

    frameMaterial.setShape({
      spread: THREE.MathUtils.lerp(0.6, 0.05, assemble),
      jitter: THREE.MathUtils.lerp(0.14, 0.02, assemble),
      drift: THREE.MathUtils.lerp(1, 0.04, assemble),
    })
    frameMaterial.sync({
      build,
      live,
      focus: 0.2 + lit * 0.6,
      time,
      velocity: sceneState.velocity,
      assembleAt: assemble * 0.9,
    })
    frameMaterial.uniforms.uOpacity.value = presence * (0.55 + lit * 0.35)

    // The seal retracts as the hatch is accepted — the shot is behind it, so
    // unsealing is literally what reveals the work.
    const sealNode = seal.current
    if (sealNode) {
      const open = THREE.MathUtils.smoothstep(assemble, 0.55, 0.95)
      sealNode.position.x = -width * 0.98 * open
      sealNode.visible = open < 0.99
    }

    // The book breathes. Each bar keeps a stable phase off the golden angle, so
    // the row reads as a quote feed rather than as a row of lamps blinking —
    // and it hangs *below* the rail rather than over the shot, because a chassis
    // that obscures the work is decoration standing in front of evidence.
    const barNode = bars.current
    if (barNode) {
      const spread = width * 0.94
      const rail = -height / 2 - 0.18
      for (let index = 0; index < LEDGER_BARS; index += 1) {
        const t = index / (LEDGER_BARS - 1)
        const phase = time * 0.9 + index * 2.399963
        const amount =
          0.2 +
          (0.5 + 0.5 * Math.sin(phase)) * (0.4 + lit * 0.5) * assemble +
          reactorControl.audio * 0.3
        const barHeight = Math.min(0.46, 0.05 + amount * 0.36)
        _position.set(-spread / 2 + t * spread, rail - barHeight / 2, 0)
        _quaternion.identity()
        _scale.set(spread / LEDGER_BARS - 0.035, barHeight, 0.07)
        _matrix.compose(_position, _quaternion, _scale)
        barNode.setMatrixAt(index, _matrix)
      }
      barNode.instanceMatrix.needsUpdate = true
    }
  })

  const handleOver = () => {
    markHot(`module-${moduleIndex}`)
    sceneState.focus = moduleIndex
    invalidate()
  }

  const handleOut = () => {
    clearHot(`module-${moduleIndex}`)
    if (sceneState.focus === moduleIndex) sceneState.focus = -1
    invalidate()
  }

  return (
    <group
      ref={group}
      position={[offsetX, 0.08, -0.3]}
      rotation={[0, away * -0.2, 0]}
    >
      <mesh
        geometry={panelGeometry}
        material={panelMaterial}
        renderOrder={2}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      />
      {/* Far enough back that no bevel or plate face can cross in front of the
          shot. The housing frames the evidence; it never draws over it. */}
      <mesh
        geometry={chassisGeometry}
        material={frameMaterial}
        position={[0, 0, -0.18]}
        renderOrder={1}
      />
      {sealGeometry ? (
        <mesh
          ref={seal}
          geometry={sealGeometry}
          material={frameMaterial}
          position={[0, 0, 0.09]}
          renderOrder={3}
        />
      ) : null}
      {barGeometry ? (
        <instancedMesh
          ref={bars}
          args={[barGeometry, frameMaterial, LEDGER_BARS]}
          frustumCulled={false}
          renderOrder={3}
        />
      ) : null}
    </group>
  )
}
