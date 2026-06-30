'use client'

import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'

function FailedContent() {
  const t = useTranslations('Booking.failed')
  const params = useSearchParams()
  const bookingId = params.get('bookingId')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✗</div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">{t('title')}</h1>
        <p className="text-gray-500 text-sm mb-6">{t('subtitle')}</p>
        <div className="space-y-2">
          <button onClick={() => window.history.back()}
            className="block w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            {t('retry')}
          </button>
          <Link href="/" className="block w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">
            {t('home')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaymentFailed() {
  return <Suspense><FailedContent /></Suspense>
}
