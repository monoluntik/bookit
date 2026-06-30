import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

// Each namespace lives in its own file per locale (messages/<locale>/<namespace>.json)
// so different pages/areas of the app can be translated independently without
// every change touching one giant shared JSON file.
const NAMESPACES = [
  'Common',
  'Home',
  'Explore',
  'Business',
  'Booking',
  'Auth',
  'Profile',
  'Static',
  'Dashboard',
  'Admin',
] as const

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  const modules = await Promise.all(
    NAMESPACES.map(async ns => {
      try {
        return (await import(`../../messages/${locale}/${ns}.json`)).default
      } catch {
        return {}
      }
    }),
  )

  return {
    locale,
    messages: Object.assign({}, ...modules),
  }
})
