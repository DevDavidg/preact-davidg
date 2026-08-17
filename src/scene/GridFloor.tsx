import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Quality } from './capability'
import { liveLaw, reactorControl } from './control/reactorControl'
import { pulse } from './pulse'
import { sceneColors } from './sceneColors'
import { liveFor, sceneState } from './sceneState'

const vertexShader = /* glsl */ `
varying vec3 vWorld;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const fragmentShader = /* glsl */ `
uniform float uBuild;
uniform float uLive;
uniform float uTime;
uniform float uCinema;
/** Master envelope, supplied by the shared clock — never a local sine. */
uniform float uPulse;
/** Same law/audio reads every ReconstructMaterial gets — keeps the floor in
 * step with the shard architecture instead of reading as a separate system. */
uniform float uHeat;
uniform float uAudio;
uniform vec3 uInk;
uniform vec3 uAccent;

varying vec3 vWorld;

// GLSL3 has no gl_FragColor; three aliases attribute/varying but not the output.
layout(location = 0) out vec4 fragColor;

// Anti-aliased grid: derivatives keep the line one pixel wide at any distance,
// which is what stops the far end of the floor turning into moiré.
float grid(vec2 coord, float scale, float width) {
  vec2 scaled = coord * scale;
  vec2 distanceToLine = abs(fract(scaled - 0.5) - 0.5) / fwidth(scaled);
  return 1.0 - min(min(distanceToLine.x, distanceToLine.y) / width, 1.0);
}

void main() {
  vec2 coord = vWorld.xz;
  float minor = grid(coord, 1.0, 1.1);
  float major = grid(coord, 0.25, 1.4);

  float distance = length(vWorld - cameraPosition);
  float fade = 1.0 - smoothstep(5.0, 30.0, distance);

  // The floor is brightest while the room is still a blueprint. It settles
  // decisively before BEAUTY so the phase shift reads without HUD support.
  float wire = 1.0 - smoothstep(0.12, 0.48, uBuild) * 0.68;

  // Scan beam travelling down the room, locked to scroll.
  float beamZ = 9.0 - uBuild * 30.0;
  float beam = exp(-pow((vWorld.z - beamZ) * 0.42, 2.0));

  // Cinema SCANNING: idle sweep at rest, then crossfade into the scroll beam
  // so the first flick never reads as two scanners fighting.
  float scanning = (1.0 - smoothstep(0.02, 0.18, uBuild)) * uCinema;
  float idleBeamZ = 8.5 - fract(uTime * 0.07) * 14.0;
  float idleBeam = exp(-pow((vWorld.z - idleBeamZ) * 0.48, 2.0));
  float scrollW = 1.0 - scanning * 0.9;
  float idleW = scanning;
  float pulse = uPulse;
  // The Work gallery owns the ASSEMBLING frame. Keep a trace of the navigation
  // beam, but take the floor out of the same contrast band as the project shots.
  float workQuiet =
    smoothstep(0.14, 0.22, uBuild) *
    (1.0 - smoothstep(0.43, 0.52, uBuild));

  float structure = minor * 0.34 + major * 0.85;
  // Stronger blueprint floor — copy sits on elevated consoles, not on the grid.
  float alpha = structure * fade * (0.16 + wire * 0.32);
  alpha += beam * fade * (0.18 + structure * 0.38) * scrollW;
  alpha += idleBeam * fade * (0.12 + structure * 0.28) * idleW;
  alpha *= 1.0 + scanning * pulse * 0.1;
  alpha *= 1.0 - workQuiet * 0.28;
  // The opening has its own product-shot lighting; keep the floor as a faint
  // ground plane until the corridor begins to take over.
  float corridorPresence = smoothstep(0.08, 0.22, uBuild);
  alpha *= mix(0.22, 1.0, corridorPresence);
  // Cinema keeps the extra fill rate; lite spends it on the objects, not the floor.
  alpha *= 1.0 + uCinema * 0.22;

  vec3 color = mix(
    uInk,
    uAccent,
    clamp(
      uLive * 0.5 +
        beam * 0.4 * scrollW * (1.0 - workQuiet * 0.4) +
        idleBeam * 0.22 * idleW +
        uHeat * 0.3 +
        uAudio * 0.15,
      0.0,
      1.0
    )
  );

  if (alpha < 0.003) discard;
  fragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
`

/** Perspective floor: the blueprint the room is reconstructed on top of. */
export const GridFloor = ({ quality }: { quality: Quality }) => {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uBuild: { value: 0 },
          uLive: { value: 0 },
          uTime: { value: 0 },
          uCinema: { value: 0 },
          uPulse: { value: 0 },
          uHeat: { value: 0 },
          uAudio: { value: 0 },
          uInk: { value: sceneColors.ink.clone() },
          uAccent: { value: sceneColors.accent.clone() },
        },
      }),
    [],
  )

  const geometry = useMemo(() => new THREE.PlaneGeometry(120, 120), [])

  useEffect(() => {
    return () => {
      material.dispose()
      geometry.dispose()
    }
  }, [material, geometry])

  useFrame((state) => {
    const build = sceneState.build
    material.uniforms.uBuild.value = build
    material.uniforms.uLive.value = liveFor(build)
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uCinema.value = quality === 'cinema' ? 1 : 0
    // Gated by idle so the standby sweep steps back the moment scroll takes over.
    material.uniforms.uPulse.value = 0.5 + (pulse.master - 0.5) * pulse.idle
    material.uniforms.uHeat.value = liveLaw.heat
    material.uniforms.uAudio.value = reactorControl.audio
    material.uniforms.uInk.value.copy(sceneColors.ink)
    material.uniforms.uAccent.value.copy(sceneColors.accent)
  })

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, -6]}
      frustumCulled={false}
    />
  )
}
