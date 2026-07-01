'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, Link } from '@/i18n/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { STATUS_LABEL, STATUS_COLOR, formatDate, formatTime } from '@/lib/businessTypes'
import CustomerBottomNav from '@/components/CustomerBottomNav'

export default function MyBookingsPage() {
  const t = useTranslations('Profile')
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth?redirect=/my-bookings')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    api.getMyBookings().then(r => setBookings(r.bookings)).finally(() => setLoading(false))
  }, [user])

  const handleCancel = async (id: string) => {
    if (!user || !confirm(t('myBookings.cancelConfirm'))) return
    setCancelling(id)
    try {
      await api.updateBookingStatus(id, 'CANCELLED')
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b))
    } finally {
      setCancelling(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const upcoming = bookings.filter(b => new Date(b.startAt) >= new Date() && b.status !== 'CANCELLED')
  const past = bookings.filter(b => new Date(b.startAt) < new Date() || b.status === 'CANCELLED')

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-blue-600 font-bold">Booking</Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">{user?.name}</span>
            <button onClick={() => { logout(); router.push('/') }} className="text-gray-400 hover:text-gray-700">{t('header.logout')}</button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">{t('myBookings.title')}</h1>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-gray-500 mb-4">{t('myBookings.empty')}</p>
            <Link href="/explore" className="inline-flex px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
              {t('myBookings.findPlace')}
            </Link>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('myBookings.upcoming')}</h2>
                <div className="space-y-3">
                  {upcoming.map(b => <BookingItem key={b.id} booking={b} onCancel={handleCancel} cancelling={cancelling} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('myBookings.past')}</h2>
                <div className="space-y-3 opacity-70">
                  {past.map(b => <BookingItem key={b.id} booking={b} onCancel={null} cancelling={null} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <CustomerBottomNav />
    </div>
  )
}

function BookingItem({ booking: b, onCancel, cancelling }: any) {
  const t = useTranslations('Profile')
  const canCancel = onCancel && ['PENDING', 'CONFIRMED'].includes(b.status)

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="font-semibold text-gray-900">{b.business?.name}</div>
          <div className="text-sm text-gray-500 mt-0.5">
            {b.resource?.name}{b.service ? ` · ${b.service.name}` : ''}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {formatDate(b.startAt)}
            {' · '}
            {formatTime(b.startAt)}–{formatTime(b.endAt)}
          </div>
          {b.payment?.status === 'PAID' && (
            <div className="text-xs text-green-600 mt-1">✓ {t('myBookings.paid')}</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[b.status]}`}>
            {STATUS_LABEL[b.status]}
          </span>
          {canCancel && (
            <button
              onClick={() => onCancel(b.id)}
              disabled={cancelling === b.id}
              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50">
              {cancelling === b.id ? t('myBookings.cancelling') : t('myBookings.cancel')}
            </button>
          )}
        </div>
      </div>
      {b.business?.slug && (
        <Link href={`/b/${b.business.slug}`}
          className="mt-3 pt-3 border-t border-gray-50 text-xs text-blue-600 flex items-center gap-1 hover:text-blue-800">
          {t('myBookings.bookAgain')}
        </Link>
      )}
    </div>
  )
}
