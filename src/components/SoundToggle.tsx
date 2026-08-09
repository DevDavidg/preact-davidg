import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactorSound } from '../audio/reactorSound'
import { useCopy } from '../lib/locale'
import { addTick } from '../motion/ticker'
import { sceneState, useSceneStore } from '../scene/sceneState'

const STORAGE_KEY = 'dg-sound'

/**
 * Opt-in sound for the reactor.
 *
 * Off by default and never autoplayed: the synthesiser is not even imported until the
 * button is pressed, so a visitor who never wants sound pays nothing for it. The
 * preference is remembered, but a remembered "on" still waits for a gesture on the
 * next visit — browsers require one, and starting audio unprompted would be rude even
 * where it is permitted.
 *
 * Deliberately independent of `prefers-reduced-motion`: someone who cannot tolerate
 * motion may still want sound, and tying the two together removes a choice.
 */
export const SoundToggle = () => {
  const { copy } = useCopy()
  const experience = useSceneStore((state) => state.experience)
  const [on, setOn] = useState(false)
  const sound = useRef<ReactorSound | null>(null)

  const stop = useCallback(() => {
    sound.current?.stop()
    sound.current = null
  }, [])

  useEffect(() => stop, [stop])

  // A module locking into place gets a transient. Watching the focus value rather
  // than wiring a callback into the scene keeps audio out of the render path.
  useEffect(() => {
    if (!on) return
    let previous = sceneState.focus
    return addTick(() => {
      if (sceneState.focus === previous) return
      previous = sceneState.focus
      if (sceneState.focus >= 0) sound.current?.pulse()
    })
  }, [on])

  const toggle = async () => {
    if (on) {
      stop()
      setOn(false)
      try {
        window.localStorage.setItem(STORAGE_KEY, 'off')
      } catch {
        // A rejected write only loses the preference, not the feature.
      }
      return
    }

    try {
      const { startReactorSound } = await import('../audio/reactorSound')
      sound.current = startReactorSound()
      setOn(true)
      window.localStorage.setItem(STORAGE_KEY, 'on')
    } catch {
      // No audio context available: leave the control off rather than lying.
      setOn(false)
    }
  }

  // Without a scene there is no reactor to listen to, and the static experience
  // promises no loops at all.
  if (experience !== 'cinema' && experience !== 'lite') return null

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? copy.nav.soundOff : copy.nav.soundOn}
      className="flex size-11 shrink-0 items-center justify-center text-ink-dim transition-colors duration-hover ease-signal pointer-fine:hover:text-ignition aria-pressed:text-ignition"
    >
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="size-4 fill-none stroke-current stroke-[1.5]"
      >
        <path d="M3 8v4h2.5L9 15V5L5.5 8H3Z" />
        {on ? (
          <>
            <path d="M12 7.5a3.5 3.5 0 0 1 0 5" />
            <path d="M14.5 5a7 7 0 0 1 0 10" />
          </>
        ) : (
          <path d="M12.5 8.5l4 3M16.5 8.5l-4 3" />
        )}
      </svg>
    </button>
  )
}
