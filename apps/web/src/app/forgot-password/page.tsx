'use client'

import { useState } from 'react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } catch {
      setError('Ошибка сети. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-blue-600">Booking</Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                ✉️
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Письмо отправлено</h2>
              <p className="text-sm text-gray-500 mb-6">
                Если аккаунт с адресом <b>{email}</b> существует, на него придёт письмо со ссылкой для сброса пароля. Ссылка действительна 15 минут.
              </p>
              <Link href="/login" className="text-sm text-blue-600 hover:underline">
                Вернуться к входу
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Забыли пароль?</h1>
              <p className="text-sm text-gray-500 mb-6">
                Введите email — пришлём ссылку для сброса пароля.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? 'Отправляем...' : 'Отправить ссылку'}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-gray-400">
                <Link href="/login" className="text-blue-600 hover:underline">Войти</Link>
                {' · '}
                <Link href="/register" className="text-blue-600 hover:underline">Регистрация</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
