'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export default function ForgotPasswordPage() {
  const t = useTranslations('Auth')
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
      setError(t('forgotPassword.errorNetwork'))
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
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('forgotPassword.sentTitle')}</h2>
              <p className="text-sm text-gray-500 mb-6">
                {t.rich('forgotPassword.sentMessage', { email, b: chunks => <b>{chunks}</b> })}
              </p>
              <Link href="/login" className="text-sm text-blue-600 hover:underline">
                {t('forgotPassword.backToLogin')}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-2">{t('forgotPassword.title')}</h1>
              <p className="text-sm text-gray-500 mb-6">
                {t('forgotPassword.subtitle')}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  required
                  placeholder={t('forgotPassword.emailPlaceholder')}
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
                  {loading ? t('forgotPassword.submitting') : t('forgotPassword.submit')}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-gray-400">
                <Link href="/login" className="text-blue-600 hover:underline">{t('forgotPassword.loginLink')}</Link>
                {' · '}
                <Link href="/register" className="text-blue-600 hover:underline">{t('forgotPassword.registerLink')}</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
