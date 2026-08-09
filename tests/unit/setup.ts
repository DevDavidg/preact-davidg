import '@testing-library/jest-dom/vitest'

/**
 * jsdom implements neither `matchMedia` nor the capability APIs the site branches
 * on. The stub defaults to "no preference" so a test that cares about reduced
 * motion has to opt in explicitly, rather than every test silently running in the
 * static experience.
 */
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}
