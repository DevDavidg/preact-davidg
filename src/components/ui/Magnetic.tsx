import { useCallback, useRef, type ReactNode } from 'react'
import { useSceneStore } from '../../scene/sceneState'

interface MagneticProps {
  href: string
  className?: string
  children: ReactNode
  /** Fraction of the pointer offset the element follows. */
  strength?: number
  ariaLabel?: string
}

/**
 * A link that leans toward the pointer. Desktop only — on touch there is no
 * hover to reward, and on reduced-motion tiers it would be noise.
 */
export const Magnetic = ({
  href,
  className,
  children,
  strength = 0.2,
  ariaLabel,
}: MagneticProps) => {
  const ref = useRef<HTMLAnchorElement>(null)
  const tier = useSceneStore((state) => state.tier)
  const enabled = tier === 'cinema'

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLAnchorElement>) => {
      const node = ref.current
      if (!node || !enabled) return
      const rect = node.getBoundingClientRect()
      const offsetX = event.clientX - (rect.left + rect.width / 2)
      const offsetY = event.clientY - (rect.top + rect.height / 2)
      node.style.transition = 'none'
      node.style.transform = `translate(${(offsetX * strength).toFixed(1)}px, ${(
        offsetY * strength
      ).toFixed(1)}px)`
    },
    [enabled, strength],
  )

  const handlePointerLeave = useCallback(() => {
    const node = ref.current
    if (!node) return
    node.style.transition = 'transform var(--dur) var(--ease)'
    node.style.transform = ''
  }, [])

  return (
    <a
      ref={ref}
      href={href}
      className={className}
      aria-label={ariaLabel}
      onPointerMove={enabled ? handlePointerMove : undefined}
      onPointerLeave={enabled ? handlePointerLeave : undefined}
    >
      {children}
    </a>
  )
}
