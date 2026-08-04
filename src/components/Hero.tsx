import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useCopy } from '../i18n/copy'
import { useSceneStore } from '../scene/sceneState'
import { Magnetic } from './ui/Magnetic'
import { Reveal } from './ui/Reveal'
import { WeightMorphHeading } from './ui/WeightMorphHeading'

export const Hero = () => {
  const { copy } = useCopy()
  const tier = useSceneStore((state) => state.tier)
  const booted = useSceneStore((state) => state.booted)
  const worldCopy = useSceneStore((state) => state.worldCopy)
  const container = useRef<HTMLElement>(null)

  // The intro waits for the boot overlay so the two never overlap, and steps
  // aside entirely when the scene assembles this title out of fragments instead.
  useGSAP(
    () => {
      if (!booted || tier === 'still' || worldCopy) return
      gsap.from('[data-hero-word]', {
        yPercent: 115,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.07,
      })
    },
    { scope: container, dependencies: [booted, tier, worldCopy] },
  )

  return (
    <section
      id="hero"
      ref={container}
      className="section section--scrim hero"
      aria-labelledby="hero-title"
    >
      <Reveal>
        <p className="eyebrow shard">
          <span className="dot dot--blink" aria-hidden="true">
            ●
          </span>
          &nbsp;&nbsp;{copy.hero.eyebrow}
        </p>
      </Reveal>

      <div id="hero-title">
        <WeightMorphHeading
          text={copy.hero.title}
          className="hero__title world-copy"
          wordAttribute="data-hero-word"
        />
      </div>

      <div className="hero__grid">
        <Reveal className="hero__copy" delay={120}>
          <p className="lead shard">{copy.hero.lead}</p>
          <div className="hero__actions">
            <Magnetic href="#contact" className="btn btn--primary shard">
              {copy.hero.ctaPrimary}
            </Magnetic>
            <Magnetic href="#work" className="btn btn--ghost shard">
              {copy.hero.ctaGhost}
            </Magnetic>
          </div>
        </Reveal>

        <Reveal delay={220}>
          <p className="hero__facts shard">
            {copy.hero.factYears}
            <br />
            {copy.hero.factStack}
            <br />
            <strong>
              <span className="dot" aria-hidden="true">
                ●
              </span>{' '}
              {copy.hero.factAvailable}
            </strong>
          </p>
        </Reveal>
      </div>

      {/* The cue itself keeps bobbing, so the assembly lives on its two pieces:
          an animation on this element would override their transform. */}
      <a
        href="#work"
        className="hero__cue"
        aria-label={copy.hero.ctaGhost}
        data-shown={booted}
      >
        <span className="hud__label shard shard--fine">{copy.hero.cue}</span>
        <span className="hero__cue-ring shard shard--fine" aria-hidden="true">
          ↓
        </span>
      </a>
    </section>
  )
}
