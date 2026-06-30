'use client'

import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing, LOCALE_LABELS, type Locale } from '@/i18n/routing'

interface Props {
  className?: string
}

export default function LanguageSwitcher({ className = '' }: Props) {
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
    <select
      value={locale}
      onChange={handleChange}
      aria-label="Язык / Language"
      className={`text-sm bg-transparent border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer ${className}`}
    >
      {routing.locales.map(l => (
        <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
      ))}
    </select>
  )
}
