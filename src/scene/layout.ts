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
  /** Radians per second while the object is still assembling. */
  spin: number
  scale: number
}

/**
 * Artifacts sit just off the camera path so the dolly passes each one as its
 * overlay panel comes into view. Index matches the DOM artifact index.
 */
export const ARTIFACTS: ArtifactPlacement[] = [
  { position: [-1.95, 1.5, 4.2], spin: 0.16, scale: 1 },
  { position: [2.35, 1.75, 0.5], spin: -0.12, scale: 0.95 },
  { position: [-2.15, 1.55, -3.5], spin: 0.2, scale: 1.05 },
]

/**
 * The glow the room powers on toward. Far enough past the end of the camera path
 * that it reads as a destination rather than a plane in front of the lens.
 */
export const PORTAL_POSITION: [number, number, number] = [0, 1.8, -24]

/** Fog density — tint comes from `sceneColors.base` in Atmosphere. */
export const FOG_DENSITY = 0.052
