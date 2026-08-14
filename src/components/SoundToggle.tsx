import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactorSound } from '../audio/reactorSound'
import { useCopy } from '../lib/locale'
import { addTick } from '../motion/ticker'
import {
  pushLog,
  setSoundRequest,
  setVoices,
} from '../scene/control/reactorControl'
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
 *
 * This button is also the only place that owns the audio graph. The scene never
 * imports the synthesiser; it asks `reactorControl` for a voice and gets silence
 * when nothing is registered — which is what keeps "sound is off" from being a
 * branch in fifteen different files.
 */
export const SoundToggle = () => {
  const { copy } = useCopy()
  const experience = useSceneStore((state) => state.experience)
  const [on, setOn] = useState(false)
  const [level, setLevel] = useState(0)
  const sound = useRef<ReactorSound | null>(null)

  const stop = useCallback(() => {
    setVoices(null)
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

  /*
   * The icon is a meter.
   *
   * A speaker glyph tells the visitor the state of a setting. A needle that moves
   * with the room tells them the reactor is making the sound they are hearing,
   * which is the only claim this site actually wants to make about its audio.
   * Sampled off the shared tick bus and rounded hard, so it costs a handful of
   * renders a second rather than one per frame.
   */
  useEffect(() => {
    if (!on) {
      setLevel(0)
      return
    }
    return addTick(() => {
      const next = Math.round((sound.current?.level() ?? 0) * 4)
      setLevel((current) => (current === next ? current : next))
    })
  }, [on])

  const start = useCallback(async () => {
    try {
      const { startReactorSound } = await import('../audio/reactorSound')
      const instance = startReactorSound()
      sound.current = instance
      setVoices({
        hover: instance.hover,
        tick: instance.tick,
        lock: instance.lock,
        law: instance.law,
        whoosh: instance.whoosh,
        uplink: instance.uplink,
        deny: instance.deny,
        level: instance.level,
      })
      setOn(true)
      pushLog('audio · online', 0)
      window.localStorage.setItem(STORAGE_KEY, 'on')
    } catch {
      // No audio context available: leave the control off rather than lying.
      setOn(false)
    }
  }, [])

  const halt = useCallback(() => {
    stop()
    setOn(false)
    pushLog('audio · standby', 0)
    try {
      window.localStorage.setItem(STORAGE_KEY, 'off')
    } catch {
      // A rejected write only loses the preference, not the feature.
    }
  }, [stop])

  const toggle = useCallback(() => {
    if (on) {
      halt()
      return
    }
    void start()
  }, [on, halt, start])

  // The developer console can mute without owning this component's state. It is
  // still this button that starts and tears the graph down, so there is exactly
  // one audio lifecycle no matter who asked.
  useEffect(() => {
    setSoundRequest((next) => {
      if (next === on) return
      if (next) void start()
      else halt()
    })
    return () => setSoundRequest(null)
  }, [on, start, halt])

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
            {/* Two arcs that appear with level: the control shows the room. */}
            <path d="M12 7.5a3.5 3.5 0 0 1 0 5" opacity={level >= 1 ? 1 : 0.3} />
            <path d="M14.5 5a7 7 0 0 1 0 10" opacity={level >= 3 ? 1 : 0.3} />
          </>
        ) : (
          <path d="M12.5 8.5l4 3M16.5 8.5l-4 3" />
        )}
      </svg>
    </button>
  )
}
