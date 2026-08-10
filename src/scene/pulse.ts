/**
 * The master clock.
 *
 * One tempo for the whole room. Every pulsing thing — hero rim, atmosphere discs,
 * floor scan, reactor heart, console telemetry, conduit energy — reads from here
 * instead of running its own `sin(time * something)`. That is the difference
 * between a room that breathes and a room that flickers: the amplitudes differ,
 * the phases are locked, and the tempo never diverges.
 *
 * Two rules the rest of the scene depends on:
 *
 * 1. Idle ornament yields to scroll. `pulse.idle` collapses toward 0 the moment
 *    the visitor moves, so the scroll-linear read always wins the frame. Multiply
 *    every time-driven amplitude by it.
 * 2. Nothing here drives a storytelling axis. This module is light and breath
 *    only; position along the corridor belongs to `sceneState.build`.
 */
import * as THREE from 'three'
import { clamp01, sceneState } from './sceneState'

/**
 * Slow enough to read as breath rather than a blink. Sits at the low end of the
 * 0.6–1.0 Hz band so the room feels expensive when parked.
 */
export const MASTER_PULSE_HZ = 0.72

/**
 * Locked phase step between chapters. A sixth of a turn keeps neighbours legibly
 * offset without ever landing in counter-phase, which reads as two clocks.
 */
const SECTION_PHASE_STEP = Math.PI / 3

/** Raised cosine in [0, 1] — soft attack and decay, never a square edge. */
export const softPulse = (time: number, hz: number, phase = 0) =>
  0.5 - 0.5 * Math.cos(time * hz * Math.PI * 2 + phase)

interface PulseClock {
  /** Scene clock in seconds, mirrored so callers need no `state`. */
  time: number
  /** Master envelope, 0 → 1 at `MASTER_PULSE_HZ`. The room's heartbeat. */
  master: number
  /** The master's reverse. Rims counter-light the core rather than doubling it. */
  counter: number
  /** Half-tempo envelope for slow colour drift across the palette. */
  swell: number
  /**
   * 1 when parked, → 0 while the visitor scrolls. Every idle amplitude in the
   * scene multiplies by this so ornament never competes with the scroll read.
   */
  idle: number
  /** Smoothed scroll speed, 0 → 1. Feeds camera weight and shader smear. */
  speed: number
}

export const pulse: PulseClock = {
  time: 0,
  master: 0,
  counter: 1,
  swell: 0,
  idle: 1,
  speed: 0,
}

/**
 * Global amplitude ceiling. Reduced-motion visitors still get the scene (the
 * capability gate hands them `lite`), but the room holds its breath: light stays
 * at the envelope midpoint instead of oscillating.
 */
let depth = 1

export const setPulseDepth = (value: number) => {
  depth = clamp01(value)
}

/** Raw scroll velocity that counts as "moving at speed". */
const SPEED_SCALE = 0.0075
/** Idle recovers gently when the visitor parks… */
const IDLE_ATTACK = 2.4
/** …and drops fast the instant they scroll, so ornament never lags the story. */
const IDLE_RELEASE = 9

/**
 * Advances the clock. Called once per frame from `PulseDriver` at a negative
 * `useFrame` priority, which sorts ahead of every other subscriber while leaving
 * R3F's automatic render in place.
 */
export const advancePulse = (time: number, delta: number) => {
  pulse.time = time

  const master = softPulse(time, MASTER_PULSE_HZ)
  // Fold toward the envelope midpoint rather than toward zero: at depth 0 the
  // room sits at steady half-light instead of going dark.
  pulse.master = 0.5 + (master - 0.5) * depth
  pulse.counter = 1 - pulse.master
  const swell = softPulse(time, MASTER_PULSE_HZ * 0.5, Math.PI * 0.5)
  pulse.swell = 0.5 + (swell - 0.5) * depth

  const speed = clamp01(Math.abs(sceneState.velocity) * SPEED_SCALE)
  pulse.speed = THREE.MathUtils.damp(pulse.speed, speed, 6, delta)

  const target = (1 - clamp01(pulse.speed * 1.35)) * depth
  pulse.idle = THREE.MathUtils.damp(
    pulse.idle,
    target,
    target < pulse.idle ? IDLE_RELEASE : IDLE_ATTACK,
    delta,
  )
}

/**
 * The master envelope at a locked phase offset. Use this instead of a local
 * `sin` so the object joins the room's tempo.
 */
export const pulseAt = (phase: number) =>
  0.5 + (softPulse(pulse.time, MASTER_PULSE_HZ, phase) - 0.5) * depth

/** The locked phase for a chapter index — deterministic, never random. */
export const sectionPhase = (index: number) => index * SECTION_PHASE_STEP

/**
 * A stable phase for one object within a chapter. Uses the golden angle so a
 * long strip of telemetry cells reads as a travelling wave rather than a row of
 * lamps switching together.
 */
const GOLDEN_ANGLE = 2.399963
export const objectPhase = (index: number) => (index * GOLDEN_ANGLE) % (Math.PI * 2)

/**
 * Idle amplitude for an object, already gated by scroll and by how present its
 * chapter is. The one call site every ornament should use.
 */
export const idleAmount = (presence = 1) => pulse.idle * presence
