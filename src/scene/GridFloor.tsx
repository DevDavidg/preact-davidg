import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sceneColors } from './sceneColors'
import { buildFor, liveFor, type Tier } from './sceneState'

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

  // The floor is brightest while the room is still a blueprint.
  float wire = 1.0 - smoothstep(0.05, 0.7, uBuild) * 0.62;

  // Scan beam travelling down the room, locked to scroll.
  float beamZ = 9.0 - uBuild * 30.0;
  float beam = exp(-pow((vWorld.z - beamZ) * 0.42, 2.0));

  float structure = minor * 0.26 + major * 0.7;
  // Deliberately restrained: overlay copy sits directly on top of this floor and
  // a brighter grid costs more in legibility than it adds in atmosphere.
  float alpha = structure * fade * (0.1 + wire * 0.22);
  alpha += beam * fade * (0.12 + structure * 0.3);

  vec3 color = mix(uInk, uAccent, clamp(uLive * 0.5 + beam * 0.4, 0.0, 1.0));

  if (alpha < 0.003) discard;
  fragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
`

/** Perspective floor: the blueprint the room is reconstructed on top of. */
export const GridFloor = ({ tier }: { tier: Tier }) => {
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

  useFrame(() => {
    const build = buildFor(tier)
    material.uniforms.uBuild.value = build
    material.uniforms.uLive.value = liveFor(build)
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
