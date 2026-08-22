import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { WebGPURenderer, MeshBasicNodeMaterial, StorageInstancedBufferAttribute } from 'three/webgpu'
import { Fn, instancedArray, instanceIndex, uniform, vec3, float } from 'three/tsl'
export const probe = { THREE, Canvas, useFrame, WebGPURenderer, MeshBasicNodeMaterial, StorageInstancedBufferAttribute, Fn, instancedArray, instanceIndex, uniform, vec3, float }
