/**
 * @react-three/fiber 9.x still does `new THREE.Clock()` per Canvas mount.
 * three r183+ warns on that constructor. R3F v10 swaps Clock for Timer —
 * delete this file once `new THREE.Clock` is gone from the fiber package.
 *
 * @see https://github.com/pmndrs/react-three-fiber/issues/3741
 */
import { setConsoleFunction } from 'three'

const CLOCK_DEPRECATION =
  'THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.'

const INSTALLED = Symbol.for('preact-davidg/suppress-three-clock-warning')

type ConsoleMethod = 'log' | 'warn' | 'error'
type GlobalWithFlag = typeof globalThis & { [INSTALLED]?: true }

if (!(globalThis as GlobalWithFlag)[INSTALLED]) {
  ;(globalThis as GlobalWithFlag)[INSTALLED] = true

  setConsoleFunction((method: ConsoleMethod, message: string, ...params: unknown[]) => {
    if (method === 'warn' && message === CLOCK_DEPRECATION) return

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
  })
}
