import * as THREE from 'three'
import { sceneState } from '../sceneState'

/**
 * Where the pointer is, in the room.
 *
 * Dragging an object needs a world position for a cursor that is only ever a
 * pair of screen coordinates. R3F hands out `event.point` on the object under
 * the pointer, but the moment a drag starts the pointer leaves that object, so
 * the useful answer is the intersection of the pointer ray with a plane that
 * faces the camera at a chosen distance — the plane the held object lives on.
 *
 * `sceneState.pointerX/Y` is already maintained for the camera rig, so this adds
 * no listener of its own. Its Y runs downward (client coordinates), which is the
 * inverse of normalised device space; the flip below is that, not a sign error.
 */

const _dir = new THREE.Vector3()
const _fwd = new THREE.Vector3()

export const pointerOnPlane = (
  camera: THREE.Camera,
  distance: number,
  out: THREE.Vector3,
): THREE.Vector3 => {
  _dir.set(sceneState.pointerX, -sceneState.pointerY, 0.5).unproject(camera)
  _dir.sub(camera.position).normalize()

  camera.getWorldDirection(_fwd)
  const facing = _dir.dot(_fwd)
  // A ray parallel to the plane has no intersection; park it straight ahead
  // rather than returning a point at infinity.
  const travel = Math.abs(facing) < 1e-4 ? distance : distance / facing

  return out
    .copy(camera.position)
    .addScaledVector(_dir, THREE.MathUtils.clamp(travel, 0.1, 200))
}
