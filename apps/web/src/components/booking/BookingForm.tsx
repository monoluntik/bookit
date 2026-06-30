'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

interface Props {
  resource: any
  service?: any
  slot: { start: string; end: string }
  guestCount?: number
  nights?: number
  onSuccess: (booking: any) => void
  onBack: () => void
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru', { day: 'numeric', month: 'long' })
}

export default function BookingForm({ resource, service, slot, guestCount, nights, onSuccess, onBack }: Props) {
  const t = useTranslations('Booking.form')
  const { user, token: existingToken, login } = useAuth()

  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState('')
  const [showPw, setShowPw] = useState(false)

  // Fields only needed when not logged in
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let token = existingToken

      if (!token) {
        if (tab === 'register') {
          const res = await api.register({ email: form.email, password: form.password, name: form.name, phone: form.phone || undefined })
          token = res.token
          await login(form.email, form.password)
        } else {
          const res = await api.login(form.email, form.password)
          token = res.token
          await login(form.email, form.password)
        }
      }

      const booking = await api.createBooking({
        resourceId: resource.id,
        serviceId: service?.id,
        startAt: slot.start,
        endAt: slot.end,
        guestCount: guestCount ?? 1,
        notes: notes || undefined,
      }, token!)

      onSuccess(booking)
    } catch (err: any) {
      setError(err.message ?? t('genericError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">{t('title')}</h2>

      {/* Summary */}
      <div className="bg-blue-50 rounded-xl p-3 mb-5 text-sm text-blue-700 space-y-0.5">
        <div>
          <span className="font-medium">{resource.name}</span>
          {service && <span className="ml-2 text-blue-500">· {service.name}</span>}
        </div>
        {nights && nights > 0 ? (
          <div>{formatDate(slot.start)} → {formatDate(slot.end)} · <strong>{t('nights', { count: nights })}</strong></div>
        ) : (
          <div>{formatDate(slot.start)} · {formatTime(slot.start)}–{formatTime(slot.end)}</div>
        )}
        {guestCount && guestCount > 1 && <div>{t('guestsShort', { count: guestCount })}</div>}
        {service && Number(service.price) > 0 && (
          <div className="font-semibold">{t('priceSom', { price: Number(service.price).toLocaleString('ru') })}</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        {/* Show user info if logged in, otherwise show auth */}
        {user ? (
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
              {user.name[0].toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{user.name}</div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </div>
          </div>
        ) : (
          <>
            {/* Auth tabs */}
            <div className="flex rounded-xl bg-gray-100 p-1">
              {(['login', 'register'] as const).map(tabKey => (
                <button key={tabKey} type="button" onClick={() => setTab(tabKey)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${tab === tabKey ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  {tabKey === 'login' ? t('login') : t('register')}
                </button>
              ))}
            </div>

            {tab === 'register' && (
              <>
                <input required placeholder={t('namePlaceholder')} value={form.name} onChange={set('name')}
                  autoComplete="name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                <input type="tel" placeholder={t('phonePlaceholder')} value={form.phone} onChange={set('phone')}
                  autoComplete="tel"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </>
            )}
            <input required type="email" placeholder={t('emailPlaceholder')} value={form.email} onChange={set('email')}
              autoComplete="email"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <div className="relative">
              <input required type={showPw ? 'text' : 'password'} placeholder={t('passwordPlaceholder')} value={form.password} onChange={set('password')}
                autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </>
        )}

        {/* Notes — always shown */}
        <textarea placeholder={t('notesPlaceholder')} value={notes}
          onChange={e => setNotes(e.target.value)} rows={2}
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onBack}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm">
            {t('back')}
          </button>
          <button type="submit" disabled={loading} aria-busy={loading}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? t('submitting') : t('submit')}
          </button>
        </div>
      </form>
    </div>
  )
}
