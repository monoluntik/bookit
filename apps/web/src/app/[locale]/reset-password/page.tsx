'use client'

import { useState, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, Link } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

function ResetForm() {
  const t = useTranslations('Auth')
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div className="text-center">
        <div className="text-3xl mb-3">⚠️</div>
        <p className="text-gray-500 text-sm mb-4">{t('resetPassword.invalidTitle')}</p>
        <Link href="/forgot-password" className="text-blue-600 hover:underline text-sm">
          {t('resetPassword.requestNewLink')}
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError(t('resetPassword.passwordsMismatch')); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t('resetPassword.errorDefault'))
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('resetPassword.doneTitle')}</h2>
        <p className="text-sm text-gray-500">{t('resetPassword.doneMessage')}</p>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900 mb-2">{t('resetPassword.title')}</h1>
      <p className="text-sm text-gray-500 mb-6">{t('resetPassword.subtitle')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          required
          minLength={6}
          placeholder={t('resetPassword.passwordPlaceholder')}
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <input
          type="password"
          required
          placeholder={t('resetPassword.confirmPasswordPlaceholder')}
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? t('resetPassword.submitting') : t('resetPassword.submit')}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  const t = useTranslations('Auth')
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-blue-600">Booking</Link>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <Suspense fallback={<div className="text-center text-gray-400 text-sm">{t('resetPassword.loading')}</div>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
