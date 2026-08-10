import { useCopy } from '../lib/locale'
import { CompactCard, FeaturedCard } from './ui/CaseCard'
import { Reveal } from './ui/Reveal'
import { Section } from './ui/Section'

/**
 * Featured cases, then the lab, then the archive.
 *
 * The three tiers exist so a visitor can tell delivered thinking from an
 * experiment without reading the fine print — a portfolio that presents a
 * throwaway concept with the same weight as a real system is making the reader do
 * the sorting.
 */
export const Work = () => {
  const { copy, locale } = useCopy()

  const featuredLabels = {
    openCase: copy.work.openCase,
    openDemo: copy.work.openDemo,
    outcome: copy.caseStudy.outcome,
  }
  const compactLabels = {
    openCase: copy.work.openCase,
    openDemo: copy.work.openDemo,
  }

  return (
    <Section
      id="work"
      label={copy.work.label}
      heading={copy.work.heading}
      intro={copy.work.intro}
      scrim
    >
      <ul className="mt-14 flex flex-col gap-16">
        {copy.featured.map((study, index) => (
          <FeaturedCard
            key={study.slug}
            study={study}
            index={index}
            locale={locale}
            labels={featuredLabels}
          />
        ))}
      </ul>

      {/*
        Lab and Archive are chapters in their own right — the scroll rail, the
        nav and `SECTION_IDS` all address them — so they carry their own anchors
        even though they read as subsections of Work.
      */}
      <div id="lab" className="mt-24">
        <Reveal className="flex flex-col gap-3">
          <h3 className="text-eyebrow shard shard-fine">{copy.work.labLabel}</h3>
          <p className="text-body shard max-w-xl text-sm">{copy.work.labIntro}</p>
        </Reveal>

        <ul className="mt-8 flex flex-col">
          {copy.lab.map((study) => (
            <CompactCard
              key={study.slug}
              study={study}
              locale={locale}
              labels={compactLabels}
            />
          ))}
        </ul>
      </div>

      <div id="archive" className="mt-16">
        <Reveal>
          <h3 className="text-eyebrow shard shard-fine">
            {copy.work.archiveLabel}
          </h3>
        </Reveal>

        <ul className="mt-6 flex flex-col">
          {copy.archive.map((study) => (
            <CompactCard
              key={study.slug}
              study={study}
              locale={locale}
              labels={compactLabels}
            />
          ))}
        </ul>
      </div>
    </Section>
  )
}
