'use client'

import { useEffect, useState, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'

const POLL_INTERVAL_MS = 2500
const MAX_POLLS = 48 // ~2 minutes

function PaymentResultContent() {
  const t = useTranslations('Booking.paymentResult')
  const params = useSearchParams()
  const bookingId = params.get('bookingId') ?? ''
  const [status, setStatus] = useState<'checking' | 'success' | 'failed' | 'pending'>('checking')

  useEffect(() => {
    if (!bookingId) return
    let cancelled = false
    let polls = 0

    const poll = async () => {
      try {
        const data = await api.getPaymentStatus(bookingId)
        if (cancelled) return
        if (data.status === 'PAID') {
          setStatus('success')
          return
        }
        polls += 1
        if (polls >= MAX_POLLS) {
          setStatus('pending')
          return
        }
        setTimeout(poll, POLL_INTERVAL_MS)
      } catch {
        if (!cancelled) setStatus('failed')
      }
    }

    poll()
    return () => { cancelled = true }
  }, [bookingId])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
        {status === 'checking' && (
          <>
            <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">{t('checking')}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-3xl mb-3">✅</div>
            <p className="text-gray-700 font-medium">{t('success')}</p>
            <a href="/dashboard/bookings" className="inline-block mt-4 text-sm text-blue-600 hover:underline">{t('goToBookings')}</a>
          </>
        )}
        {status === 'pending' && (
          <>
            <div className="text-3xl mb-3">⏳</div>
            <p className="text-gray-700 font-medium">{t('pending')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('pendingHint')}</p>
          </>
        )}
        {status === 'failed' && (
          <>
            <div className="text-3xl mb-3">⚠️</div>
            <p className="text-gray-700 font-medium">{t('failed')}</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function PaymentResult() {
  return <Suspense><PaymentResultContent /></Suspense>
}
