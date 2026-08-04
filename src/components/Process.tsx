import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useCopy, type Copy } from '../i18n/copy'
import { useInView } from '../hooks/useInView'
import { useSceneStore } from '../scene/sceneState'
import { Reveal } from './ui/Reveal'

interface ProcessStepProps {
  index: number
  active: boolean
  step: Copy['process']['steps'][number]
}

/**
 * One phase of the method. It assembles on its own approach rather than with the
 * whole column, so the reader always meets a phase that is still landing.
 */
const ProcessStep = ({ index, active, step }: ProcessStepProps) => {
  const { ref, inView } = useInView<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className="step"
      data-step-index={index}
      data-active={active}
      data-shown={inView}
    >
      <p className="meta shard">{step.phase}</p>
      <h3 className="step__title shard">{step.heading}</h3>
      <p className="body-sm step__copy shard">{step.copy}</p>
    </div>
  )
}

export const Process = () => {
  const { copy } = useCopy()
  const tier = useSceneStore((state) => state.tier)
  const worldCopy = useSceneStore((state) => state.worldCopy)
  const container = useRef<HTMLElement>(null)
  const numeral = useRef<HTMLDivElement>(null)
  // The sticky panel is its own assembly root: wrapping it would move the sticky
  // containing block up a level and unstick it.
  const sticky = useInView<HTMLDivElement>()
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
  // this section, so a plain text swap would undersell it. When the scene builds
  // the numeral out of fragments instead, this element is gone from the layout.
  useGSAP(
    () => {
      if (tier === 'still' || worldCopy || !numeral.current) return
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
    { dependencies: [active, tier, worldCopy] },
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
        <h2 id="process-label" className="eyebrow shard">
          {copy.process.label}
        </h2>
      </Reveal>

      <div className="process__grid">
        <div
          ref={sticky.ref}
          className="process__sticky panel"
          data-shown={sticky.inView}
        >
          <div
            ref={numeral}
            className="process__num world-copy--void"
            aria-hidden="true"
          >
            {step.num}
          </div>
          <p className="process__num-title shard" aria-live="polite">
            {step.title}
          </p>
          <p
            className="body-sm shard"
            style={{ marginTop: 12, maxWidth: '28ch' }}
          >
            {copy.process.caption}
          </p>
        </div>

        <div>
          {copy.process.steps.map((item, index) => (
            <ProcessStep
              key={item.num}
              index={index}
              active={active === index}
              step={item}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
