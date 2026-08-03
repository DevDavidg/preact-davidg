import { Suspense, lazy } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { About } from './components/About'
import { Boot } from './components/Boot'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { Hud } from './components/Hud'
import { Nav } from './components/Nav'
import { Process } from './components/Process'
import { Services } from './components/Services'
import { Work } from './components/Work'
import { useMotionTier } from './hooks/useMotionTier'
import { usePointerTracking } from './hooks/usePointerTracking'
import { useSectionTracking } from './hooks/useSectionTracking'
import { useSmoothAnchors } from './hooks/useSmoothAnchors'
import { useSmoothScroll } from './hooks/useSmoothScroll'

gsap.registerPlugin(useGSAP)

/**
 * three.js and the post-processing pipeline are the heaviest thing here, so they
 * load in their own chunk while the boot overlay is on screen. The overlay text
 * is readable before any of it arrives.
 */
const AtelierScene = lazy(() =>
  import('./scene/AtelierScene').then((module) => ({
    default: module.AtelierScene,
  })),
)

/** DEV-only design token playground — tree-shaken from production builds. */
const DesignDebugMenu = import.meta.env.DEV
  ? lazy(() =>
      import('./debug/DesignDebugMenu').then((module) => ({
        default: module.DesignDebugMenu,
      })),
    )
  : null

const SECTION_IDS = ['hero', 'work', 'services', 'process', 'about', 'contact'] as const

const App = () => {
  const tier = useMotionTier()

  useSmoothScroll(tier)
  usePointerTracking(tier)
  useSmoothAnchors()
  useSectionTracking(SECTION_IDS)

  return (
    <>
      <Suspense fallback={null}>
        <AtelierScene tier={tier} />
      </Suspense>
      <Hud />
      <Nav />

      {/* Every section is an overlay on the one scene below it. */}
      <main className="overlay">
        <Hero />
        <Work />
        <Services />
        <Process />
        <About />
        <Contact />
        <Footer />
      </main>

      <Boot />

      {DesignDebugMenu ? (
        <Suspense fallback={null}>
          <DesignDebugMenu />
        </Suspense>
      ) : null}
    </>
  )
}

export default App
