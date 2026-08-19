import * as THREE from "three";

/**
 * The bridge between the CSS palette and the shaders.
 *
 * Token names match the `@theme` block in `app/theme.css`. The scene reads the live
 * computed values rather than duplicating hex codes, so DOM and shaders cannot drift
 * apart — there is one palette, and CSS owns it.
 *
 * An earlier version resolved values by appending a probe `<span>` to
 * `document.documentElement` and reading its computed colour. That element became a
 * foreign child of the `<html>` node React hydrates, which broke hydration on every
 * prerendered page and made React discard the server-rendered tree. Nothing here
 * touches the document any more.
 */

const TOKENS = {
  base: "--color-reactor",
  /** Deepest ground. The far end of the corridor sits on this, not on `base`. */
  abyss: "--color-abyss",
  ink: "--color-ink",
  accent: "--color-ignition",
  signal: "--color-ion",
  /** Machined metal, for anything the room is built out of rather than lit by. */
  steel: "--color-steel",
} as const;

type TokenName = keyof typeof TOKENS;

const FALLBACK: Record<TokenName, string> = {
  base: "#050608",
  abyss: "#030406",
  ink: "#f3eee4",
  accent: "#ffb454",
  signal: "#e6c891",
  steel: "#8e939a",
};

/**
 * Live scene palette. Materials that run every frame should `.copy()` from these
 * rather than reading the DOM, which would be a style query per frame.
 */
export const sceneColors = {
  base: new THREE.Color(FALLBACK.base),
  /**
   * A shade below `base`, for fog and for whatever the corridor is receding into.
   * Fogging toward the clear colour makes distance read as *absence*: the far end
   * of the room and the empty frame around it are the same value, so depth has
   * nothing to separate. One step darker is enough to give the corridor a back.
   */
  abyss: new THREE.Color(FALLBACK.abyss),
  ink: new THREE.Color(FALLBACK.ink),
  /** Ignition amber: primary action, portal, focused module. */
  accent: new THREE.Color(FALLBACK.accent),
  /** Champagne telemetry: conduits and secondary glow — warm, never cool blue. */
  signal: new THREE.Color(FALLBACK.signal),
  /** Structural metal: shell facets, columns, chassis. Cool against the accent. */
  steel: new THREE.Color(FALLBACK.steel),
  revision: 0,
};

let canvasContext: CanvasRenderingContext2D | null = null;

/**
 * Rasterises one pixel to resolve a colour form Three cannot parse, such as
 * `color-mix()` or `oklch()`. Off-document, so it is invisible to React.
 */
const viaCanvas = (cssColor: string): string | null => {
  if (!canvasContext) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    canvasContext = canvas.getContext("2d", { willReadFrequently: true });
  }
  if (!canvasContext) return null;

  canvasContext.clearRect(0, 0, 1, 1);
  // An unparseable value leaves `fillStyle` at its previous value, so set a known
  // sentinel first and treat "unchanged" as failure.
  canvasContext.fillStyle = "#000000";
  canvasContext.fillStyle = cssColor;
  canvasContext.fillRect(0, 0, 1, 1);

  const [r, g, b, a] = canvasContext.getImageData(0, 0, 1, 1).data;
  if (a === 0) return null;
  return `rgb(${r}, ${g}, ${b})`;
};

const parseable = (value: string) =>
  value.startsWith("#") || value.startsWith("rgb") || value.startsWith("hsl");

const readToken = (name: TokenName): string => {
  if (typeof document === "undefined") return FALLBACK[name];

  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(TOKENS[name])
    .trim();
  if (!raw) return FALLBACK[name];
  // The four tokens the scene reads are authored as plain hex, so this is the path
  // that normally runs; the canvas below only exists for future token forms.
  if (parseable(raw)) return raw;
  return viaCanvas(raw) ?? FALLBACK[name];
};

/** Pulls the palette out of the document. */
export const refreshSceneColors = () => {
  sceneColors.base.set(readToken("base"));
  sceneColors.abyss.set(readToken("abyss"));
  sceneColors.ink.set(readToken("ink"));
  sceneColors.accent.set(readToken("accent"));
  sceneColors.signal.set(readToken("signal"));
  sceneColors.steel.set(readToken("steel"));
  sceneColors.revision += 1;
};
