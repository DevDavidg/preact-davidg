import type { ReactNode } from 'react'
import { useInView } from '../../hooks/useInView'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Stagger within a group, in milliseconds. */
  delay?: number
}

/** Fades an overlay block up once, the first time it enters the viewport. */
export const Reveal = ({ children, className, delay = 0 }: RevealProps) => {
  const { ref, inView } = useInView<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={className ? `reveal ${className}` : 'reveal'}
      data-shown={inView}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
