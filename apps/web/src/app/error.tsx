'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Unhandled error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Что-то пошло не так</h1>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">Произошла непредвиденная ошибка. Попробуйте обновить страницу.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => reset()}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-medium hover:bg-blue-700">
            Попробовать снова
          </button>
          <a href="/" className="px-6 py-3 border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50">
            На главную
          </a>
        </div>
      </div>
    </div>
  )
}
