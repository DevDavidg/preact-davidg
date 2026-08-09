import type { ReactNode } from 'react'
import { useInView } from '../../hooks/useInView'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Stagger within a group, in milliseconds. */
  delay?: number
  as?: 'div' | 'li'
  /** Index the motion runtime binds scroll triggers to. */
  'data-module-index'?: number
}

/**
 * Marks a block as arrived so its `.shard` children converge into place.
 *
 * The wrapper itself never animates opacity: it only flips `data-shown`. That
 * keeps the content present for anything that does not run the observer — search
 * crawlers reading prerendered HTML, reduced-motion visitors, forced-colors mode —
 * which is why nothing here can leave content permanently invisible.
 */
export const Reveal = ({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
  ...rest
}: RevealProps) => {
  const { ref, inView } = useInView<HTMLElement>()

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement & HTMLLIElement>}
      className={className}
      data-shown={inView}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}
