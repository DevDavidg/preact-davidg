import { Component, Suspense, lazy, type ReactNode } from 'react'
import type { CaseStudy, Copy } from '../content'
import { trackEvent } from '../lib/analytics'
import type { Quality } from '../scene/capability'
import { useSceneStore } from '../scene/sceneState'
import type { SceneMode } from '../scene/ui/ReactorType'

const ReactorScene = lazy(() =>
  import('../scene/ReactorScene').then((module) => ({
    default: module.ReactorScene,
  })),
)

interface FallbackProps {
  onFailure: () => void
  children: ReactNode
}

class SceneErrorBoundary extends Component<FallbackProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) console.error('[scene]', error)
    trackEvent('experience_resolved', 'scene_failed')
    this.props.onFailure()
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}

export const SceneBoundary = ({
  quality,
  copy,
  featured,
  mode = 'home',
  study,
  sectionIds,
}: {
  quality: Quality
  copy: Copy
  featured: CaseStudy[]
  mode?: SceneMode
  study?: CaseStudy
  sectionIds?: readonly string[]
}) => {
  const setExperience = useSceneStore((state) => state.setExperience)
  const setSceneReady = useSceneStore((state) => state.setSceneReady)

  const handleFailure = () => {
    setSceneReady(false)
    setExperience('failed')
  }

  return (
    <SceneErrorBoundary onFailure={handleFailure}>
      <Suspense fallback={null}>
        <ReactorScene
          quality={quality}
          copy={copy}
          featured={featured}
          mode={mode}
          study={study}
          sectionIds={sectionIds}
          onFailure={handleFailure}
        />
      </Suspense>
    </SceneErrorBoundary>
  )
}
