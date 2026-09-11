import { useSyncExternalStore } from 'react'
import { useCopy } from '../lib/locale'
import {
  MODES,
  controlRevision,
  cycleLaw,
  reactorControl,
  subscribeControl,
} from '../scene/control/reactorControl'
import { useSceneStore } from '../scene/sceneState'

/** Reads the control plane's subscriber-visible state. */
const useControl = () =>
  useSyncExternalStore(
    subscribeControl,
    controlRevision,
    // The prerendered pass has no reactor, and the revision starts at zero.
    () => 0,
  )

/** Keyboard-accessible law controls for the 3D routes. */
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
      // Positioning lives in `app/scene.css` (`.operator-bar`) so it can use
      // `env(safe-area-inset-*)`, which utilities cannot express.
      className="operator-bar fixed z-nav flex items-center gap-2"
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
    </div>
  )
}
