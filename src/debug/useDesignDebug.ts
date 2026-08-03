import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_DESIGN_DEBUG,
  DEBUG_FONTS_HREF,
  MODEL_RECIPES,
  STORAGE_KEY,
  isDesignDebugState,
  type DesignDebugState,
  type ModelId,
  type PaletteId,
  type ToneId,
  type TypeId,
} from './designPresets'

const DATA_KEYS = ['palette', 'tone', 'type', 'model'] as const

/** Keep in sync with `src/scene/sceneColors.ts` — no scene import (avoids pulling three into DEV debug chunk). */
const DESIGN_DEBUG_CHANGE_EVENT = 'dg-design-debug-change'

const ensureDebugFonts = () => {
  if (typeof document === 'undefined') return
  if (document.getElementById('dg-debug-fonts')) return
  const link = document.createElement('link')
  link.id = 'dg-debug-fonts'
  link.rel = 'stylesheet'
  link.href = DEBUG_FONTS_HREF
  document.head.appendChild(link)
}

/** Notify the Three.js scene (and any other listeners) after CSS attrs settle. */
const notifyDesignDebugChange = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(DESIGN_DEBUG_CHANGE_EVENT))
}

export const applyDesignDebug = (state: DesignDebugState) => {
  const root = document.documentElement
  for (const key of DATA_KEYS) {
    const value = state[key]
    const attr = `data-${key}`
    if (value === DEFAULT_DESIGN_DEBUG[key]) {
      root.removeAttribute(attr)
    } else {
      root.setAttribute(attr, value)
    }
  }
  notifyDesignDebugChange()
}

export const clearDesignDebug = () => {
  const root = document.documentElement
  for (const key of DATA_KEYS) {
    root.removeAttribute(`data-${key}`)
  }
  notifyDesignDebugChange()
}

const readStored = (): DesignDebugState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_DESIGN_DEBUG
    const parsed: unknown = JSON.parse(raw)
    if (isDesignDebugState(parsed)) return parsed
  } catch {
    /* ignore corrupt storage */
  }
  return DEFAULT_DESIGN_DEBUG
}

const persist = (state: DesignDebugState) => {
  try {
    if (
      state.palette === DEFAULT_DESIGN_DEBUG.palette &&
      state.tone === DEFAULT_DESIGN_DEBUG.tone &&
      state.type === DEFAULT_DESIGN_DEBUG.type &&
      state.model === DEFAULT_DESIGN_DEBUG.model
    ) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* private mode / quota */
  }
}

/** Apply stored prefs as soon as the DEV chunk loads (before first paint of panel). */
export const bootstrapDesignDebug = () => {
  ensureDebugFonts()
  applyDesignDebug(readStored())
}

export const useDesignDebug = () => {
  const [state, setState] = useState<DesignDebugState>(() => readStored())

  useEffect(() => {
    ensureDebugFonts()
    applyDesignDebug(state)
    persist(state)
  }, [state])

  const setPalette = useCallback((palette: PaletteId) => {
    setState((prev) => ({ ...prev, palette, model: 'immersivo' }))
  }, [])

  const setTone = useCallback((tone: ToneId) => {
    setState((prev) => ({ ...prev, tone, model: 'immersivo' }))
  }, [])

  const setType = useCallback((type: TypeId) => {
    setState((prev) => ({ ...prev, type, model: 'immersivo' }))
  }, [])

  const setModel = useCallback((model: ModelId) => {
    const recipe = MODEL_RECIPES[model]
    setState({ model, ...recipe })
  }, [])

  const reset = useCallback(() => {
    setState(DEFAULT_DESIGN_DEBUG)
    clearDesignDebug()
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  return { state, setPalette, setTone, setType, setModel, reset }
}
