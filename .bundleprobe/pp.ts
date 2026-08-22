import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette } from '@react-three/postprocessing'
export const probe = { THREE, Canvas, useFrame, EffectComposer, Bloom, DepthOfField, Noise, Vignette }
