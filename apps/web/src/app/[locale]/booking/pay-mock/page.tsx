'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

function PayMockContent() {
  const t = useTranslations('Booking.payMock')
  const params = useSearchParams()
  const router = useRouter()
  const paymentId = params.get('paymentId') ?? params.get('txId') ?? ''
  const bookingId = params.get('bookingId') ?? ''
  const amount = params.get('amount') ?? '0'
  const [loading, setLoading] = useState(false)

  const pay = async (paySuccess: boolean) => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    if (paySuccess) {
      // Dev/QA-only mock confirmation — marks payment PAID + booking CONFIRMED
      await fetch(`${API_URL}/api/payments/mock-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })
      router.push(`/booking/payment-result?bookingId=${bookingId}`)
    } else {
      router.push(`/booking/failed?bookingId=${bookingId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-sm">
        <div className="text-center mb-6">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">{t('sandboxLabel')}</div>
          <div className="text-2xl font-bold text-gray-900">{t('priceSom', { price: Number(amount).toLocaleString('ru') })}</div>
          <div className="text-xs text-gray-400 mt-1">{t('transactionNumber', { txId: paymentId })}</div>
        </div>
        <div className="space-y-2">
          <button onClick={() => pay(true)} disabled={loading}
            className="w-full py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-60">
            {loading ? t('processing') : t('paySuccess')}
          </button>
          <button onClick={() => pay(false)} disabled={loading}
            className="w-full py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-60">
            {t('payReject')}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">{t('testNotice')}</p>
      </div>
    </div>
  )
}

export default function PayMock() {
  return (
    <Suspense>
      <PayMockContent />
    </Suspense>
  )
}
