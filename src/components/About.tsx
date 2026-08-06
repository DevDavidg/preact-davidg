import { useCopy } from '../i18n/copy'
import { useSceneStore } from '../scene/sceneState'
import { Reveal } from './ui/Reveal'

interface AboutDomPlateProps {
  /**
   * Cinema safety plate: pieces the 3D room cannot yet carry stay visible.
   * `face` / `reading` gate portrait vs quote independently so nothing doubles
   * once world-copy or voxels have taken over.
   */
  face?: boolean
  reading?: boolean
  /** Skip the heading when `#about-label` already lives in AboutA11y. */
  omitLabel?: boolean
}

const AboutDomPlate = ({
  face = true,
  reading = true,
  omitLabel = false,
}: AboutDomPlateProps) => {
  const { copy } = useCopy()
  const cinema = omitLabel || !face || !reading

  const label = omitLabel ? null : (
    <h2
      id="about-label"
      className={cinema ? 'eyebrow world-copy' : 'eyebrow shard'}
    >
      {copy.about.label}
    </h2>
  )

  const portrait = face ? (
    <figure
      className={
        cinema
          ? 'about__portrait window'
          : 'about__portrait window shard shard--plate'
      }
      aria-label={copy.about.portraitAlt}
    >
      <img
        src="/about/david-portrait.jpg"
        alt=""
        className="about__img"
        width={800}
        height={800}
        sizes="(max-width: 1080px) min(100vw, 520px), 380px"
        loading={cinema ? 'eager' : 'lazy'}
        decoding="async"
      />
      <span aria-hidden="true">{copy.about.portrait}</span>
    </figure>
  ) : cinema ? (
    // Reserve the left column so the bio stays right of the 3D face.
    <div className="about__portrait about__portrait--void" aria-hidden="true" />
  ) : null

  const body = reading ? (
    <>
      <p className={cinema ? 'about__quote' : 'about__quote shard'}>
        {copy.about.quote}
      </p>
      <p
        className={cinema ? 'lead' : 'lead shard'}
        style={{ marginTop: 24, fontSize: 15 }}
      >
        {copy.about.copy}
      </p>
      <dl className="spec">
        {copy.about.spec.map((entry) => (
          <div
            key={entry.key}
            className={cinema ? 'spec__row' : 'spec__row shard'}
          >
            <dt className="spec__key">{entry.key}</dt>
            <dd style={{ margin: 0 }}>{entry.value}</dd>
          </div>
        ))}
      </dl>
    </>
  ) : null

  if (cinema) {
    return (
      <>
        {label}
        {/* Decorative only — accessible name stays on AboutA11y. */}
        {omitLabel && reading ? (
          <p className="eyebrow" aria-hidden="true">
            {copy.about.label}
          </p>
        ) : null}
        <div className="about__grid">
          {portrait}
          {body ? <div className="panel about__body">{body}</div> : null}
        </div>
      </>
    )
  }

  return (
    <>
      {label ? <Reveal>{label}</Reveal> : null}
      <div className="about__grid">
        {portrait ? <Reveal delay={80}>{portrait}</Reveal> : null}
        {body ? (
          <Reveal className="panel about__body" delay={160}>
            {body}
          </Reveal>
        ) : null}
      </div>
    </>
  )
}

const AboutA11y = () => {
  const { copy } = useCopy()

  return (
    <>
      <h2 id="about-label" className="sr-only">
        {copy.about.label}
      </h2>
      <div className="about__a11y">
        <p>{copy.about.portraitAlt}</p>
        <p>{copy.about.quote}</p>
        <p>{copy.about.copy}</p>
        <dl>
          {copy.about.spec.map((entry) => (
            <div key={entry.key}>
              <dt>{entry.key}</dt>
              <dd>{entry.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  )
}

/**
 * Cinema: stable `about__field` height. Visual safety pieces only for what the
 * scene cannot carry yet; clipped a11y always stays mounted so SR never loses
 * the bio during face/reading hand-off. Lite/still: full in-flow DOM plate.
 */
export const About = () => {
  const tier = useSceneStore((state) => state.tier)
  const aboutVoxels = useSceneStore((state) => state.aboutVoxels)

  if (tier === 'cinema') {
    const faceLive = aboutVoxels === 'live'
    // Reading stays DOM — long quote/bio as world-copy stacked into mush.
    // Only the headshot yields to voxels once the mesh is legible (`live`
    // stays through Contact retire so the JPG never flashes back).
    return (
      <section
        id="about"
        className="section about about--cinema"
        aria-labelledby="about-label"
      >
        <div className="about__field" aria-hidden="true" />
        <AboutA11y />
        <div className="about__fallback" aria-hidden="true">
          <AboutDomPlate face={!faceLive} reading omitLabel />
        </div>
      </section>
    )
  }

  return (
    <section id="about" className="section" aria-labelledby="about-label">
      <AboutDomPlate />
    </section>
  )
}
