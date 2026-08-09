import { afterEach, describe, expect, it, vi } from 'vitest'
import { detectQuality } from '../../src/scene/capability'
import {
  liveFor,
  livePowerFor,
  PHASE_BOUNDARIES,
  phaseFor,
} from '../../src/scene/sceneState'

interface Conditions {
  reducedMotion?: boolean
  coarsePointer?: boolean
  width?: number
  cores?: number
  memory?: number
  webgl2?: boolean
  saveData?: boolean
}

/** Puts the environment into a specific shape so the gate can be asserted. */
const given = ({
  reducedMotion = false,
  coarsePointer = false,
  width = 1600,
  cores = 8,
  memory = 8,
  webgl2 = true,
  saveData = false,
}: Conditions) => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches:
      (query.includes('prefers-reduced-motion') && reducedMotion) ||
      (query.includes('pointer: coarse') && coarsePointer),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))

  Object.defineProperty(window, 'innerWidth', {
    value: width,
    configurable: true,
  })
  Object.defineProperty(navigator, 'hardwareConcurrency', {
    value: cores,
    configurable: true,
  })
  Object.defineProperty(navigator, 'deviceMemory', {
    value: memory,
    configurable: true,
  })
  Object.defineProperty(navigator, 'connection', {
    value: saveData ? { saveData: true } : undefined,
    configurable: true,
  })

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    ((kind: string) =>
      kind === 'webgl2' && webgl2
        ? { getExtension: () => ({ loseContext: () => {} }) }
        : null) as never,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('capability gate', () => {
  it('gives a capable desktop the full experience', () => {
    given({})
    expect(detectQuality()).toBe('cinema')
  })

  it('still mounts a demand-driven scene for reduced motion', () => {
    given({ reducedMotion: true })
    expect(detectQuality()).toBe('lite')
  })

  it('never starts a scene on a metered connection', () => {
    given({ saveData: true })
    expect(detectQuality()).toBe('static')
  })

  it('never starts a scene without WebGL2', () => {
    given({ webgl2: false })
    expect(detectQuality()).toBe('static')
  })

  it('drops to the lighter quality on touch', () => {
    given({ coarsePointer: true })
    expect(detectQuality()).toBe('lite')
  })

  it('drops to the lighter quality on a narrow viewport', () => {
    given({ width: 720 })
    expect(detectQuality()).toBe('lite')
  })

  it('drops to the lighter quality on a weak device', () => {
    given({ cores: 4 })
    expect(detectQuality()).toBe('lite')
    given({ memory: 4 })
    expect(detectQuality()).toBe('lite')
  })

  it('does not punish a browser that hides device memory', () => {
    // Safari does not expose `deviceMemory`; absence must not imply a weak device.
    given({ memory: undefined as unknown as number })
    expect(detectQuality()).toBe('cinema')
  })
})

describe('charge curve', () => {
  it('names each chapter at its own boundary', () => {
    expect(phaseFor(0)).toBe('STANDBY')
    expect(phaseFor(PHASE_BOUNDARIES.standbyEnd)).toBe('CHARGE')
    expect(phaseFor(PHASE_BOUNDARIES.chargeEnd)).toBe('TRANSMIT')
    expect(phaseFor(PHASE_BOUNDARIES.transmitEnd)).toBe('IGNITION')
    expect(phaseFor(1)).toBe('IGNITION')
  })

  it('keeps ignition power at zero until the final chapter', () => {
    expect(livePowerFor(PHASE_BOUNDARIES.transmitEnd)).toBe(0)
    expect(livePowerFor(1)).toBe(1)
    // Monotonic, so the portal can never dim while the visitor scrolls forward.
    let previous = -1
    for (let build = 0; build <= 1.0001; build += 0.05) {
      const power = livePowerFor(build)
      expect(power).toBeGreaterThanOrEqual(previous)
      previous = power
    }
  })

  it('clamps precharge to the 0–1 range', () => {
    expect(liveFor(0)).toBe(0)
    expect(liveFor(1)).toBe(1)
    expect(liveFor(2)).toBe(1)
  })
})
