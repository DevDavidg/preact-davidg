import { createContext, useContext } from 'react'
import es from '../locales/es.json'
import en from '../locales/en.json'

export type Locale = 'es' | 'en'

/** Spanish is the source of truth; English must match its shape. */
export type Copy = typeof es

export const DICTIONARIES: Record<Locale, Copy> = { es, en }
export const STORAGE_KEY = 'dg-locale'

export interface CopyContextValue {
  locale: Locale
  copy: Copy
  setLocale: (locale: Locale) => void
}

export const CopyContext = createContext<CopyContextValue | null>(null)

/**
 * Typed copy access. Returning the whole dictionary instead of a `t('a.b')`
 * lookup means a renamed or missing key is a compile error, not a blank string.
 */
export const useCopy = (): CopyContextValue => {
  const context = useContext(CopyContext)
  if (!context) throw new Error('useCopy must be used inside <CopyProvider>')
  return context
}
