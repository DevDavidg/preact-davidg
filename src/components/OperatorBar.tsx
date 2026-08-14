import { useSyncExternalStore } from 'react'
import { useCopy } from '../lib/locale'
import {
  MODES,
  controlRevision,
  cycleLaw,
  reactorControl,
  subscribeControl,
  toggleMode,
} from '../scene/control/reactorControl'
import { useSceneStore } from '../scene/sceneState'
import { SoundToggle } from './SoundToggle'

/**
 * The only DOM chrome on a 3D route.
 *
 * The corridor deliberately has no navigation — every control is a raycast
 * target in the room. That is the right call for the scene and the wrong one for
 * a keyboard: `SiteShell` never mounts on these routes, so the world pages had
 * no skip link, no sound control and nothing focusable at all outside the
 * canvas. A pointer is not a requirement for using this site.
 *
 * So: the smallest possible instrument panel. Sound, the law, and a readout of
 * whatever modes are engaged — the same three things the room itself exposes,
 * reachable with Tab. It is not a navigation bar and does not try to become one;
 * the consoles still own every route the site has.
 */

/** Reads the control plane's subscriber-visible state. */
const useControl = () =>
  useSyncExternalStore(
    subscribeControl,
    controlRevision,
    // The prerendered pass has no reactor, and the revision starts at zero.
    () => 0,
  )

export const OperatorBar = () => {
  const { copy } = useCopy()
  const experience = useSceneStore((state) => state.experience)
  useControl()

  if (experience !== 'cinema' && experience !== 'lite') return null

  const armed = experience === 'cinema'
  const engaged = MODES.filter((mode) => reactorControl.modes[mode])

  return (
    <div
      data-print-hide
      className="fixed right-gutter top-4 z-nav flex items-center gap-2"
    >
      {engaged.length ? (
        <p
          className="text-meta hidden text-ignition sm:block"
          aria-live="polite"
        >
          {engaged.map((mode) => mode.toUpperCase()).join(' · ')}
        </p>
      ) : null}

      {armed ? (
        <button
          type="button"
          onClick={cycleLaw}
          // The law is a state, not a toggle, so its name is the label — a
          // screen reader gets the same readout the ring on the optic gives.
          aria-label={`${copy.hud.build} · ${reactorControl.law}`}
          className="text-meta flex h-11 items-center px-2 text-ink-dim transition-colors duration-hover ease-signal pointer-fine:hover:text-ignition"
        >
          {reactorControl.law}
        </button>
      ) : null}

      {armed ? (
        <button
          type="button"
          onClick={() => toggleMode('wire')}
          aria-pressed={reactorControl.modes.wire}
          aria-label="WIRE"
          className="flex size-11 shrink-0 items-center justify-center text-ink-dim transition-colors duration-hover ease-signal pointer-fine:hover:text-ignition aria-pressed:text-ignition"
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="size-4 fill-none stroke-current stroke-[1.5]"
          >
            <path d="M3 5h14v10H3zM3 5l14 10M17 5L3 15" />
          </svg>
        </button>
      ) : null}

      <SoundToggle />
    </div>
  )
}
