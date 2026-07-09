'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

/** Shown instead of a page's create/list UI when the owner has no business
 * yet — prevents forms from posting with an empty businessId. */
export default function NoBusinessYet() {
  const t = useTranslations('Dashboard.common.noBusiness')
  return (
    <div className="max-w-md mx-auto pt-10">
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
        <div className="text-4xl mb-3">🏢</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">{t('title')}</h2>
        <p className="text-gray-500 text-sm mb-6">{t('text')}</p>
        <Link href="/dashboard/settings"
          className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
          {t('cta')}
        </Link>
      </div>
    </div>
  )
}
