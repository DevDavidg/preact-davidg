/**
 * The first circle.
 *
 * A precision optic that holds itself shut while the visitor reads, then irises
 * open along the corridor the moment they scroll. Four things carry it:
 *
 * 1. One buffer. Every facet lives in a single merged geometry and the peel is a
 *    vertex displacement (`heroPeel`), so the shell is two draw calls instead of
 *    one per facet. The budget that frees up pays for the housing below.
 * 2. A housing. Aperture rings, meridian veins, an additive core and two fresnel
 *    glow shells turn a faceted ball into an instrument with a front, a centre
 *    and a rim of real atmosphere.
 * 3. One clock. Every glowing part reads `pulse` at a locked phase offset, so the
 *    shell, the rings, the core and the cue breathe as one object.
 * 4. Straight opening. The aperture is a pure function of scroll — no damping on
 *    the opening axis — and facets sweep along the corridor axis rather than
 *    scattering, so scrubbing the wheel scrubs the shell.
 */
import { useEffect, useMemo, useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Quality } from "./capability";
import {
  LAWS,
  clearHot,
  fireSector,
  grab,
  liveLaw,
  markHot,
  pushLog,
  reactorControl,
  setLaw,
} from "./control/reactorControl";
import { buildHeroShell, TRIS_PER_SHARD } from "./heroShell";
import { applyLinePeel, applyLitPeel, createPeelUniforms } from "./heroPeel";
import { CAMERA_PATH, REACTOR_CORE } from "./layout";
import { scrollByPixels } from "../motion/ticker";
import { idleAmount, pulse, pulseAt, sectionPhase } from "./pulse";
import { sceneColors } from "./sceneColors";
import { clamp01, sceneState } from "./sceneState";
import { createStudioEquirect } from "./studioEnv";
import { computeViewportFit, heroSizeFit } from "./viewportFit";

const HERO_FADE_START = 0.055;
const HERO_FADE_END = 0.18;
/** The aperture commits on the first scroll pixel — no dead zone before it moves. */
const OPEN_START = 0.008;
const OPEN_END = 0.155;
const BASE_SEPARATION = 0.022;
const SHELL_RADIUS = 0.78;

/**
 * Hover ripple.
 *
 * One facet reacting alone to the pointer read as a glitch, not an instrument.
 * Hovering now peels a whole sector at once: neighbours within this radius
 * (shell-local units) join in, weighted by distance, and the wave itself takes
 * `HOVER_WAVE_DURATION` seconds to cross the sector — so the cluster lifts as
 * one choreographed gesture, spreading outward from the pointer, instead of
 * every facet in range snapping up together.
 */
const HOVER_SECTOR_RADIUS = SHELL_RADIUS * 1.15;
const HOVER_WAVE_DURATION = 0.3;
const HOVER_WAVE_EDGE = 0.16;

/**
 * Opening the shell by hand.
 *
 * The aperture is a pure function of scroll, which is right — but it means the
 * first thing the visitor does is turn a wheel at a closed object. Dragging the
 * shell downward now drives the same scroll value directly, so the first gesture
 * in the room is one the operator performed rather than one the page performed
 * for them. `DRAG_GAIN` is deliberately above 1: a short pull should clear the
 * aperture, not require the whole first chapter's worth of travel.
 */
const DRAG_GAIN = 2.4;
/** Past this many pixels the gesture is a drag, not a click on a facet. */
const DRAG_SLOP = 5;

/**
 * The outer ring is the law selector.
 *
 * Putting it on the object rather than on a panel is the difference between an
 * instrument and a settings menu — and it is reachable exactly when it should
 * be, since the rings are at full presence only while the shell is still shut.
 */
const RING_STEP = 0.62;

/** Locked phases off the master clock — one tempo, four amplitudes. */
const CORE_PHASE = sectionPhase(0);
const RING_PHASE = sectionPhase(1);
const CUE_PHASE = sectionPhase(2);
const RIM_PHASE = Math.PI;

const _dir = new THREE.Vector3();
const _camStart = new THREE.Vector3();
const _tickMatrix = new THREE.Matrix4();
const _tickPosition = new THREE.Vector3();
const _tickQuaternion = new THREE.Quaternion();
const _tickScale = new THREE.Vector3(1, 1, 1);
const _zAxis = new THREE.Vector3(0, 0, 1);
const _structural = new THREE.Color();
const _hoverPoint = new THREE.Vector3();
const _shardPoint = new THREE.Vector3();

/**
 * The axis the shell opens along: from the shell toward where the camera starts.
 * Facets sweep back down it and past the lens, which reads as entering the
 * corridor rather than as an explosion.
 */
const heroViewAxis = () => {
  CAMERA_PATH.getPointAt(0, _camStart);
  return _dir
    .set(
      _camStart.x - REACTOR_CORE[0],
      _camStart.y - REACTOR_CORE[1],
      _camStart.z - REACTOR_CORE[2],
    )
    .normalize()
    .clone();
};

/**
 * Machined graphite — deliberately *not* derived from the palette's ink.
 *
 * At metalness ~0.96 the base colour multiplies every reflection, so it is not a
 * pigment, it is a filter over the whole studio. Tinting it with the site's warm
 * ink meant a warm filter over warm lights over a warm room: three multiplications
 * of champagne, and the shell rendered as a gold ball rather than as metal.
 *
 * A neutral, very slightly cool body is what lets the champagne arrive purely as
 * *light* — key, rim, env streak — which is the whole difference between a
 * machined part standing in a warm room and a part painted gold.
 */
const STEEL = new THREE.Color("#8e939a");

const structuralColor = (target: THREE.Color) =>
  target.copy(sceneColors.base).lerp(STEEL, 0.15);

/**
 * The studio the optic is reflecting, drawn once as an equirect and prefiltered
 * into a PMREM for the shell's real PBR materials.
 *
 * At `metalness` ~0.96 there is no diffuse term left: this image *is* the
 * surface. What makes metal legible is *structure* in the reflection — a
 * horizon it can cut across, and hard-edged sources it can catch — which is
 * why `createStudioEquirect` (shared with the finale gate, so every polished
 * surface in the room reflects the same studio) authors a real room rather
 * than a smooth wash.
 */
const createStudioEnv = (gl: THREE.WebGLRenderer, cinema: boolean) => {
  const texture = createStudioEquirect(cinema ? 768 : 512, cinema ? 384 : 256);
  const pmrem = new THREE.PMREMGenerator(gl);
  const envMap = pmrem.fromEquirectangular(texture).texture;
  texture.dispose();
  pmrem.dispose();
  return envMap;
};

/**
 * Volumetric limb glow.
 *
 * This replaces a camera-facing additive plane. A billboarded sprite always
 * reads as a sticker pasted behind the object: it has a flat edge, it never
 * wraps, and it slides against the shell as the camera moves. This is a
 * back-faced sphere whose alpha is a fresnel of the view vector, so the light
 * genuinely sits *around* the optic — brightest where the surface turns away at
 * the limb, invisible dead centre so the core still reads through it.
 */
const glowVertexShader = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vPosW;

void main() {
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPosW = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const glowFragmentShader = /* glsl */ `
uniform vec3 uInner;
uniform vec3 uOuter;
uniform float uIntensity;
uniform float uPower;

varying vec3 vNormalW;
varying vec3 vPosW;

void main() {
  vec3 view = normalize(cameraPosition - vPosW);
  // Brightest where the back face is square to the lens, falling to zero at the
  // shell's own silhouette. The inverse — peaking at the silhouette — is what
  // produces a hard-edged ring of light, which reads as a pasted-on halo.
  // The bright centre is hidden behind the opaque optic, so what survives is a
  // glow that starts at the shell's rim and fades outward with no visible edge.
  float facing = abs(dot(normalize(vNormalW), view));
  float glow = pow(clamp(facing, 0.0, 1.0), uPower);
  vec3 tint = mix(uOuter, uInner, glow);
  gl_FragColor = vec4(tint, glow * uIntensity);
}
`;

const createGlowMaterial = (power: number) =>
  new THREE.ShaderMaterial({
    vertexShader: glowVertexShader,
    fragmentShader: glowFragmentShader,
    uniforms: {
      uInner: { value: new THREE.Color() },
      uOuter: { value: new THREE.Color() },
      uIntensity: { value: 0 },
      uPower: { value: power },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
    toneMapped: false,
  });

const createCueTexture = (label: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 160;
  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    const fill = context.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height,
    );
    fill.addColorStop(0, "rgba(13, 17, 23, 0.96)");
    fill.addColorStop(1, "rgba(21, 27, 35, 0.96)");
    context.fillStyle = fill;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#ffb454";
    context.lineWidth = 5;
    context.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
    context.font = '700 50px "IBM Plex Mono", ui-monospace, monospace';
    context.fillStyle = "#f3eee4";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, canvas.width / 2, canvas.height / 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

/** Index marks around the bezel. Three majors at 120° — one per law. */
const TICK_COUNT = 24;
const TICK_RADIUS = 1.09;
/** Iris blades behind the shell. Six is the classic mechanical aperture. */
const BLADE_COUNT = 6;
/** Where a blade is hinged, in shell radii. Real irises pivot at the rim. */
const BLADE_PIVOT = 1.0;

/**
 * One iris blade, authored with its hinge at the origin so an instance matrix
 * only has to place and rotate it.
 *
 * A curved wedge, not a triangle: the leading edge sweeps in toward the centre
 * and the trailing edge returns to the hinge, which is what lets six of them
 * overlap into a closed disc and then retract cleanly to the rim.
 */
const createBladeGeometry = () => {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.085);
  shape.quadraticCurveTo(-0.5, -0.34, -1.04, -0.2);
  shape.quadraticCurveTo(-1.12, -0.1, -1.06, -0.02);
  shape.quadraticCurveTo(-0.72, 0.04, -0.3, 0.115);
  shape.lineTo(0, 0.085);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 1,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -0.015);
  return geometry;
};

const createChevronGeometry = () => {
  // Tip points down — scroll enters the corridor below.
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.16);
  shape.lineTo(0.14, 0.02);
  shape.lineTo(0.06, 0.02);
  shape.lineTo(0.06, 0.16);
  shape.lineTo(-0.06, 0.16);
  shape.lineTo(-0.06, 0.02);
  shape.lineTo(-0.14, 0.02);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
  geometry.translate(0, 0, -0.03);
  return geometry;
};

export const HeroStage = ({
  quality,
  cue,
}: {
  quality: Quality;
  cue: string;
}) => {
  const root = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Group>(null);
  const housing = useRef<THREE.Group>(null);
  const outerRing = useRef<THREE.Mesh>(null);
  const innerRing = useRef<THREE.Mesh>(null);
  const ticks = useRef<THREE.InstancedMesh>(null);
  const majorTicks = useRef<THREE.InstancedMesh>(null);
  const iris = useRef<THREE.Group>(null);
  const blades = useRef<THREE.InstancedMesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const glowNear = useRef<THREE.Mesh>(null);
  const glowFar = useRef<THREE.Mesh>(null);
  const cueGroup = useRef<THREE.Group>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const keyLight = useRef<THREE.DirectionalLight>(null);
  const fillLight = useRef<THREE.DirectionalLight>(null);
  const rimLight = useRef<THREE.PointLight>(null);
  const coreGlow = useRef<THREE.PointLight>(null);

  const presence = useRef(1);
  const hovered = useRef(-1);
  const hoverAmts = useRef<Float32Array | null>(null);
  const fireAmts = useRef<Float32Array | null>(null);
  const fireGoals = useRef<Float32Array | null>(null);
  /** Smoothed centre of the current hover sector, in shell-local space. */
  const hoverOrigin = useRef(new THREE.Vector3());
  const hoverActive = useRef(false);
  /** Seconds since the sector was entered — drives the ripple's outward travel. */
  const hoverElapsed = useRef(0);
  /** The live gesture: which control is held, and how far it has travelled. */
  const drag = useRef<{
    kind: "shell" | "ring" | null;
    x: number;
    y: number;
    moved: number;
    yaw: number;
  }>({ kind: null, x: 0, y: 0, moved: 0, yaw: 0 });
  /** Damped ring feedback while the law is being turned. */
  const ringGrip = useRef(0);

  const invalidate = useThree((state) => state.invalidate);
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const aspect = useThree((state) => state.viewport.aspect);
  const heightPx = useThree((state) => state.size.height);
  const fit = computeViewportFit(aspect, heightPx);
  const stageScale = heroSizeFit(fit);

  const cinema = quality === "cinema";
  const detail = cinema ? 2 : 1;

  const viewAxis = useMemo(heroViewAxis, []);
  const envMap = useMemo(() => createStudioEnv(gl, cinema), [gl, cinema]);
  const shellGeo = useMemo(
    () => buildHeroShell(SHELL_RADIUS, detail, viewAxis),
    [detail, viewAxis],
  );

  /** Per-facet hover / fire, uploaded as a 1-pixel-tall lookup. */
  const shardState = useMemo(() => {
    const data = new Float32Array(shellGeo.count * 4);
    const texture = new THREE.DataTexture(
      data,
      shellGeo.count,
      1,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    return { data, texture };
  }, [shellGeo.count]);

  const peel = useMemo(
    () => createPeelUniforms(shardState.texture, shellGeo.count),
    [shardState.texture, shellGeo.count],
  );

  useEffect(() => {
    hoverAmts.current = new Float32Array(shellGeo.count);
    fireAmts.current = new Float32Array(shellGeo.count);
    fireGoals.current = new Float32Array(shellGeo.count);
  }, [shellGeo.count]);

  const geometries = useMemo(() => {
    // 3 radial segments = a triangular cross-section: a machined bevel that
    // catches the rim light, not a soft tube.
    const outer = new THREE.TorusGeometry(1.02, 0.036, 3, cinema ? 96 : 56);
    const inner = new THREE.TorusGeometry(0.9, 0.018, 3, cinema ? 72 : 44);
    const meridian = new THREE.TorusGeometry(
      SHELL_RADIUS * 1.01,
      0.0055,
      3,
      cinema ? 84 : 48,
    );
    return {
      outer,
      inner,
      meridian,
      // The housing rim. A chunky low-segment torus reads as a turned collar
      // holding the optic, and it is what gives the object a silhouette from the
      // side instead of two floating hoops.
      rim: new THREE.TorusGeometry(1.19, 0.075, 4, cinema ? 72 : 40),
      tick: new THREE.BoxGeometry(0.022, 0.075, 0.05),
      tickMajor: new THREE.BoxGeometry(0.032, 0.15, 0.055),
      spoke: new THREE.BoxGeometry(0.03, 0.3, 0.045),
      blade: createBladeGeometry(),
      core: new THREE.IcosahedronGeometry(0.3, cinema ? 2 : 1),
      // Two shells: a tight one that hugs the limb, a wide one that gives the
      // optic a bed of atmosphere to sit in.
      glowNear: new THREE.SphereGeometry(
        1.16,
        cinema ? 48 : 28,
        cinema ? 32 : 20,
      ),
      glowFar: new THREE.SphereGeometry(
        1.95,
        cinema ? 40 : 24,
        cinema ? 28 : 16,
      ),
      cuePlate: new THREE.BoxGeometry(1.75, 0.44, 0.1),
      cueChevron: createChevronGeometry(),
      cueLabel: new THREE.PlaneGeometry(1.58, 0.33),
    };
  }, [cinema]);

  const materials = useMemo(() => {
    const face = new THREE.MeshPhysicalMaterial({
      color: structuralColor(new THREE.Color()),
      metalness: 0.96,
      // Flat-shaded facets share one normal, so a tight specular lobe lights the
      // *entire* facet at once and clips to a white triangle. The reading is
      // handed to the env reflection instead, which now has a horizon and hard
      // sources in it — that varies facet to facet, where a punctual highlight
      // is all-or-nothing.
      roughness: 0.3,
      // A second, sharper layer over the metal: machined parts are lacquered,
      // and the clearcoat is what puts a crisp softbox streak on top of the
      // broader metal reflection instead of one muddy lobe.
      clearcoat: 0.65,
      clearcoatRoughness: 0.12,
      envMap,
      envMapIntensity: 1.55,
      emissive: sceneColors.accent.clone(),
      emissiveIntensity: 1,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    });
    const wire = new THREE.LineBasicMaterial({
      color: sceneColors.ink.clone(),
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      toneMapped: false,
    });
    const ring = new THREE.MeshPhysicalMaterial({
      color: structuralColor(new THREE.Color()),
      metalness: 0.95,
      roughness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMap,
      envMapIntensity: 1.15,
      emissive: sceneColors.accent.clone(),
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0,
    });
    const ringInner = ring.clone();
    // The housing sits behind everything and must never compete with the optic:
    // rougher, barely reflective, closer to raw machined stock than to the
    // polished bezel in front of it.
    const housingMat = new THREE.MeshPhysicalMaterial({
      color: structuralColor(new THREE.Color()),
      metalness: 0.9,
      roughness: 0.52,
      envMap,
      envMapIntensity: 0.6,
      transparent: true,
      opacity: 0,
    });
    // Blades are thin stamped steel, not turned parts — flat shading and a
    // tighter roughness so the six of them separate as they overlap.
    const bladeMat = new THREE.MeshPhysicalMaterial({
      color: structuralColor(new THREE.Color()),
      metalness: 0.94,
      roughness: 0.34,
      envMap,
      envMapIntensity: 0.85,
      flatShading: true,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const meridian = new THREE.MeshBasicMaterial({
      color: sceneColors.signal.clone(),
      transparent: true,
      opacity: 0,
      toneMapped: false,
      depthWrite: false,
    });
    const coreMat = new THREE.MeshBasicMaterial({
      color: sceneColors.signal.clone(),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    // Tight rim, then a wide atmospheric bed. Lower power = the falloff reaches
    // further past the optic, so the near shell stays a crisp lip of light and
    // the far one spreads into haze.
    const glowNearMat = createGlowMaterial(1.7);
    const glowFarMat = createGlowMaterial(2.1);
    const cueBody = new THREE.MeshPhysicalMaterial({
      color: structuralColor(new THREE.Color()),
      metalness: 0.78,
      roughness: 0.22,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      envMap,
      envMapIntensity: 0.7,
      flatShading: true,
      transparent: true,
      opacity: 0,
      emissive: sceneColors.accent.clone(),
      emissiveIntensity: 0.12,
    });
    const cueAccent = new THREE.MeshPhysicalMaterial({
      color: sceneColors.accent.clone(),
      metalness: 0.55,
      roughness: 0.28,
      clearcoat: 0.6,
      envMap,
      envMapIntensity: 0.55,
      emissive: sceneColors.accent.clone(),
      emissiveIntensity: 0.65,
      flatShading: true,
      transparent: true,
      opacity: 0,
    });
    const cueTexture = createCueTexture(cue);
    const cueLabel = new THREE.MeshBasicMaterial({
      map: cueTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    });

    return {
      face,
      wire,
      ring,
      ringInner,
      housing: housingMat,
      blade: bladeMat,
      meridian,
      core: coreMat,
      glowNear: glowNearMat,
      glowFar: glowFarMat,
      cueBody,
      cueAccent,
      cueLabel,
      cueTexture,
    };
  }, [cue, envMap]);

  /*
   * The bezel's index marks never move relative to the bezel, so their matrices
   * are written once. Three of the twenty-four are long — at 0°, 120° and 240°,
   * one per law — which turns the ring's resting angle into a readout as well as
   * a control.
   */
  useEffect(() => {
    const minor = ticks.current;
    const major = majorTicks.current;
    if (!minor || !major) return;

    let minorSlot = 0;
    let majorSlot = 0;
    for (let index = 0; index < TICK_COUNT; index += 1) {
      const angle = (index / TICK_COUNT) * Math.PI * 2;
      const isMajor = index % (TICK_COUNT / 3) === 0;
      _tickPosition.set(
        Math.cos(angle) * TICK_RADIUS,
        Math.sin(angle) * TICK_RADIUS,
        0,
      );
      // Each mark stands radially, so it points at the centre of the optic.
      _tickQuaternion.setFromAxisAngle(_zAxis, angle - Math.PI / 2);
      _tickScale.setScalar(1);
      _tickMatrix.compose(_tickPosition, _tickQuaternion, _tickScale);
      if (isMajor) major.setMatrixAt(majorSlot++, _tickMatrix);
      else minor.setMatrixAt(minorSlot++, _tickMatrix);
    }
    minor.count = minorSlot;
    major.count = majorSlot;
    minor.instanceMatrix.needsUpdate = true;
    major.instanceMatrix.needsUpdate = true;
  }, []);

  // The displacement has to be attached before the first compile, not in a frame.
  useEffect(() => {
    applyLitPeel(materials.face, peel);
    applyLinePeel(materials.wire, peel);
    peel.uCorridor.value.copy(viewAxis).multiplyScalar(1.6);
  }, [materials.face, materials.wire, peel, viewAxis]);

  useEffect(
    () => () => {
      envMap.dispose();
      shellGeo.faces.dispose();
      shellGeo.wires.dispose();
      shardState.texture.dispose();
      Object.values(geometries).forEach((geometry) => geometry.dispose());
      materials.face.dispose();
      materials.wire.dispose();
      materials.ring.dispose();
      materials.ringInner.dispose();
      materials.housing.dispose();
      materials.blade.dispose();
      materials.meridian.dispose();
      materials.core.dispose();
      materials.glowNear.dispose();
      materials.glowFar.dispose();
      materials.cueBody.dispose();
      materials.cueAccent.dispose();
      materials.cueLabel.dispose();
      materials.cueTexture.dispose();
    },
    [envMap, shellGeo, shardState, geometries, materials],
  );

  useEffect(
    () => () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    },
    [],
  );

  /*
   * The gesture loop.
   *
   * Both controls on the optic — the shell and the law ring — are drags, and a
   * drag that only listens on its own mesh dies the moment the pointer leaves
   * it. Tracking on the window instead means the visitor can throw the ring past
   * the edge of the shell and the turn still counts.
   *
   * Mouse only. On touch the browser is already scrolling the page under the
   * finger, and driving the scroller from here as well would double every swipe.
   */
  useEffect(() => {
    if (!cinema) return;

    const handlePointerMove = (event: PointerEvent) => {
      const gesture = drag.current;
      if (!gesture.kind) return;

      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      gesture.x = event.clientX;
      gesture.y = event.clientY;
      gesture.moved += Math.abs(dx) + Math.abs(dy);

      if (gesture.kind === "shell") {
        // Down opens. The facets sweep back along the corridor as the aperture
        // clears, so the hand and the geometry travel the same direction.
        scrollByPixels(dy * DRAG_GAIN);
        return;
      }

      gesture.yaw += dx * 0.0042;
      // Detented, not continuous: a law is a discrete state, and a ring that
      // slid between two of them would leave the room in a value with no name.
      while (Math.abs(gesture.yaw) >= RING_STEP) {
        const direction = gesture.yaw > 0 ? 1 : -1;
        gesture.yaw -= direction * RING_STEP;
        const index =
          (LAWS.indexOf(reactorControl.law) + direction + LAWS.length) %
          LAWS.length;
        setLaw(LAWS[index]);
      }
    };

    const endGesture = () => {
      const gesture = drag.current;
      if (!gesture.kind) return;
      if (gesture.kind === "shell" && gesture.moved > DRAG_SLOP) {
        pushLog("aperture · opened by hand");
      }
      gesture.kind = null;
      gesture.yaw = 0;
      grab(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", endGesture);
    window.addEventListener("pointercancel", endGesture);
    window.addEventListener("blur", endGesture);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", endGesture);
      window.removeEventListener("pointercancel", endGesture);
      window.removeEventListener("blur", endGesture);
      endGesture();
    };
  }, [cinema]);

  useFrame((state, delta) => {
    const build = sceneState.build;
    const time = state.clock.elapsedTime;
    const reveal = THREE.MathUtils.smoothstep(time, 0.08, 1.2);
    const fade =
      1 -
      clamp01((build - HERO_FADE_START) / (HERO_FADE_END - HERO_FADE_START));
    const presenceTarget = reveal * fade;
    presence.current =
      presenceTarget < 0.015
        ? 0
        : THREE.MathUtils.damp(presence.current, presenceTarget, 3.6, delta);

    const live = presence.current;
    const rootNode = root.current;
    if (rootNode) rootNode.visible = live > 0.01;
    if (live <= 0.01) {
      /*
       * The reveal is a function of the clock, not of scroll.
       *
       * On the lighter quality the renderer only draws when something asks it
       * to, and the only thing that asks is scroll. So if the very first frame
       * landed before `reveal` had left zero — which is exactly what happens on
       * a fast connection — presence was clamped to 0, nothing requested another
       * frame, and the optic never appeared at all for the rest of the session.
       * The visitor's first impression was an empty room.
       */
      if (!cinema && reveal < 1 && fade > 0.01) invalidate();
      return;
    }

    // Straight with scroll: the aperture is the scroll value, undamped.
    const open = clamp01((build - OPEN_START) / (OPEN_END - OPEN_START));
    const fling = THREE.MathUtils.smoothstep(build, 0.07, 0.18) ** 0.7;
    // Ornament yields to the scroll read the instant the visitor moves.
    const idle = idleAmount(1 - open);

    const master = pulse.master;
    const corePulse = pulseAt(CORE_PHASE);
    const ringPulse = pulseAt(RING_PHASE);
    const cuePulse = pulseAt(CUE_PHASE);
    const rimPulse = pulseAt(RIM_PHASE);

    // ---- per-facet pointer state -------------------------------------------
    // Hovering peels a sector, not a single facet: the exact facet under the
    // pointer anchors a ripple that spreads to its neighbours, fading with
    // distance and travelling outward over `HOVER_WAVE_DURATION` seconds.
    const hovers = hoverAmts.current;
    const fires = fireAmts.current;
    const goals = fireGoals.current;
    let stateDirty = false;
    let settling = false;
    const hoverTarget = hovered.current;

    if (hoverTarget >= 0 && open < 0.25) {
      _hoverPoint.set(
        shellGeo.centroids[hoverTarget * 3],
        shellGeo.centroids[hoverTarget * 3 + 1],
        shellGeo.centroids[hoverTarget * 3 + 2],
      );
      if (!hoverActive.current) {
        // Fresh sector: snap the origin so the ripple starts exactly under the
        // pointer instead of gliding in from wherever the last one ended.
        hoverOrigin.current.copy(_hoverPoint);
        hoverElapsed.current = 0;
        hoverActive.current = true;
      } else {
        hoverOrigin.current.x = THREE.MathUtils.damp(
          hoverOrigin.current.x,
          _hoverPoint.x,
          6,
          delta,
        );
        hoverOrigin.current.y = THREE.MathUtils.damp(
          hoverOrigin.current.y,
          _hoverPoint.y,
          6,
          delta,
        );
        hoverOrigin.current.z = THREE.MathUtils.damp(
          hoverOrigin.current.z,
          _hoverPoint.z,
          6,
          delta,
        );
        hoverElapsed.current += delta;
      }
    } else {
      hoverActive.current = false;
      hoverElapsed.current = 0;
    }

    // How far the wavefront has travelled from the origin, in shell units.
    const waveFront =
      clamp01(hoverElapsed.current / HOVER_WAVE_DURATION) *
      HOVER_SECTOR_RADIUS;

    if (hovers && fires && goals) {
      for (let index = 0; index < shellGeo.count; index++) {
        let wantHover = 0;
        if (hoverActive.current && goals[index] < 0.5) {
          _shardPoint.set(
            shellGeo.centroids[index * 3],
            shellGeo.centroids[index * 3 + 1],
            shellGeo.centroids[index * 3 + 2],
          );
          const dist = _shardPoint.distanceTo(hoverOrigin.current);
          if (dist < HOVER_SECTOR_RADIUS) {
            // Soft leading edge: 0 before the wave arrives, 1 once it has passed.
            const arrived = THREE.MathUtils.smoothstep(
              waveFront,
              dist - HOVER_WAVE_EDGE,
              dist + HOVER_WAVE_EDGE,
            );
            // Peak height fades toward the sector's rim, so the cluster reads as
            // a bloom centred on the cursor rather than a disc of equal lift.
            const reach = clamp01(1 - dist / HOVER_SECTOR_RADIUS);
            const falloff = reach * reach * (3 - 2 * reach);
            wantHover = arrived * falloff;
          }
        }
        const nextHover = THREE.MathUtils.damp(
          hovers[index],
          wantHover,
          6,
          delta,
        );
        const nextFire = THREE.MathUtils.damp(
          fires[index],
          goals[index],
          3.2,
          delta,
        );
        if (
          Math.abs(nextHover - hovers[index]) > 1e-4 ||
          Math.abs(nextFire - fires[index]) > 1e-4
        ) {
          hovers[index] = nextHover;
          fires[index] = nextFire;
          shardState.data[index * 4] = nextHover;
          shardState.data[index * 4 + 1] = nextFire;
          stateDirty = true;
          settling = true;
        }
      }
    }
    if (stateDirty) shardState.texture.needsUpdate = true;

    // ---- shell -------------------------------------------------------------
    peel.uOpen.value = open;
    peel.uFling.value = fling;
    peel.uTime.value = time;
    peel.uBase.value = BASE_SEPARATION;
    // The law reaches the shell too: under CHAOS the shut optic is visibly
    // straining before the visitor has scrolled a pixel.
    peel.uBreathe.value = 0.014 * idle * (0.45 + liveLaw.agitation * 0.55);
    peel.uGlowColor.value.copy(sceneColors.accent).multiplyScalar(0.5);
    peel.uRimColor.value
      .copy(sceneColors.signal)
      .lerp(sceneColors.accent, rimPulse * 0.6);
    // The rim follows the same rule as the emissive: a cold instrument has a
    // faint edge, a charging one has a hot one.
    peel.uRimGain.value = (0.05 + open * 0.34 + rimPulse * 0.12 * idle) * live;

    structuralColor(_structural);
    materials.face.color.copy(_structural).lerp(STEEL, master * 0.05);
    materials.face.emissive
      .copy(sceneColors.accent)
      .lerp(sceneColors.signal, master * 0.55);
    /*
     * Cold until charged.
     *
     * A flat emissive term is added to every pixel regardless of geometry, so at
     * the old 0.05–0.12 the amber was contributing roughly a third of the red in
     * the final image — uniformly, across the whole shell. That is the definition
     * of paint: colour that does not respond to the light or the surface. It also
     * told the wrong story, since a reactor at zero charge should be a cold object.
     *
     * Now it is effectively off while the optic is shut, and the glow arrives as
     * the aperture does — light escaping from inside, which is what it is.
     */
    materials.face.emissiveIntensity =
      (0.005 + open * 0.085 + master * 0.015 * idle) * live;
    materials.face.envMapIntensity = 1.5 + master * 0.2;
    materials.face.opacity = live;
    materials.face.depthWrite = open < 0.18;

    /*
     * The seams, not a wireframe.
     *
     * A bright amber line on every facet edge was doing most of the talking:
     * 320 lit triangles read as a low-poly gold ball no matter what the metal
     * underneath was doing. Shut, the seams are barely there and the machined
     * surface carries the shot; as the aperture opens they light up, because
     * that is the moment they stop being panel gaps and start being the way out.
     */
    materials.wire.color
      .copy(STEEL)
      .lerp(sceneColors.accent, 0.18 + open * 0.55 + rimPulse * 0.12);
    materials.wire.opacity =
      (0.1 + open * 0.4 + rimPulse * 0.1 * idle) * live * (1 - fling * 0.7);

    if (rootNode) {
      const idleYaw = Math.sin(time * 0.045) * 0.12 * idle;
      const idlePitch = Math.cos(time * 0.0315) * 0.05 * idle;
      rootNode.rotation.y = THREE.MathUtils.damp(
        rootNode.rotation.y,
        sceneState.pointerX * 0.028 * idle + idleYaw,
        2.2,
        delta,
      );
      rootNode.rotation.x = THREE.MathUtils.damp(
        rootNode.rotation.x,
        -sceneState.pointerY * 0.018 * idle + idlePitch,
        2.2,
        delta,
      );
      rootNode.position.y =
        REACTOR_CORE[1] + Math.sin(time * 0.55) * 0.028 * idle;
      rootNode.scale.setScalar(
        stageScale * (1 + Math.sin(time * 0.7) * 0.012 * idle),
      );
    }
    if (shell.current) shell.current.rotation.y = time * 0.035 * idle;

    // ---- housing -----------------------------------------------------------
    // The rings hold the view axis while the shell turns inside them, which is
    // what separates "instrument" from "spinning ball".
    const housingNode = housing.current;
    if (housingNode) {
      housingNode.quaternion.copy(camera.quaternion);
      housingNode.scale.setScalar(1 + open * 0.28);
    }
    // The ring parks at a detent per law, so its angle is a readout as well as a
    // control: three positions, three physics, and the idle drift stops the
    // moment a hand is on it.
    const lawDetent = LAWS.indexOf(reactorControl.law) * ((Math.PI * 2) / 3);
    ringGrip.current = THREE.MathUtils.damp(
      ringGrip.current,
      reactorControl.hotId === "ring" || drag.current.kind === "ring" ? 1 : 0,
      8,
      delta,
    );
    if (outerRing.current) {
      const idleSpin = time * 0.06 * idle * (1 - ringGrip.current);
      outerRing.current.rotation.z = THREE.MathUtils.damp(
        outerRing.current.rotation.z,
        idleSpin - lawDetent - drag.current.yaw * 1.5,
        7,
        delta,
      );
    }
    if (innerRing.current)
      innerRing.current.rotation.z = -time * 0.1 * idle - open * 0.9;

    const ringLive = live * (1 - open * 0.85);
    materials.ring.color.copy(_structural);
    materials.ring.emissive
      .copy(sceneColors.accent)
      .lerp(sceneColors.signal, ringPulse * 0.5);
    materials.ring.emissiveIntensity =
      0.18 +
      ringPulse * 0.5 * idle +
      open * 0.5 +
      ringGrip.current * 0.7 +
      liveLaw.heat * 0.5;
    materials.ring.envMapIntensity = 1 + ringPulse * 0.4;
    materials.ring.opacity = ringLive;
    materials.ringInner.color.copy(_structural);
    materials.ringInner.emissive.copy(sceneColors.signal);
    materials.ringInner.emissiveIntensity =
      0.25 + (1 - ringPulse) * 0.55 * idle;
    materials.ringInner.opacity = ringLive * 0.9;

    // The index marks belong to the bezel, so they simply inherit its angle.
    const bezelAngle = outerRing.current?.rotation.z ?? 0;
    if (ticks.current) ticks.current.rotation.z = bezelAngle;
    if (majorTicks.current) majorTicks.current.rotation.z = bezelAngle;

    materials.housing.color.copy(_structural);
    materials.housing.opacity = live * 0.92 * (1 - open * 0.7);

    /* ---- iris ---------------------------------------------------------------
     *
     * The shell is the aperture the visitor sees; this is the mechanism behind
     * it. Six blades hinged at the rim, overlapping into a closed disc while the
     * optic is shut and swinging clear as it opens — so peeling the facets away
     * reveals a machine rather than an empty interior, and the core arrives from
     * somewhere rather than fading up out of nothing.
     */
    const irisNode = iris.current;
    if (irisNode) {
      irisNode.quaternion.copy(camera.quaternion);
      irisNode.scale.setScalar(1 + open * 0.16);
    }
    const bladeNode = blades.current;
    if (bladeNode) {
      // Retract on the back half of the aperture's travel: the facets have to be
      // out of the way before the blades start moving, or the two mechanisms
      // read as one confusing motion.
      const irisOpen = THREE.MathUtils.smoothstep(open, 0.08, 0.62);
      const swing = 0.12 + irisOpen * 0.95;
      const drift = time * 0.02 * idle;
      for (let index = 0; index < BLADE_COUNT; index += 1) {
        const seat = (index / BLADE_COUNT) * Math.PI * 2 + drift;
        _tickPosition.set(
          Math.cos(seat) * BLADE_PIVOT,
          Math.sin(seat) * BLADE_PIVOT,
          0,
        );
        _tickQuaternion.setFromAxisAngle(_zAxis, seat + swing);
        _tickScale.setScalar(1);
        _tickMatrix.compose(_tickPosition, _tickQuaternion, _tickScale);
        bladeNode.setMatrixAt(index, _tickMatrix);
      }
      bladeNode.instanceMatrix.needsUpdate = true;
    }
    materials.blade.color.copy(_structural).lerp(sceneColors.ink, 0.04);
    materials.blade.opacity = live * (0.55 + open * 0.35);

    materials.meridian.color
      .copy(sceneColors.signal)
      .lerp(sceneColors.accent, master * 0.35);
    materials.meridian.opacity =
      (0.14 + master * 0.16 * idle) * live * (1 - open);

    // ---- core + limb glow --------------------------------------------------
    // The core is the reward for the aperture opening: hidden when shut, brightest
    // as the facets clear, gone with the hero.
    const coreReveal = THREE.MathUtils.smoothstep(open, 0.05, 0.55);
    if (core.current) {
      core.current.scale.setScalar(0.68 + corePulse * 0.07 + coreReveal * 0.5);
      core.current.rotation.y = time * 0.12;
      core.current.rotation.x = time * 0.07;
    }
    materials.core.color
      .copy(sceneColors.signal)
      .lerp(sceneColors.accent, corePulse);
    materials.core.opacity =
      (0.16 + corePulse * 0.14 * idle + coreReveal * 0.68) * live;

    // The limb wraps the shell rather than sitting behind it, so it breathes on
    // the master clock and widens as the aperture lets more light out.
    const nearUniforms = materials.glowNear.uniforms;
    nearUniforms.uInner.value
      .copy(sceneColors.accent)
      .lerp(sceneColors.signal, 0.35);
    nearUniforms.uOuter.value.copy(sceneColors.signal);
    nearUniforms.uIntensity.value =
      (0.32 + master * 0.13 * idle + coreReveal * 0.58) * live;
    if (glowNear.current) {
      glowNear.current.scale.setScalar(1 + master * 0.012 * idle + open * 0.42);
    }

    const farUniforms = materials.glowFar.uniforms;
    farUniforms.uInner.value.copy(sceneColors.accent).multiplyScalar(0.55);
    farUniforms.uOuter.value
      .copy(sceneColors.accent)
      .lerp(sceneColors.signal, 0.6);
    farUniforms.uIntensity.value =
      (0.1 + master * 0.05 * idle + coreReveal * 0.18) * live;
    if (glowFar.current) {
      glowFar.current.scale.setScalar(1 + master * 0.02 * idle + open * 0.62);
    }

    // ---- cue ---------------------------------------------------------------
    const cueVisibility =
      live * (1 - THREE.MathUtils.smoothstep(build, 0.04, 0.14));
    materials.cueBody.color.copy(_structural);
    materials.cueBody.emissive.copy(sceneColors.accent);
    materials.cueBody.emissiveIntensity = 0.1 + cuePulse * 0.22;
    materials.cueBody.opacity = (0.9 + cuePulse * 0.08) * cueVisibility;
    materials.cueBody.envMapIntensity = 0.55 + cuePulse * 0.25;
    materials.cueAccent.color.copy(sceneColors.accent);
    materials.cueAccent.emissive.copy(sceneColors.accent);
    materials.cueAccent.emissiveIntensity = 0.45 + cuePulse * 0.55;
    materials.cueAccent.opacity = (0.88 + cuePulse * 0.1) * cueVisibility;
    materials.cueLabel.opacity = (0.94 + cuePulse * 0.06) * cueVisibility;
    if (cueGroup.current) {
      cueGroup.current.visible = cueVisibility > 0.035;
      cueGroup.current.position.set(
        0,
        -0.98 + Math.sin(time * 1.35) * 0.035 * idle,
        0.78,
      );
      cueGroup.current.scale.setScalar(0.9 + cuePulse * 0.035);
      // Face the lens without orbiting off-centre (lookAt skewed the badge).
      cueGroup.current.quaternion.copy(camera.quaternion);
    }

    // ---- lighting ----------------------------------------------------------
    if (hemi.current) {
      // Ambient stays neutral. Every warm photon in this shot should come from a
      // source you could point at — the key, the rim, the core — not from the
      // air, or the object is simply tinted rather than lit.
      hemi.current.color.copy(STEEL);
      hemi.current.groundColor.copy(sceneColors.base);
      hemi.current.intensity = (0.34 + master * 0.1) * live;
    }
    if (keyLight.current) {
      // Mostly neutral with a warm cast. The champagne belongs to the softbox in
      // the env map, which reflects as a shaped streak; a warm punctual light
      // just tints whatever facet it happens to hit.
      keyLight.current.color.copy(STEEL).lerp(sceneColors.accent, 0.3);
      // Deliberately small now that the studio env carries the read. On flat
      // facets a punctual lobe is all-or-nothing — every pixel shares a normal,
      // so the facet is either unlit or solid white with no gradient across it.
      // This is here to separate neighbours by a shade, not to light the object.
      keyLight.current.intensity = (0.42 + master * 0.12) * live;
      keyLight.current.position.set(
        3.1 + Math.sin(time * 0.25) * 0.35 * idle,
        1.35,
        2.2 + Math.cos(time * 0.22) * 0.3 * idle,
      );
    }
    if (fillLight.current) {
      // Cool fill against the warm key. Two warm sources give a flat wash; the
      // temperature split is what makes a curved metal surface turn.
      fillLight.current.color.copy(STEEL);
      fillLight.current.intensity = (0.22 + pulse.counter * 0.16) * live;
    }
    if (rimLight.current) {
      const angle = time * 0.55 * (0.25 + idle * 0.75);
      // Orbits well clear of the shell. At the old 1.6 the light passed within
      // ~0.8 of the facets, and inverse-square put those facets far past white.
      rimLight.current.position.set(
        Math.cos(angle) * 2.7,
        0.35 + Math.sin(time * 0.7) * 0.2 * idle,
        Math.sin(angle) * 2.7,
      );
      rimLight.current.color
        .copy(sceneColors.accent)
        .lerp(sceneColors.signal, rimPulse);
      rimLight.current.intensity = (0.44 + rimPulse * 0.3) * live;
    }
    if (coreGlow.current) {
      coreGlow.current.color
        .copy(sceneColors.signal)
        .lerp(sceneColors.accent, corePulse);
      coreGlow.current.intensity =
        (0.55 + corePulse * 0.65) * live * (0.35 + coreReveal * 0.9);
    }

    if (!cinema && (settling || live > 0.015)) invalidate();
  });

  const beginDrag = (
    kind: "shell" | "ring",
    event: ThreeEvent<PointerEvent>,
  ) => {
    if (!cinema || event.pointerType !== "mouse" || event.button !== 0) return;
    drag.current = {
      kind,
      x: event.clientX,
      y: event.clientY,
      moved: 0,
      yaw: 0,
    };
    grab(kind === "ring" ? "law-ring" : "shell");
    document.body.style.cursor = kind === "ring" ? "ew-resize" : "grabbing";
    // A drag across a page is a text selection unless something says otherwise.
    document.body.style.userSelect = "none";
  };

  const shardAt = (event: ThreeEvent<PointerEvent>) =>
    event.faceIndex === undefined || event.faceIndex === null
      ? -1
      : Math.floor(event.faceIndex / TRIS_PER_SHARD);

  const handleMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (drag.current.kind) return;
    const index = shardAt(event);
    if (index === hovered.current) return;
    hovered.current = index;
    if (index >= 0) markHot("shell");
    else clearHot("shell");
    document.body.style.cursor = index >= 0 ? "grab" : "";
    invalidate();
  };

  const handleOut = () => {
    clearHot("shell");
    if (hovered.current === -1) return;
    hovered.current = -1;
    if (!drag.current.kind) document.body.style.cursor = "";
    invalidate();
  };

  const handleShellDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    beginDrag("shell", event);
  };

  const handleRingDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    beginDrag("ring", event);
  };

  const handleRingOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    markHot("ring", { ui: true });
    document.body.style.cursor = "ew-resize";
    invalidate();
  };

  const handleRingOut = () => {
    clearHot("ring");
    if (!drag.current.kind) document.body.style.cursor = "";
    invalidate();
  };

  /**
   * Firing a sector.
   *
   * The old click threw a facet off the shell and nothing else happened, which
   * made it read as a rendering glitch rather than as an action. A fired sector
   * now leaves a mark: a rung tone, a numbered line in the operator log, and a
   * count that eventually hands the visitor the console. The facet still goes —
   * it is a vent, and a vent that never vents is a button.
   */
  const handleClick = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (drag.current.moved > DRAG_SLOP) return;
    const index = shardAt(event);
    const goals = fireGoals.current;
    if (index < 0 || !goals || goals[index] > 0.5) return;
    goals[index] = 1;
    hovered.current = -1;
    document.body.style.cursor = "";

    const fired = fireSector();
    if (fired === 4) pushLog("console · reactor.help()", 0);
    invalidate();
  };

  return (
    <group ref={root} position={REACTOR_CORE}>
      <hemisphereLight ref={hemi} args={["#f3eee4", "#050608", 0.45]} />
      <directionalLight
        ref={keyLight}
        position={[2.2, 3.2, 2.6]}
        intensity={1.2}
      />
      <directionalLight
        ref={fillLight}
        position={[-2.6, 0.8, 1.4]}
        intensity={0.3}
      />
      <pointLight ref={rimLight} distance={5.2} decay={2} intensity={1.5} />
      <pointLight
        ref={coreGlow}
        position={[0, 0.05, 0]}
        distance={3.2}
        decay={2}
      />

      <mesh
        ref={glowFar}
        geometry={geometries.glowFar}
        material={materials.glowFar}
        frustumCulled={false}
        renderOrder={-2}
      />
      <mesh
        ref={glowNear}
        geometry={geometries.glowNear}
        material={materials.glowNear}
        frustumCulled={false}
        renderOrder={-1}
      />

      <group ref={shell}>
        <mesh
          geometry={shellGeo.faces}
          material={materials.face}
          frustumCulled={false}
          onPointerMove={handleMove}
          onPointerOut={handleOut}
          onPointerDown={handleShellDown}
          onClick={handleClick}
        />
        <lineSegments
          geometry={shellGeo.wires}
          material={materials.wire}
          frustumCulled={false}
          renderOrder={2}
        />
        {cinema ? (
          <>
            <mesh
              geometry={geometries.meridian}
              material={materials.meridian}
            />
            <mesh
              geometry={geometries.meridian}
              material={materials.meridian}
              rotation={[Math.PI / 2, 0, 0]}
            />
            <mesh
              geometry={geometries.meridian}
              material={materials.meridian}
              rotation={[0, Math.PI / 2, 0]}
            />
          </>
        ) : null}
      </group>

      <mesh
        ref={core}
        geometry={geometries.core}
        material={materials.core}
        frustumCulled={false}
        renderOrder={1}
      />

      {/* The mechanism behind the optic: blades hinged at the rim that clear as
          the facets peel, so opening the shell reveals a machine. */}
      <group ref={iris} position={[0, 0, -0.16]}>
        <instancedMesh
          ref={blades}
          args={[geometries.blade, materials.blade, BLADE_COUNT]}
          frustumCulled={false}
        />
      </group>

      <group ref={housing}>
        {/* The turned collar the whole instrument is held in. */}
        <mesh
          geometry={geometries.rim}
          material={materials.housing}
          position={[0, 0, -0.05]}
        />

        {/* The outer ring is the law selector — turn it to change the physics. */}
        <mesh
          ref={outerRing}
          geometry={geometries.outer}
          material={materials.ring}
          onPointerOver={handleRingOver}
          onPointerOut={handleRingOut}
          onPointerDown={handleRingDown}
        />
        {/* Index marks: twenty-one minor, three major at the law detents. */}
        <instancedMesh
          ref={ticks}
          args={[geometries.tick, materials.ring, TICK_COUNT]}
          frustumCulled={false}
        />
        <instancedMesh
          ref={majorTicks}
          args={[geometries.tickMajor, materials.ringInner, 3]}
          frustumCulled={false}
        />

        <mesh
          ref={innerRing}
          geometry={geometries.inner}
          material={materials.ringInner}
        />
        {/* Three struts tying the inner collar to the body. */}
        {[0, 1, 2].map((index) => (
          <mesh
            key={index}
            geometry={geometries.spoke}
            material={materials.ringInner}
            position={[
              Math.cos((index / 3) * Math.PI * 2 + Math.PI / 2) * 1.05,
              Math.sin((index / 3) * Math.PI * 2 + Math.PI / 2) * 1.05,
              -0.02,
            ]}
            rotation={[0, 0, (index / 3) * Math.PI * 2]}
          />
        ))}
      </group>

      <group ref={cueGroup} position={[0, -0.92, 0.72]}>
        <mesh geometry={geometries.cuePlate} material={materials.cueBody} />
        <mesh
          geometry={geometries.cueChevron}
          material={materials.cueAccent}
          position={[0, -0.3, 0.03]}
          scale={0.88}
        />
        <mesh
          geometry={geometries.cueLabel}
          material={materials.cueLabel}
          position={[0, 0.02, 0.06]}
        />
      </group>
    </group>
  );
};
