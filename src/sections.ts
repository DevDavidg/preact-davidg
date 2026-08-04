/** The scroll spine: nav, section tracking and world copy all read this order. */
export const SECTION_IDS = [
  'hero',
  'work',
  'services',
  'process',
  'about',
  'contact',
] as const

export type SectionId = (typeof SECTION_IDS)[number]
