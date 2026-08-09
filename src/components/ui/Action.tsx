import { useCallback, useRef, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useSceneStore } from '../../scene/sceneState'
import { trackEvent, type AnalyticsEvent } from '../../lib/analytics'

type Variant = 'primary' | 'ghost' | 'quiet'

const BASE =
  'text-eyebrow inline-flex min-h-11 items-center justify-center gap-2 px-6 py-3 text-center transition-[background-color,border-color,color] duration-hover ease-signal'

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-ignition text-reactor font-semibold pointer-fine:hover:bg-ignition-bright',
  ghost:
    'border border-line-strong text-ink pointer-fine:hover:border-line-signal pointer-fine:hover:text-ignition',
  quiet:
    'text-ink-soft underline decoration-line-strong decoration-1 underline-offset-4 pointer-fine:hover:text-ignition pointer-fine:hover:decoration-ignition',
}

interface ActionProps {
  children: ReactNode
  /** Internal route, in-page anchor, or absolute external URL. */
  to: string
  variant?: Variant
  className?: string
  ariaLabel?: string
  /** Funnel step this action belongs to, for analytics. */
  event?: AnalyticsEvent
  eventDetail?: string
  /** Set for anchors that scroll rather than navigate. */
  anchor?: boolean
}

const isExternal = (to: string) =>
  to.startsWith('http') || to.startsWith('mailto:') || to.startsWith('tel:')

/**
 * Every call to action on the site.
 *
 * Internal destinations use `Link` so Cmd-click, middle-click and the browser's
 * own history all keep working — an `onClick` router push would break all three.
 * `mailto:` and `tel:` deliberately do *not* get `target="_blank"`: opening a
 * blank tab for a mail handler leaves an empty window behind.
 */
export const Action = ({
  children,
  to,
  variant = 'ghost',
  className,
  ariaLabel,
  event,
  eventDetail,
  anchor = false,
}: ActionProps) => {
  const classes = `${BASE} ${VARIANT[variant]}${className ? ` ${className}` : ''}`
  const handleClick = useCallback(() => {
    if (event) trackEvent(event, eventDetail)
  }, [event, eventDetail])

  if (isExternal(to)) {
    const newTab = to.startsWith('http')
    return (
      <a
        href={to}
        className={classes}
        aria-label={ariaLabel}
        onClick={handleClick}
        {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    )
  }

  if (anchor) {
    return (
      <a
        href={to}
        className={classes}
        aria-label={ariaLabel}
        onClick={handleClick}
      >
        {children}
      </a>
    )
  }

  return (
    <Link to={to} className={classes} aria-label={ariaLabel} onClick={handleClick}>
      {children}
    </Link>
  )
}

interface MagneticProps extends ActionProps {
  /** Fraction of the pointer offset the element follows. */
  strength?: number
}

/**
 * A call to action that leans toward the pointer. Cinema and fine pointers only:
 * there is nothing to lean toward on touch, and on the quieter qualities it is one
 * more thing moving for no narrative reason.
 *
 * The lean is written to `transform`, while the arrival animation in `scene.css`
 * uses the individual `translate` property, so the two compose instead of one
 * cancelling the other.
 */
export const MagneticAction = ({ strength = 0.16, ...props }: MagneticProps) => {
  const ref = useRef<HTMLSpanElement>(null)
  const experience = useSceneStore((state) => state.experience)
  const enabled = experience === 'cinema'

  const handlePointerMove = useCallback(
    (pointerEvent: React.PointerEvent<HTMLSpanElement>) => {
      const node = ref.current
      if (!node || pointerEvent.pointerType !== 'mouse') return
      // One layout read per move, on an element that is not being written to in
      // the same pass, so this cannot thrash.
      const rect = node.getBoundingClientRect()
      const offsetX = pointerEvent.clientX - (rect.left + rect.width / 2)
      const offsetY = pointerEvent.clientY - (rect.top + rect.height / 2)
      node.style.transition = 'none'
      node.style.transform = `translate(${(offsetX * strength).toFixed(1)}px, ${(
        offsetY * strength
      ).toFixed(1)}px)`
    },
    [strength],
  )

  const handlePointerLeave = useCallback(() => {
    const node = ref.current
    if (!node) return
    node.style.transition = `transform var(--duration-state) var(--ease-signal)`
    node.style.transform = ''
  }, [])

  if (!enabled) return <Action {...props} />

  return (
    <span
      ref={ref}
      className="inline-flex"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <Action {...props} />
    </span>
  )
}
