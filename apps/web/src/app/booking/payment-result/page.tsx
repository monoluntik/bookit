'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

function PaymentResultContent() {
  const params = useSearchParams()
  const router = useRouter()
  const bookingId = params.get('bookingId') ?? ''
  const txId = params.get('txId') ?? ''
  const [status, setStatus] = useState<'checking' | 'success' | 'failed' | 'pending'>('checking')

  useEffect(() => {
    if (!bookingId || !txId) return
    // Backend will process and redirect, but if user lands here directly, poll
    fetch(`${API}/api/payments/result?bookingId=${bookingId}&txId=${txId}`, { redirect: 'follow' })
      .then(res => {
        if (res.redirected) {
          router.replace(new URL(res.url).pathname + new URL(res.url).search)
        } else {
          setStatus('pending')
        }
      })
      .catch(() => setStatus('failed'))
  }, [bookingId, txId, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
        {status === 'checking' && (
          <>
            <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Проверяем оплату...</p>
          </>
        )}
        {status === 'pending' && (
          <>
            <div className="text-3xl mb-3">⏳</div>
            <p className="text-gray-700 font-medium">Ожидаем подтверждения</p>
            <p className="text-sm text-gray-400 mt-1">Банк ещё обрабатывает платёж</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function PaymentResult() {
  return <Suspense><PaymentResultContent /></Suspense>
}
