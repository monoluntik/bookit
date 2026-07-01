'use client'

import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing, LOCALE_LABELS, type Locale } from '@/i18n/routing'

export default function FloatingLanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value as Locale
    const query = searchParams.toString()
    router.replace(`${pathname}${query ? `?${query}` : ''}`, { locale: nextLocale })
  }

  return (
    // bottom-[72px] on mobile keeps it above fixed bottom navs (h-16 = 64px)
    // md:bottom-4: on desktop there's no bottom nav
    <div className="fixed bottom-[72px] right-3 z-30 md:bottom-4 md:right-4">
      <select
        value={locale}
        onChange={handleChange}
        aria-label="Язык / Language"
        className="text-xs bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 shadow-md hover:border-gray-300 focus:outline-none cursor-pointer"
      >
        {routing.locales.map(l => (
          <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
        ))}
      </select>
    </div>
  )
}
