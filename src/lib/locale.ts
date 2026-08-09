import { useLocation } from 'react-router'
import {
  COPY,
  DEFAULT_LOCALE,
  isLocale,
  type Copy,
  type Locale,
} from '../content'

/**
 * The URL is the only source of truth for language. Nothing reads
 * `localStorage` or `navigator.language` to decide what to render, which is what
 * lets every page be prerendered, shared and indexed per locale.
 */
export const localeFromPath = (pathname: string): Locale => {
  const first = pathname.replace(/^\/+/, '').split('/')[0]
  return isLocale(first) ? first : DEFAULT_LOCALE
}

export interface CopyBundle {
  locale: Locale
  copy: Copy
}

export const useCopy = (): CopyBundle => {
  const { pathname } = useLocation()
  const locale = localeFromPath(pathname)
  return { locale, copy: COPY[locale] }
}

/**
 * A stored preference is still useful, but only to pick a destination on the
 * language gate — never to change what an already-addressed page renders.
 */
export const LOCALE_STORAGE_KEY = 'dg-locale'

export const readPreferredLocale = (): Locale | null => {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    // Private browsing can throw on access; a missing preference is not an error.
  }
  const languages = navigator.languages ?? [navigator.language]
  const match = languages.find((tag) => isLocale(tag.slice(0, 2).toLowerCase()))
  return match ? (match.slice(0, 2).toLowerCase() as Locale) : null
}

export const rememberLocale = (locale: Locale) => {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Preference is a convenience; failing to store it must not break navigation.
  }
}
