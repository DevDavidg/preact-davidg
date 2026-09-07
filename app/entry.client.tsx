import { startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { HydratedRouter } from 'react-router/dom'

// No StrictMode: it mount→unmount→remounts the WebGL canvas. R3F then
// forceContextLoss() on the first renderer, which cuts the scene — on a phone
// the second context often never comes back.
startTransition(() => {
  hydrateRoot(document, <HydratedRouter />)
})
