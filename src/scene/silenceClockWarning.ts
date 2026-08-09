/**
 * `@react-three/fiber` 9.x still constructs a `THREE.Clock` per canvas, and three
 * r183+ prints a deprecation notice for it. The warning is about fiber's internals,
 * not about anything in this codebase, and an unexplained warning in a visitor's
 * console reads as a broken site.
 *
 * This filter is imported from the scene module rather than the app entry, so the
 * `three` import stays inside the lazily loaded scene chunk — importing it at the
 * entry pulled three's core into the critical bundle for the sake of one warning.
 *
 * Delete this file once fiber v10, which uses `THREE.Timer`, is adopted.
 * @see https://github.com/pmndrs/react-three-fiber/issues/3741
 */
import { setConsoleFunction } from 'three'

const CLOCK_DEPRECATION =
  'THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.'

const INSTALLED = Symbol.for('dg/silence-three-clock-warning')

type ConsoleMethod = 'log' | 'warn' | 'error'
type GlobalWithFlag = typeof globalThis & { [INSTALLED]?: true }

if (!(globalThis as GlobalWithFlag)[INSTALLED]) {
  ;(globalThis as GlobalWithFlag)[INSTALLED] = true

  setConsoleFunction(
    (method: ConsoleMethod, message: string, ...params: unknown[]) => {
      if (method === 'warn' && message === CLOCK_DEPRECATION) return

      // three passes a stack-trace helper for real diagnostics; preserve it so
      // genuine warnings keep their origin.
      if (method !== 'log') {
        const first = params[0] as
          | { isStackTrace?: boolean; getError?: (m: string) => Error }
          | undefined
        if (first?.isStackTrace && typeof first.getError === 'function') {
          console[method](first.getError(message))
          return
        }
      }

      console[method](message, ...params)
    },
  )
}
