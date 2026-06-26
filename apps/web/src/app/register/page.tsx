'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

export default function RegisterPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Пароли не совпадают'); return }
    if (form.password.length < 6) { setError('Пароль минимум 6 символов'); return }
    setError('')
    setLoading(true)
    try {
      const { user, token } = await api.register({
        name: form.name, email: form.email,
        password: form.password, phone: form.phone || undefined,
      })
      login(user, token)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-sm">
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-bold text-blue-600">Booking</Link>
          <h1 className="text-xl font-semibold text-gray-900 mt-2">Создать аккаунт</h1>
          <p className="text-sm text-gray-400 mt-1">Заполните данные ниже</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input required placeholder="Ваше имя" value={form.name} onChange={set('name')}
            autoComplete="name"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <input required type="email" placeholder="Email" value={form.email} onChange={set('email')}
            autoComplete="email"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <input type="tel" placeholder="Телефон (необязательно)" value={form.phone} onChange={set('phone')}
            autoComplete="tel"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />

          <div className="relative">
            <input required type={showPw ? 'text' : 'password'} placeholder="Пароль (мин. 6 символов)" value={form.password} onChange={set('password')}
              autoComplete="new-password"
              className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>

          {form.password.length > 0 && (
            <div className="flex gap-1 -mt-2">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                  form.password.length >= i * 3 + 3
                    ? i === 1 ? 'bg-red-400' : i === 2 ? 'bg-yellow-400' : 'bg-green-400'
                    : 'bg-gray-200'
                }`} />
              ))}
            </div>
          )}

          <div className="relative">
            <input required type={showConfirmPw ? 'text' : 'password'} placeholder="Повторите пароль" value={form.confirm} onChange={set('confirm')}
              autoComplete="new-password"
              className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <button type="button" onClick={() => setShowConfirmPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showConfirmPw ? '🙈' : '👁️'}
            </button>
          </div>

          {form.confirm && form.password !== form.confirm && (
            <p className="text-xs text-red-500 -mt-2">Пароли не совпадают</p>
          )}
          {form.confirm && form.password === form.confirm && form.confirm.length > 0 && (
            <p className="text-xs text-green-600 -mt-2">✓ Пароли совпадают</p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 mt-2">
            {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-4">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">Войти</Link>
        </p>
      </div>
    </div>
  )
}
