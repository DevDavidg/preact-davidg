import { useEffect, useId, useRef, useState } from 'react'
import '../styles/debug-themes.css'
import '../styles/debug-menu.css'
import {
  MODEL_OPTIONS,
  PALETTE_OPTIONS,
  TONE_OPTIONS,
  TYPE_OPTIONS,
  type ModelId,
  type PaletteId,
  type PresetOption,
  type ToneId,
  type TypeId,
} from './designPresets'
import { bootstrapDesignDebug, useDesignDebug } from './useDesignDebug'

bootstrapDesignDebug()

const hintFor = <T extends string>(options: PresetOption<T>[], id: T) =>
  options.find((o) => o.id === id)?.hint ?? ''

const getFocusable = (root: HTMLElement) =>
  Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), select:not([disabled]), [href], textarea, input, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1)

export const DesignDebugMenu = () => {
  const { state, setPalette, setTone, setType, setModel, reset } = useDesignDebug()
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const panel = panelRef.current
    const first = panel ? getFocusable(panel)[0] : null
    first?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        toggleRef.current?.focus()
        return
      }

      if (event.key !== 'Tab' || !panel) return

      const focusable = getFocusable(panel)
      if (focusable.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }

      const firstEl = focusable[0]
      const lastEl = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null
      const inside = active !== null && panel.contains(active)

      if (!inside) {
        event.preventDefault()
        ;(event.shiftKey ? lastEl : firstEl).focus()
        return
      }

      if (event.shiftKey && active === firstEl) {
        event.preventDefault()
        lastEl.focus()
        return
      }

      if (!event.shiftKey && active === lastEl) {
        event.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const handleToggle = () => {
    setOpen((prev) => !prev)
  }

  const handleReset = () => {
    reset()
  }

  const handleClose = () => {
    setOpen(false)
    toggleRef.current?.focus()
  }

  return (
    <div className="dg-debug" ref={rootRef}>
      {open ? (
        <div
          className="dg-debug__panel"
          id={panelId}
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Design debug menu"
          tabIndex={-1}
        >
          <div className="dg-debug__head">
            <h2 className="dg-debug__title">Design debug</h2>
            <p className="dg-debug__hint">local / DEV only</p>
          </div>

          <div className="dg-debug__section">
            <label className="dg-debug__label" htmlFor="dg-dbg-palette">
              Palette
            </label>
            <select
              id="dg-dbg-palette"
              className="dg-debug__select"
              value={state.palette}
              onChange={(event) => setPalette(event.target.value as PaletteId)}
            >
              {PALETTE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="dg-debug__desc">{hintFor(PALETTE_OPTIONS, state.palette)}</p>
          </div>

          <div className="dg-debug__section">
            <label className="dg-debug__label" htmlFor="dg-dbg-tone">
              Tone
            </label>
            <select
              id="dg-dbg-tone"
              className="dg-debug__select"
              value={state.tone}
              onChange={(event) => setTone(event.target.value as ToneId)}
            >
              {TONE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="dg-debug__desc">{hintFor(TONE_OPTIONS, state.tone)}</p>
          </div>

          <div className="dg-debug__section">
            <label className="dg-debug__label" htmlFor="dg-dbg-type">
              Typography
            </label>
            <select
              id="dg-dbg-type"
              className="dg-debug__select"
              value={state.type}
              onChange={(event) => setType(event.target.value as TypeId)}
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="dg-debug__desc">{hintFor(TYPE_OPTIONS, state.type)}</p>
          </div>

          <div className="dg-debug__section">
            <label className="dg-debug__label" htmlFor="dg-dbg-model">
              Design model
            </label>
            <select
              id="dg-dbg-model"
              className="dg-debug__select"
              value={state.model}
              onChange={(event) => setModel(event.target.value as ModelId)}
            >
              {MODEL_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="dg-debug__desc">{hintFor(MODEL_OPTIONS, state.model)}</p>
          </div>

          <div className="dg-debug__actions">
            <button type="button" className="dg-debug__btn" onClick={handleClose}>
              Close
            </button>
            <button
              type="button"
              className="dg-debug__btn dg-debug__btn--primary"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>

          <p className="dg-debug__note">
            Palette / tone / model sync CSS tokens, hovers, this panel, and the
            Three.js scene (fog, grid, lattice, artifacts). Tones mix from the
            active swatch so hue is preserved. Typography is CSS-only.
          </p>
        </div>
      ) : null}

      <button
        ref={toggleRef}
        type="button"
        className="dg-debug__toggle"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-haspopup="dialog"
        onClick={handleToggle}
      >
        <span className="dg-debug__dot" aria-hidden="true" />
        Design
      </button>
    </div>
  )
}
