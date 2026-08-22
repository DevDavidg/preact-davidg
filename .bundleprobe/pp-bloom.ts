import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
export const probe = { THREE, Canvas, useFrame, EffectComposer, Bloom }
