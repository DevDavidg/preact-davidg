import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  CopyContext,
  DICTIONARIES,
  STORAGE_KEY,
  type CopyContextValue,
  type Locale,
} from './copy'

const initialLocale = (): Locale => {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'es' || stored === 'en') return stored
  return navigator.language.startsWith('en') ? 'en' : 'es'
}

export const CopyProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    document.documentElement.lang = locale
    window.localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const setLocale = useCallback((next: Locale) => setLocaleState(next), [])

  const value = useMemo<CopyContextValue>(
    () => ({ locale, copy: DICTIONARIES[locale], setLocale }),
    [locale, setLocale],
  )

  return <CopyContext.Provider value={value}>{children}</CopyContext.Provider>
}
