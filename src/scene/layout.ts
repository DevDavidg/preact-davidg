import * as THREE from 'three'

/**
 * The camera dollies along this spline as the page scrolls, so scrolling reads
 * as travelling through one room rather than cutting between sections.
 */
export const CAMERA_PATH = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, 1.75, 10.2),
    new THREE.Vector3(2.6, 1.35, 5.6),
    new THREE.Vector3(-1.5, 1.95, 1.8),
    new THREE.Vector3(1.9, 2.45, -2.4),
    new THREE.Vector3(-1.0, 1.4, -6.2),
    new THREE.Vector3(0, 1.6, -10.6),
  ],
  false,
  'catmullrom',
  0.35,
)

/** Where the camera looks, one beat ahead of where it is. */
export const TARGET_PATH = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, 1.25, 4.2),
    new THREE.Vector3(0.7, 1.05, 1.4),
    new THREE.Vector3(0, 1.3, -1.6),
    new THREE.Vector3(0, 1.35, -5.0),
    new THREE.Vector3(0, 1.2, -9.0),
    new THREE.Vector3(0, 1.45, -14.0),
  ],
  false,
  'catmullrom',
  0.35,
)

export interface ArtifactPlacement {
  position: [number, number, number]
  /** Yaw in radians, angling the panel back toward the corridor centre. */
  yaw: number
  /** Pitch in radians, tipping the panel down toward the dolly. */
  pitch: number
  scale: number
}

/**
 * Artifacts line the corridor the dolly runs down, angled back into it, so each
 * one assembles ahead of the camera and sweeps past as its overlay card comes into
 * view. Index matches the DOM artifact index.
 *
 * Which side a panel takes is dictated by the dolly, not by alternating: the
 * camera swings to x ±2.6, so every panel stands on the opposite side from
 * wherever the spline happens to be at that depth. The irregular rhythm also
 * reads more like a real room than a metronome would.
 */
export const ARTIFACTS: ArtifactPlacement[] = [
  { position: [-2.8, 2.3, 5.6], yaw: 0.55, pitch: -0.05, scale: 1 },
  { position: [-2.85, 2.45, 3.0], yaw: 0.5, pitch: -0.07, scale: 0.96 },
  { position: [2.8, 2.25, 0.4], yaw: -0.55, pitch: -0.04, scale: 1.04 },
  { position: [-2.8, 2.5, -2.2], yaw: 0.52, pitch: -0.08, scale: 1 },
  { position: [2.85, 2.3, -4.8], yaw: -0.5, pitch: -0.05, scale: 1.06 },
  { position: [2.8, 2.4, -7.4], yaw: -0.53, pitch: -0.07, scale: 0.98 },
]

/** Aspect of the artifact panels, matching the 16:10 project shots. */
export const ARTIFACT_PANEL = { width: 2.5, height: 1.56 } as const

/**
 * The glow the room powers on toward. Far enough past the end of the camera path
 * that it reads as a destination rather than a plane in front of the lens.
 */
export const PORTAL_POSITION: [number, number, number] = [0, 1.8, -24]

/** Fog density — tint comes from `sceneColors.base` in Atmosphere. */
export const FOG_DENSITY = 0.052

/**
 * Build value at which the dolly reaches a given depth. Objects planted in the
 * room use this to time their own assembly against the camera instead of against
 * a section's scroll range, so nothing lands after the camera has driven past it.
 */
export const buildAtDepth = (() => {
  const SAMPLES = 96
  const point = new THREE.Vector3()
  const depths: number[] = []

  for (let index = 0; index <= SAMPLES; index++) {
    CAMERA_PATH.getPointAt(index / SAMPLES, point)
    depths.push(point.z)
  }

  return (z: number): number => {
    for (let index = 1; index <= SAMPLES; index++) {
      if (depths[index] > z) continue
      const previous = depths[index - 1]
      const t = (previous - z) / Math.max(previous - depths[index], 1e-5)
      return (index - 1 + t) / SAMPLES
    }
    return 1
  }
})()
