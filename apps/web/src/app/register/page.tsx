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
      router.push('/')
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
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <input required type="email" placeholder="Email" value={form.email} onChange={set('email')}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <input type="tel" placeholder="Телефон (необязательно)" value={form.phone} onChange={set('phone')}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <input required type="password" placeholder="Пароль (мин. 6 символов)" value={form.password} onChange={set('password')}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <input required type="password" placeholder="Повторите пароль" value={form.confirm} onChange={set('confirm')}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />

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
