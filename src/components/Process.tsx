import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useCopy } from '../i18n/copy'
import { useSceneStore } from '../scene/sceneState'
import { Reveal } from './ui/Reveal'

export const Process = () => {
  const { copy } = useCopy()
  const tier = useSceneStore((state) => state.tier)
  const container = useRef<HTMLElement>(null)
  const numeral = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const node = container.current
    if (!node) return

    const steps = node.querySelectorAll<HTMLElement>('[data-step-index]')
    const observer = new IntersectionObserver(
      (entries) => {
        const entering = entries.find((entry) => entry.isIntersecting)
        if (!entering) return
        const index = Number(
          (entering.target as HTMLElement).dataset.stepIndex ?? 0,
        )
        setActive(index)
      },
      { rootMargin: '-40% 0px -40% 0px' },
    )

    steps.forEach((step) => observer.observe(step))
    return () => observer.disconnect()
  }, [])

  // The numeral re-materialises on every phase change: it is the visual hero of
  // this section, so a plain text swap would undersell it.
  useGSAP(
    () => {
      if (tier === 'still' || !numeral.current) return
      gsap.fromTo(
        numeral.current,
        { yPercent: 16, opacity: 0, filter: 'blur(5px)' },
        {
          yPercent: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 0.6,
          ease: 'expo.out',
        },
      )
    },
    { dependencies: [active, tier] },
  )

  const step = copy.process.steps[active]

  return (
    <section
      id="process"
      ref={container}
      className="section section--scrim"
      aria-labelledby="process-label"
    >
      <Reveal>
        <h2 id="process-label" className="eyebrow">
          {copy.process.label}
        </h2>
      </Reveal>

      <div className="process__grid">
        <div className="process__sticky panel">
          <div ref={numeral} className="process__num" aria-hidden="true">
            {step.num}
          </div>
          <p className="process__num-title" aria-live="polite">
            {step.title}
          </p>
          <p className="body-sm" style={{ marginTop: 12, maxWidth: '28ch' }}>
            {copy.process.caption}
          </p>
        </div>

        <div>
          {copy.process.steps.map((item, index) => (
            <div
              key={item.num}
              className="step"
              data-step-index={index}
              data-active={active === index}
            >
              <p className="meta">{item.phase}</p>
              <h3 className="step__title">{item.heading}</h3>
              <p className="body-sm step__copy">{item.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
