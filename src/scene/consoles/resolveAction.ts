import type { NavigateFunction } from 'react-router'
import type { Locale } from '../../content'
import { rememberLocale } from '../../lib/locale'
import { translatePath } from '../../lib/routes'
import { trackEvent } from '../../lib/analytics'
import { scrollToSection } from '../../motion/ticker'
import type { ConsoleActionSpec } from './types'

export interface ActionContext {
  navigate: NavigateFunction
  locale: Locale
  pathname: string
  email: string
}

export const resolveAction = (action: ConsoleActionSpec, ctx: ActionContext) => {
  switch (action.kind) {
    case 'scroll':
      scrollToSection(action.target)
      trackEvent(
        action.target === 'contact' ? 'hero_intent' : 'hero_intent',
        action.target,
      )
      return
    case 'route': {
      const [path, hash] = action.target.split('#')
      if (hash) {
        ctx.navigate(path || `/${ctx.locale}`)
        // Allow the route to mount, then scroll.
        window.setTimeout(() => scrollToSection(hash), 80)
      } else {
        ctx.navigate(action.target)
      }
      if (action.target.includes('/cv')) trackEvent('cv_view', ctx.locale)
      else if (
        action.target.includes('proyecto') ||
        action.target.includes('/work/')
      ) {
        trackEvent('case_open', action.target.split('/').pop() ?? action.target)
      }
      return
    }
    case 'external':
      window.open(action.target, '_blank', 'noopener,noreferrer')
      trackEvent('demo_open', action.target)
      return
    case 'mailto':
      window.location.href = `mailto:${action.target}`
      trackEvent('contact_click', 'console')
      return
    case 'locale': {
      const target = action.target as Locale
      rememberLocale(target)
      trackEvent('locale_switch', `${ctx.locale}->${target}`)
      ctx.navigate(translatePath(ctx.pathname, target))
      return
    }
    case 'copy-email':
      void navigator.clipboard?.writeText(ctx.email)
      trackEvent('email_copy', 'console')
      return
    case 'print':
      trackEvent('cv_print', ctx.locale)
      window.print()
      return
  }
}
