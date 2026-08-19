import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { CaseStudy, Copy } from "../content";
import { SECTION_IDS } from "../lib/routes";
import { AboutPortrait } from "./AboutPortrait";
import { Atmosphere } from "./Atmosphere";
import type { Quality } from "./capability";
import {
  advanceControl,
  reactorControl,
  resetControl,
} from "./control/reactorControl";
import { CursorProbe } from "./CursorProbe";
import { GridFloor } from "./GridFloor";
import { Lattice } from "./Lattice";
import { PORTAL_POSITION } from "./layout";
import { ReactorCore } from "./ReactorCore";
import { Rig } from "./Rig";
import { FinaleGate } from "./FinaleGate";
import { HeroStage } from "./HeroStage";
import { SignalConduits } from "./SignalConduits";
import { Structures } from "./Structures";
import { advancePulse, setPulseDepth } from "./pulse";
import { refreshSceneColors, sceneColors } from "./sceneColors";
import {
  livePowerFor,
  sceneState,
  swallowShape,
  useSceneStore,
} from "./sceneState";
import "./silenceClockWarning";
import { WorldConsoles } from "./consoles/WorldConsoles";
import type { SceneMode } from "./ui/ReactorType";
import { useSectionWindows } from "./ui/useSectionWindows";

/**
 * Device pixel ratio per fidelity step.
 *
 * WebGL's own antialiasing only smooths edges relative to the framebuffer's
 * own resolution — capping `full` at 1.5 meant a 3x-retina phone rendered at
 * exactly half its native pixel density, then had the browser compositor
 * upscale that soft, under-resolved buffer back out to the full screen. MSAA
 * cannot fix an edge that was already blurred by that upscale; every hairline
 * and facet edge in the scene read as fuzzy rather than anti-aliased. `full`
 * now reaches far enough to actually resolve a retina phone's edges. If a
 * given device cannot sustain that, `usePerformanceGovernor` demotes it to
 * `reduced` or `minimal` from measured frame time — the cap here only sets
 * the ceiling for devices that can afford it, not a floor for those that can't.
 */
const DPR: Record<"full" | "reduced" | "minimal", [number, number]> = {
  full: [1, 2],
  reduced: [1, 1.5],
  minimal: [1, 1],
};


/**
 * Reports that the room is genuinely on screen, so the boot hold can lift on real
 * readiness rather than on a timer.
 *
 * Deliberately not the *first* frame. Frame one is shader compilation and texture
 * upload finishing; the glyph atlas has usually not resolved yet, so the room it
 * shows is a partly-built version of itself. Since `BootGate` reveals the page on
 * this signal, reporting too early trades a flash of the document for a flash of
 * an unfinished scene. A short run of consecutive frames means the pipeline is
 * warm and what gets revealed is the room as authored.
 */
const READY_FRAMES = 4;

const ReadySignal = () => {
  const setSceneReady = useSceneStore((state) => state.setSceneReady);
  const frames = useRef(0);
  const reported = useRef(false);

  useFrame(() => {
    if (reported.current) return;
    frames.current += 1;
    if (frames.current < READY_FRAMES) return;
    reported.current = true;
    setSceneReady(true);
  });

  useEffect(
    () => () => {
      setSceneReady(false);
    },
    [setSceneReady],
  );

  return null;
};

/**
 * Advances the master clock.
 *
 * A negative `useFrame` priority is the point: R3F sorts subscribers ascending,
 * so this lands ahead of every object that reads `pulse`, and only a *positive*
 * priority switches off automatic rendering — so the room still draws itself.
 *
 * Reduced motion flattens the envelope here rather than at each call site. The
 * capability gate still hands those visitors a scene (`lite`), but it holds a
 * steady half-light instead of breathing.
 */
const PulseDriver = () => {
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setPulseDepth(query.matches ? 0 : 1);
    apply();
    query.addEventListener("change", apply);
    return () => {
      query.removeEventListener("change", apply);
      setPulseDepth(1);
    };
  }, []);

  // A route change must not leave the machine mid-operation: a held object, a
  // half-charged handshake or a lit mode belong to the room that was torn down.
  useEffect(() => resetControl, []);

  useFrame((state, delta) => {
    advancePulse(state.clock.elapsedTime, delta);
    // Same tick, same negative priority as the pulse clock: every reader in the
    // frame sees the law, the modes and the impulses computed for *this* frame,
    // rather than a mix of this frame's scroll and last frame's physics.
    advanceControl(delta);
  }, -1);

  return null;
};

/**
 * A lost GPU context has to be survivable. Without this the canvas keeps a dead
 * renderer and the page shows a black rectangle over half the content; here the
 * scene reports upward and the document takes over as if 3D had never been asked
 * for. `preventDefault` on the loss event is what allows the browser to restore.
 */
const ContextGuard = ({ onFailure }: { onFailure: () => void }) => {
  const gl = useThree((state) => state.gl);
  const setSceneReady = useSceneStore((state) => state.setSceneReady);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleLost = (event: Event) => {
      event.preventDefault();
      setSceneReady(false);
    };
    // Restoration is not guaranteed; if it does not come back, fail over.
    const handleRestored = () => refreshSceneColors();

    canvas.addEventListener("webglcontextlost", handleLost);
    canvas.addEventListener("webglcontextrestored", handleRestored);
    canvas.addEventListener("webglcontextcreationerror", onFailure);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleLost);
      canvas.removeEventListener("webglcontextrestored", handleRestored);
      canvas.removeEventListener("webglcontextcreationerror", onFailure);
    };
  }, [gl, onFailure, setSceneReady]);

  return null;
};

/** Keeps the clear colour in sync with the document background. */
const ClearColour = () => {
  const scene = useThree((state) => state.scene);
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    refreshSceneColors();
    if (scene.background instanceof THREE.Color) {
      scene.background.copy(sceneColors.base);
    } else {
      scene.background = sceneColors.base.clone();
    }
    gl.setClearColor(sceneColors.base, 1);
  }, [scene, gl]);

  return null;
};

/**
 * On the lighter quality the renderer is on demand rather than on a loop: a frame
 * is requested while the visitor is scrolling and for a beat after they stop, then
 * nothing. That is the difference between a phone idling at 0% GPU and one heating
 * up on a static image.
 */
/**
 * Seconds of frames to run before anything has happened.
 *
 * A demand loop that has produced exactly one frame has not warmed a single
 * shader, has not seen the glyph atlas resolve, and — because `BootGate` lifts
 * the boot hold on `ReadySignal`, which needs a short run of consecutive frames
 * — would leave the page held until its failsafe timeout. Every phone gets
 * `lite`, so that was the mobile first-load: a blank hold, then a hard cut to a
 * cold scene. The warm-up is the fix, and it is self-sustaining: one requested
 * frame runs the loop below, which requests the next.
 */
const WARM_UP_SECONDS = 1.6;
/** Frames to keep running after the last change so damped motion can land. */
const SETTLE_SECONDS = 0.6;

const DemandDriver = () => {
  const invalidate = useThree((state) => state.invalidate);
  const last = useRef(-1);
  const settle = useRef(WARM_UP_SECONDS);

  useFrame((_state, delta) => {
    if (sceneState.build !== last.current) {
      last.current = sceneState.build;
      settle.current = Math.max(settle.current, SETTLE_SECONDS);
    }
    if (settle.current > 0) {
      // Real delta, not a hardcoded 1/60: on a device rendering at 30fps the
      // fixed step made the settle window twice as long as it was written to be.
      settle.current -= delta;
      invalidate();
    }
  });

  useEffect(() => {
    /*
     * Lenis scrolls the document for real rather than transforming a wrapper, so
     * native scroll events do fire and this is a live signal during a flick. The
     * settle above is what covers the tail, where Lenis is still travelling but
     * the browser has stopped emitting.
     */
    const request = () => {
      settle.current = Math.max(settle.current, SETTLE_SECONDS);
      invalidate();
    };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    window.addEventListener("orientationchange", request);
    // Touch has no hover, but a finger down is still intent — and on a phone this
    // is the only signal that arrives before the scroll does.
    window.addEventListener("pointerdown", request, { passive: true });
    request();
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      window.removeEventListener("orientationchange", request);
      window.removeEventListener("pointerdown", request);
    };
  }, [invalidate]);

  return null;
};

/**
 * The ignition flare.
 *
 * This replaces a full post-processing chain. `@react-three/postprocessing` plus
 * `postprocessing` cost roughly 200 kB gzipped to deliver two effects — a bloom
 * gated on the final chapter, and grain — and a ping-pong composer on every frame
 * to do it. The bloom only ever applied to one object, so it is drawn as an
 * additive billboard on that object instead, and the grain moved to a static CSS
 * overlay. Same read, a fraction of the cost, and no render target.
 */
const IgnitionFlare = () => {
  const mesh = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (context) {
      const half = size / 2;
      const gradient = context.createRadialGradient(
        half,
        half,
        0,
        half,
        half,
        half,
      );
      // A wide, soft falloff: a hard-edged additive disc reads as a shape rather
      // than as light spilling past the object.
      gradient.addColorStop(0, "rgba(255,255,255,0.9)");
      gradient.addColorStop(0.25, "rgba(255,255,255,0.28)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, size, size);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  const material = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: texture,
        color: sceneColors.accent.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    [texture],
  );

  useEffect(
    () => () => {
      texture.dispose();
      material.dispose();
    },
    [texture, material],
  );

  useFrame(() => {
    const power = livePowerFor(sceneState.build);
    // The handshake is the other half of the finale: scroll charges the glow,
    // closing the circuit is what makes it flare.
    const handshake = reactorControl.uplink;
    material.color.copy(sceneColors.accent);
    // Soft end glow — structure/gate carry the finale, not a screen-filling blob.
    material.opacity = power * power * 0.28 + handshake * handshake * 0.22;
    const sprite = mesh.current;
    if (sprite) sprite.scale.setScalar(8 + power * 5 + handshake * 4);
  });

  return (
    <sprite
      ref={mesh as never}
      material={material}
      position={PORTAL_POSITION}
      renderOrder={3}
    />
  );
};

/**
 * The swallow.
 *
 * Everything the corridor is built out of hangs under here, and the ending is one
 * transform: the whole room is scaled toward the portal's position, twisted about
 * the corridor axis and stretched along it, so it is drawn into the aperture as a
 * single object rather than each component being taught to leave separately.
 *
 * Two nested groups because the scale has to happen *about the portal*, not about
 * the world origin. The outer group is parked at `PORTAL_POSITION` and owns the
 * scale and the twist; the inner one undoes that offset so its children keep the
 * world coordinates they were authored in. Collapsing the outer scale therefore
 * converges every vertex on the aperture.
 *
 * It reads `sceneState.swallow` and does nothing else — no springs, no
 * accumulators, no latch. Stop scrolling and it holds; scroll up and the room
 * comes back out of the portal along exactly the path it went in. That is what
 * makes the ending scrubbable rather than a cutscene that fires on arrival.
 */
const SwallowField = ({ children }: { children: ReactNode }) => {
  const pivot = useRef<THREE.Group>(null);

  useFrame(() => {
    const node = pivot.current;
    if (!node) return;

    const { amount, pull, grip } = swallowShape(sceneState.swallow);

    if (amount <= 0.0005) {
      // The overwhelming common case: the corridor, untouched.
      if (node.scale.x !== 1) {
        node.scale.setScalar(1);
        node.rotation.z = 0;
        node.visible = true;
      }
      return;
    }

    const collapse = 1 - pull * 0.94;
    // Held longer along the corridor axis than across it, so the room elongates
    // toward the aperture on its way in instead of merely getting smaller.
    node.scale.set(collapse, collapse, collapse * (1 + grip * 1.8));
    node.rotation.z = grip * Math.PI * 1.15;
    // Past this there is nothing left to draw but the portal's own light.
    node.visible = amount < 0.995;
  });

  return (
    <group ref={pivot} position={PORTAL_POSITION}>
      <group
        position={[-PORTAL_POSITION[0], -PORTAL_POSITION[1], -PORTAL_POSITION[2]]}
      >
        {children}
      </group>
    </group>
  );
};

interface ReactorSceneProps {
  quality: Quality;
  copy: Copy;
  featured: CaseStudy[];
  onFailure: () => void;
  mode?: SceneMode;
  study?: CaseStudy;
  sectionIds?: readonly string[];
}

/**
 * The persistent reactor room — the primary interface of the site.
 * Chapter windows come from the scroll rail above; world type carries the copy.
 */
export const ReactorScene = ({
  quality,
  copy,
  featured,
  onFailure,
  mode = "home",
  study,
  sectionIds = SECTION_IDS,
}: ReactorSceneProps) => {
  const fidelity = useSceneStore((state) => state.fidelity);
  const windows = useSectionWindows(sectionIds);

  const cinema = quality === "cinema";

  return (
    <div className="stage" aria-hidden="true">
      <Canvas
        dpr={DPR[fidelity]}
        frameloop={cinema ? "always" : "demand"}
        camera={{ fov: 42, near: 0.1, far: 64, position: [-5.4, 2.05, 8.4] }}
        gl={{
          alpha: false,
          antialias: fidelity === "full",
          powerPreference: cinema ? "high-performance" : "default",
          stencil: false,
        }}
        fallback={null}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <PulseDriver />
        <ClearColour />
        <ContextGuard onFailure={onFailure} />
        <ReadySignal />
        {cinema ? null : <DemandDriver />}

        <Atmosphere quality={quality} />
        <Rig quality={quality} />

        {/* The room. Everything in here is what the portal takes in. */}
        <SwallowField>
          <GridFloor quality={quality} />
          <Lattice quality={quality} />
          <Structures quality={quality} />
          <HeroStage quality={quality} cue={copy.hero.cue} />
          <ReactorCore quality={quality} />
          <WorldConsoles
            copy={copy}
            featured={featured}
            quality={quality}
            windows={windows}
            mode={mode}
            study={study}
          />
          {/* Causality: the light reaches a bay before the project does. Only the
              home corridor has modules to wire. */}
          {mode === "home" ? <SignalConduits quality={quality} /> : null}
          {mode === "home" ? (
            <AboutPortrait quality={quality} windows={windows} />
          ) : null}
        </SwallowField>

        {/* Outside the field: the thing doing the swallowing does not swallow
            itself, and the atmosphere is the room's air rather than its matter. */}
        <FinaleGate />

        {/* The probe is the room's answer to "can I touch this", so it only
            exists where there is a hand to answer. */}
        {cinema ? <CursorProbe /> : null}

        {fidelity === "minimal" ? null : <IgnitionFlare />}
      </Canvas>
    </div>
  );
};
