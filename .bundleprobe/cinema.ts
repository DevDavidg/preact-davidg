import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette, SSAO } from '@react-three/postprocessing'
import { MeshTransmissionMaterial, Environment } from '@react-three/drei'
import { getProject, types } from '@theatre/core'
export const probe = { THREE, Canvas, useFrame, EffectComposer, Bloom, DepthOfField, Noise, Vignette, SSAO, MeshTransmissionMaterial, Environment, getProject, types }
