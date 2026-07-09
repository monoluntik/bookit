'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import PhoneAuthFlow from '@/components/auth/PhoneAuthFlow'
import { toIntlLocale } from '@/lib/businessTypes'

interface Props {
  resource: any
  service?: any
  slot: { start: string; end: string }
  guestCount?: number
  nights?: number
  onSuccess: (booking: any) => void
  onBack: () => void
}

function formatTime(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(toIntlLocale(locale), { hour: '2-digit', minute: '2-digit' })
}
function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(toIntlLocale(locale), { day: 'numeric', month: 'long' })
}

export default function BookingForm({ resource, service, slot, guestCount, nights, onSuccess, onBack }: Props) {
  const t = useTranslations('Booking.form')
  const locale = useLocale()
  const { user, updateUser } = useAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (user && !user.name && name.trim()) {
        await api.updateProfile({ name: name.trim() })
        updateUser({ name: name.trim() })
      }
      const booking = await api.createBooking({
        resourceId: resource.id,
        serviceId: service?.id,
        startAt: slot.start,
        endAt: slot.end,
        guestCount: guestCount ?? 1,
        notes: notes || undefined,
      })
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
          <div>{formatDate(slot.start, locale)} → {formatDate(slot.end, locale)} · <strong>{t('nights', { count: nights })}</strong></div>
        ) : (
          <div>{formatDate(slot.start, locale)} · {formatTime(slot.start, locale)}–{formatTime(slot.end, locale)}</div>
        )}
        {guestCount && guestCount > 1 && <div>{t('guestsShort', { count: guestCount })}</div>}
        {service && Number(service.price) > 0 && (
          <div className="font-semibold">{t('priceSom', { price: Number(service.price).toLocaleString('ru') })}</div>
        )}
      </div>

      {!user ? (
        <>
          <PhoneAuthFlow onAuthenticated={() => {}} />
          <button type="button" onClick={onBack}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-3">
            ← {t('back')}
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          {user.name ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                {user.name[0].toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">{user.phone}</div>
              </div>
            </div>
          ) : (
            <input required placeholder={t('namePlaceholder')} value={name}
              onChange={e => setName(e.target.value)} autoComplete="name"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          )}

          <textarea placeholder={t('notesPlaceholder')} value={notes}
            onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onBack}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm">
              {t('back')}
            </button>
            <button type="submit" disabled={loading || (!user.name && !name.trim())} aria-busy={loading}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? t('submitting') : t('submit')}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
