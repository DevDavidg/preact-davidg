import { useEffect, useRef } from 'react'
import { addTick } from '../motion/ticker'
import { useCopy } from '../lib/locale'
import { sceneState, swallowShape } from '../scene/sceneState'
import { useSceneStore } from '../scene/sceneState'

/**
 * What is on the other side.
 *
 * The corridor ends, the portal takes the room in, and then there has to be
 * something there. A black screen would be an honest description of an empty
 * scene and a dead end as an experience — the visitor would have scrolled to a
 * place with nothing in it and no indication that scrolling back is what leaves.
 *
 * So: a plate. The name, the address, and the one instruction that matters, which
 * is that the way out is the way you came. Deliberately the smallest possible
 * thing — the beat belongs to the portal, and this is the caption under it.
 *
 * Real DOM rather than world type, for three reasons: it is the one moment where
 * the scene has nothing left to hang copy on, an email address is a link and
 * links should be links, and this is the only part of the ending a keyboard or a
 * screen reader can use.
 *
 * Opacity is written from the tick bus rather than from state, so following the
 * scroll costs no renders — the same rule the rest of the scene layer follows.
 * And because it is a pure function of `swallow`, scrolling back up fades it out
 * again exactly as it faded in.
 */

/** Fades in over the last stretch, once the room itself has gone. */
const FADE_FROM = 0.12

export const FinaleCard = () => {
  const { copy } = useCopy()
  const experience = useSceneStore((state) => state.experience)
  const card = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let last = ''
    return addTick(() => {
      const node = card.current
      if (!node) return
      const { beyond } = swallowShape(sceneState.swallow)
      const shown = beyond <= FADE_FROM ? 0 : (beyond - FADE_FROM) / (1 - FADE_FROM)
      const value = shown.toFixed(3)
      if (value === last) return
      last = value
      node.style.opacity = value
      // Untouchable until it is actually there, so the mail link can never
      // intercept a pointer over the corridor.
      node.style.pointerEvents = shown > 0.6 ? 'auto' : 'none'
    })
  }, [])

  if (experience !== 'cinema' && experience !== 'lite') return null

  return (
    <div
      ref={card}
      data-print-hide
      className="finale-card"
      style={{ opacity: 0, pointerEvents: 'none' }}
    >
      <p className="text-meta text-ignition">{copy.hud.uplinkDone}</p>
      <a
        href={`mailto:${copy.contact.email}`}
        className="text-display mt-3 block text-2xl text-ink underline decoration-line-signal decoration-1 underline-offset-8 transition-colors duration-hover ease-signal pointer-fine:hover:text-ignition sm:text-3xl"
      >
        {copy.contact.email}
      </a>
      <p className="text-meta mt-6">{copy.hud.finaleReturn}</p>
    </div>
  )
}
