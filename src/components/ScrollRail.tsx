import type { ReactNode } from 'react'

/**
 * Invisible scroll length for the 3D narrative.
 *
 * The canvas is fixed; this rail is what Lenis measures. Each chapter is tall on
 * purpose so assemble → hold → disassemble has room.
 */

export interface RailChapter {
  id: string
  /** Height in CSS viewport units. */
  vh: number
  /** Screen-reader / crawler copy for this beat (never painted as UI). */
  label: string
  body?: string
}

/**
 * Featured module focus markers inside Work — ScrollTrigger still binds to
 * `[data-module-index]` for touch/desktop focus on artifact panels.
 */
const WorkFocusMarkers = ({ count }: { count: number }) => {
  if (count <= 0) return null
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          data-module-index={index}
          className="absolute left-0 w-full"
          style={{
            top: `${(index / count) * 100}%`,
            height: `${100 / count}%`,
          }}
        />
      ))}
    </div>
  )
}

export const ScrollRail = ({
  chapters,
  moduleCount = 0,
  children,
}: {
  chapters: RailChapter[]
  /** When Work is present, place focus markers for featured modules. */
  moduleCount?: number
  children?: ReactNode
}) => (
  <div className="scroll-rail">
    {chapters.map((chapter) => (
      <section
        key={chapter.id}
        id={chapter.id}
        className="scroll-rail-chapter relative"
        style={{ minHeight: `${chapter.vh}vh` }}
        aria-label={chapter.label}
      >
        <h2 className="sr-only">{chapter.label}</h2>
        {chapter.body ? <p className="sr-only">{chapter.body}</p> : null}
        {chapter.id === 'work' ? (
          <WorkFocusMarkers count={moduleCount} />
        ) : null}
      </section>
    ))}
    {children}
  </div>
)
