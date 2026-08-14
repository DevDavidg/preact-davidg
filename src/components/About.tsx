import { useCopy } from '../lib/locale'
import { useSceneStore } from '../scene/sceneState'
import { Reveal } from './ui/Reveal'
import { Section } from './ui/Section'

/**
 * The human chapter.
 *
 * One copy of the bio, always visible. The earlier version kept a clipped
 * screen-reader duplicate alongside an `aria-hidden` visible plate so the 3D voxel
 * portrait could take over — two sources of truth that could drift, and a bio no
 * user stylesheet or high-contrast mode could reach. The portrait now yields to the
 * voxel mesh only once the scene reports it is actually drawing it.
 */
export const About = () => {
  const { copy } = useCopy()
  const experience = useSceneStore((state) => state.experience)
  const sceneReady = useSceneStore((state) => state.sceneReady)

  // The voxel face replaces the photograph only when the scene is genuinely on
  // screen. Anything less and the section would show an empty column.
  const voxelFace = experience === 'cinema' && sceneReady

  return (
    <Section
      id="about"
      label={copy.about.label}
      heading={copy.about.heading}
      scrim
    >
      <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
        <Reveal delay={80}>
          <figure className="shard shard-plate flex flex-col gap-3">
            <div
              data-hairline
              className="relative aspect-square w-full overflow-hidden border border-line bg-graphite"
            >
              <picture>
                <source srcSet="/about/david-portrait.webp" type="image/webp" />
                <img
                  src="/about/david-portrait.jpg"
                  alt={copy.about.portraitAlt}
                  width={800}
                  height={800}
                  loading="lazy"
                  decoding="async"
                  sizes="(max-width: 1024px) min(100vw, 30rem), 22rem"
                  className={`size-full object-cover object-[center_25%] transition-opacity duration-chapter ease-signal ${
                    voxelFace ? 'opacity-0' : 'opacity-100'
                  }`}
                />
              </picture>
            </div>
            <figcaption className="text-meta">{copy.about.portrait}</figcaption>
          </figure>
        </Reveal>

        <Reveal delay={160}>
          <div
            data-hairline
            className="flex flex-col gap-6 border border-line bg-graphite/60 p-7 backdrop-blur-sm sm:p-9"
          >
            <blockquote className="shard">
              <p className="text-display text-xl italic sm:text-2xl">
                {copy.about.quote}
              </p>
            </blockquote>

            <p className="text-body shard">{copy.about.copy}</p>

            <dl className="shard flex flex-col border-t border-line">
              {copy.about.spec.map((entry) => (
                <div
                  key={entry.key}
                  className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-4 border-b border-line py-3 last:border-b-0"
                >
                  <dt className="text-meta">{entry.key}</dt>
                  <dd className="font-mono text-xs leading-relaxed text-ink">
                    {entry.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
