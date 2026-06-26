'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

function PayMockContent() {
  const params = useSearchParams()
  const router = useRouter()
  const txId = params.get('txId') ?? ''
  const bookingId = params.get('bookingId') ?? ''
  const amount = params.get('amount') ?? '0'
  const [loading, setLoading] = useState(false)

  const pay = async (success: boolean) => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    if (success) {
      // Route through real API result endpoint — marks payment PAID + booking CONFIRMED
      window.location.href = `${API_URL}/api/payments/result?bookingId=${bookingId}&txId=${txId}`
    } else {
      router.push(`/booking/failed?bookingId=${bookingId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-sm">
        <div className="text-center mb-6">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Bakai Bank — Dev Sandbox</div>
          <div className="text-2xl font-bold text-gray-900">{Number(amount).toLocaleString('ru')} сом</div>
          <div className="text-xs text-gray-400 mt-1">Транзакция #{txId}</div>
        </div>
        <div className="space-y-2">
          <button onClick={() => pay(true)} disabled={loading}
            className="w-full py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-60">
            {loading ? 'Обработка...' : '✓ Оплатить (успешно)'}
          </button>
          <button onClick={() => pay(false)} disabled={loading}
            className="w-full py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-60">
            ✗ Отклонить платёж
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">Это тестовая страница. В prod будет перенаправление на Bakai.</p>
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
