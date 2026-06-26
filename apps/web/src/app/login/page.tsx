'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get('redirect') ?? '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.push(redirect)
    } catch (err: any) {
      setError(err.message ?? 'Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-600 mb-1 block">Booking</Link>
          <p className="text-gray-500 text-sm">Войдите в аккаунт</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="you@example.com" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Пароль</label>
              <Link href="/forgot-password" className="text-xs text-blue-500 hover:underline">Забыли пароль?</Link>
            </div>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 text-sm">
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4">
          Нет аккаунта?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
