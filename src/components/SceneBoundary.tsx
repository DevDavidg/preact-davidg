import { Component, Suspense, lazy, type ReactNode } from 'react'
import type { CaseStudy } from '../content'
import { trackEvent } from '../lib/analytics'
import type { Quality } from '../scene/capability'
import { useSceneStore } from '../scene/sceneState'

/**
 * The scene chunk is imported lazily *and* behind a capability check, so this
 * module never pulls Three.js into the entry graph. The import only starts once
 * `<SceneBoundary>` is actually rendered, which the capability gate decides.
 */
const ReactorScene = lazy(() =>
  import('../scene/ReactorScene').then((module) => ({
    default: module.ReactorScene,
  })),
)

interface FallbackProps {
  onFailure: () => void
  children: ReactNode
}

/**
 * Catches anything the 3D subtree throws: a rejected chunk on a flaky connection,
 * a shader that will not compile, a driver that refuses a context.
 *
 * It reports failure upward instead of rendering a message. The document already
 * says everything the site has to say, so the right recovery is to remove the
 * canvas and leave the page exactly as a static visitor would see it.
 */
class SceneErrorBoundary extends Component<FallbackProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    // Worth surfacing in development; in production the page simply carries on.
    if (import.meta.env.DEV) console.error('[scene]', error)
    // Recorded so a silent fallback is still observable in the field: without this,
    // a scene that fails everywhere looks identical to one nobody qualified for.
    trackEvent('experience_resolved', 'scene_failed')
    this.props.onFailure()
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}

/**
 * Mounts the reactor for a resolved quality, and guarantees that a failure is
 * indistinguishable from never having asked for a scene.
 */
export const SceneBoundary = ({
  quality,
  featured,
}: {
  quality: Quality
  featured: CaseStudy[]
}) => {
  const setExperience = useSceneStore((state) => state.setExperience)
  const setSceneReady = useSceneStore((state) => state.setSceneReady)

  const handleFailure = () => {
    setSceneReady(false)
    setExperience('failed')
  }

  return (
    <SceneErrorBoundary onFailure={handleFailure}>
      {/* No fallback element: the document is the fallback. */}
      <Suspense fallback={null}>
        <ReactorScene
          quality={quality}
          featured={featured}
          onFailure={handleFailure}
        />
      </Suspense>
    </SceneErrorBoundary>
  )
}
