/** Named axes for the local-only design debug menu. Defaults = production look. */

export type PaletteId = 'immersivo' | 'cold-steel' | 'noir-gold' | 'signal-green'
export type ToneId = 'default' | 'lighter' | 'darker' | 'contrast' | 'warm'
export type TypeId = 'immersivo' | 'editorial' | 'technical' | 'soft-geo'
export type ModelId = 'immersivo' | 'wire-terminal' | 'gallery-quiet' | 'signal-brutal'

export type DesignDebugState = {
  palette: PaletteId
  tone: ToneId
  type: TypeId
  model: ModelId
}

export const STORAGE_KEY = 'dg-design-debug'

export const DEFAULT_DESIGN_DEBUG: DesignDebugState = {
  palette: 'immersivo',
  tone: 'default',
  type: 'immersivo',
  model: 'immersivo',
}

export type PresetOption<T extends string> = {
  id: T
  label: string
  hint: string
}

export const PALETTE_OPTIONS: PresetOption<PaletteId>[] = [
  { id: 'immersivo', label: 'Immersivo', hint: 'Void + coral CTA (prod)' },
  { id: 'cold-steel', label: 'Cold steel', hint: 'Cool void + ice accent' },
  { id: 'noir-gold', label: 'Noir gold', hint: 'Ink black + warm metal' },
  { id: 'signal-green', label: 'Signal green', hint: 'Terminal phosphor' },
]

export const TONE_OPTIONS: PresetOption<ToneId>[] = [
  { id: 'default', label: 'Default', hint: 'Palette as authored' },
  { id: 'lighter', label: 'Lighter', hint: 'Lift swatches toward white' },
  { id: 'darker', label: 'Darker', hint: 'Deepen swatches toward black' },
  { id: 'contrast', label: 'Contrast', hint: 'Harder ink / lines' },
  { id: 'warm', label: 'Warm accent', hint: 'Warm the current accent hue' },
]

export const TYPE_OPTIONS: PresetOption<TypeId>[] = [
  { id: 'immersivo', label: 'Immersivo', hint: 'Space Grotesk + IBM Plex' },
  { id: 'editorial', label: 'Editorial', hint: 'Fraunces + Source Sans 3' },
  { id: 'technical', label: 'Technical', hint: 'Syne + IBM Plex Mono body' },
  { id: 'soft-geo', label: 'Soft geo', hint: 'Outfit + Newsreader' },
]

export const MODEL_OPTIONS: PresetOption<ModelId>[] = [
  { id: 'immersivo', label: 'Atelier', hint: 'Current Immersivo model' },
  { id: 'wire-terminal', label: 'Wire terminal', hint: 'Phosphor + mono' },
  { id: 'gallery-quiet', label: 'Gallery quiet', hint: 'Softer gold editorial' },
  { id: 'signal-brutal', label: 'Signal brutal', hint: 'Cold + hard contrast' },
]

/** Selecting a model syncs the other three axes to a coherent recipe. */
export const MODEL_RECIPES: Record<ModelId, Omit<DesignDebugState, 'model'>> = {
  immersivo: { palette: 'immersivo', tone: 'default', type: 'immersivo' },
  'wire-terminal': { palette: 'signal-green', tone: 'contrast', type: 'technical' },
  'gallery-quiet': { palette: 'noir-gold', tone: 'lighter', type: 'editorial' },
  'signal-brutal': { palette: 'cold-steel', tone: 'contrast', type: 'soft-geo' },
}

const PALETTE_IDS = new Set<string>(PALETTE_OPTIONS.map((o) => o.id))
const TONE_IDS = new Set<string>(TONE_OPTIONS.map((o) => o.id))
const TYPE_IDS = new Set<string>(TYPE_OPTIONS.map((o) => o.id))
const MODEL_IDS = new Set<string>(MODEL_OPTIONS.map((o) => o.id))

export const isDesignDebugState = (value: unknown): value is DesignDebugState => {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.palette === 'string' &&
    PALETTE_IDS.has(v.palette) &&
    typeof v.tone === 'string' &&
    TONE_IDS.has(v.tone) &&
    typeof v.type === 'string' &&
    TYPE_IDS.has(v.type) &&
    typeof v.model === 'string' &&
    MODEL_IDS.has(v.model)
  )
}

/** Extra Google Fonts for non-default type presets (dev-only injection). */
export const DEBUG_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;600;700&family=Source+Sans+3:wght@400;500;600&family=Syne:wght@500;600;700;800&family=Outfit:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap'
