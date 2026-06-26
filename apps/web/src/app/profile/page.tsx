'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { STATUS_COLOR, STATUS_LABEL, formatDate, formatTime } from '@/lib/businessTypes'
import ReviewForm from '@/components/reviews/ReviewForm'
import CustomerBottomNav from '@/components/CustomerBottomNav'

export default function ProfilePage() {
  const { user, token, loading: authLoading, updateUser, logout } = useAuth()
  const router = useRouter()

  const [bookings, setBookings] = useState<any[]>([])
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [tab, setTab] = useState<'bookings' | 'settings' | 'password'>('bookings')
  const [cancelTarget, setCancelTarget] = useState<any | null>(null)
  const [cancelPolicy, setCancelPolicy] = useState<any | null>(null)
  const [loadingPolicy, setLoadingPolicy] = useState(false)

  // Profile form
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login?redirect=/profile')
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) setProfileForm({ name: user.name, phone: user.phone ?? '' })
  }, [user])

  useEffect(() => {
    if (!token) return
    api.getMyBookings(token).then(r => setBookings(r.bookings)).finally(() => setLoadingBookings(false))
  }, [token])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setProfileMsg('')
    try {
      const updated = await api.updateProfile({ name: profileForm.name, phone: profileForm.phone }, token)
      updateUser(updated)
      setProfileMsg('Сохранено!')
      setTimeout(() => setProfileMsg(''), 3000)
    } catch (err: any) {
      setProfileMsg('Ошибка: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setPwError('')
    setPwMsg('')
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('Пароли не совпадают'); return }
    if (pwForm.newPassword.length < 6) { setPwError('Пароль минимум 6 символов'); return }
    setSavingPw(true)
    try {
      await api.updateProfile({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }, token)
      setPwMsg('Пароль изменён!')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPwMsg(''), 3000)
    } catch (err: any) {
      setPwError(err.message)
    } finally {
      setSavingPw(false)
    }
  }

  const openCancelModal = async (booking: any) => {
    setCancelTarget(booking)
    setCancelPolicy(null)
    if (booking.business?.id) {
      setLoadingPolicy(true)
      try {
        const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
        const res = await fetch(`${API}/api/businesses/${booking.business.id}/cancellation-policy`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) setCancelPolicy(await res.json())
      } catch { /* no policy */ } finally {
        setLoadingPolicy(false)
      }
    }
  }

  const handleCancel = async () => {
    if (!token || !cancelTarget) return
    await api.updateBookingStatus(cancelTarget.id, 'CANCELLED', token)
    setBookings(prev => prev.map(b => b.id === cancelTarget.id ? { ...b, status: 'CANCELLED' } : b))
    setCancelTarget(null)
  }

  if (authLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const upcoming = bookings.filter(b => new Date(b.startAt) >= new Date() && b.status !== 'CANCELLED')
  const past = bookings.filter(b => new Date(b.startAt) < new Date() || b.status === 'CANCELLED')

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-blue-600 font-bold text-lg">Booking</Link>
          <div className="flex items-center gap-3">
            <Link href="/explore" className="text-sm text-gray-500 hover:text-gray-800">Каталог</Link>
            <button onClick={() => { logout(); router.push('/') }}
              className="text-sm text-gray-400 hover:text-gray-700">
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-lg">{user?.name}</div>
            <div className="text-sm text-gray-400">{user?.email}</div>
            {user?.phone && <div className="text-sm text-gray-400">{user?.phone}</div>}
          </div>
          <Link href="/dashboard" className="text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 shrink-0">
            Для бизнеса →
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl shadow-sm p-1 gap-1 mb-4">
          {([
            { key: 'bookings', label: `Брони ${bookings.length > 0 ? `(${bookings.length})` : ''}` },
            { key: 'settings', label: 'Данные' },
            { key: 'password', label: 'Пароль' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors
                ${tab === t.key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Bookings tab */}
        {tab === 'bookings' && (
          <div>
            {loadingBookings ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)}
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-gray-500 mb-4">Броней пока нет</p>
                <Link href="/explore" className="inline-flex px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                  Найти заведение
                </Link>
              </div>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Предстоящие</p>
                    <div className="space-y-2">
                      {upcoming.map(b => <BookingRow key={b.id} b={b} token={token} onCancel={openCancelModal} />)}
                    </div>
                  </div>
                )}
                {past.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">История</p>
                    <div className="space-y-2 opacity-80">
                      {past.map(b => <BookingRow key={b.id} b={b} token={token} onCancel={null} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Settings tab */}
        {tab === 'settings' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Личные данные</h2>
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Имя</label>
                <input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Email</label>
                <input value={user?.email ?? ''} disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-100 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Телефон</label>
                <input type="tel" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+996 700 000 000"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              {profileMsg && (
                <p className={`text-sm ${profileMsg.startsWith('Ошибка') ? 'text-red-500' : 'text-green-600'}`}>
                  {profileMsg}
                </p>
              )}
              <button type="submit" disabled={saving}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                {saving ? 'Сохраняем...' : 'Сохранить изменения'}
              </button>
            </form>
          </div>
        )}

        {/* Password tab */}
        {tab === 'password' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Изменить пароль</h2>
            <form onSubmit={handleSavePassword} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Текущий пароль</label>
                <input type="password" required value={pwForm.currentPassword}
                  onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Новый пароль</label>
                <input type="password" required value={pwForm.newPassword}
                  onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Повторите новый пароль</label>
                <input type="password" required value={pwForm.confirmPassword}
                  onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              {pwError && <p className="text-sm text-red-500">{pwError}</p>}
              {pwMsg && <p className="text-sm text-green-600">{pwMsg}</p>}
              <button type="submit" disabled={savingPw}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                {savingPw ? 'Меняем пароль...' : 'Изменить пароль'}
              </button>
            </form>
          </div>
        )}
      </div>

      <CustomerBottomNav />

      {/* Cancel confirmation modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-1">Отменить бронь?</h3>
            <p className="text-sm text-gray-500 mb-4">
              {cancelTarget.business?.name} · {new Date(cancelTarget.startAt).toLocaleDateString('ru', { day: 'numeric', month: 'long' })}
            </p>

            {loadingPolicy ? (
              <div className="flex justify-center py-3">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : cancelPolicy ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm">
                <p className="font-medium text-amber-800 mb-1.5">Политика отмены</p>
                {cancelPolicy.freeCancellationHours > 0 && (
                  <p className="text-amber-700">✓ Бесплатно за {cancelPolicy.freeCancellationHours} ч до начала</p>
                )}
                {cancelPolicy.penaltyPercent > 0 && (
                  <p className="text-amber-700">Штраф {cancelPolicy.penaltyPercent}% при более поздней отмене</p>
                )}
                {cancelPolicy.noRefundHours > 0 && (
                  <p className="text-amber-700">Без возврата при отмене менее чем за {cancelPolicy.noRefundHours} ч</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-4">Политика отмены не установлена.</p>
            )}

            <div className="flex gap-3">
              <button onClick={() => setCancelTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                Назад
              </button>
              <button onClick={handleCancel}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600">
                Отменить бронь
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BookingRow({ b, token, onCancel }: { b: any; token: string | null; onCancel: ((b: any) => void) | null }) {
  const canCancel = Boolean(onCancel) && ['PENDING', 'CONFIRMED'].includes(b.status)
  const canReview = b.status === 'COMPLETED' && !b.review
  const [showReview, setShowReview] = useState(false)

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
          {new Date(b.startAt).getDate()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{b.business?.name}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {b.resource?.name}{b.service ? ` · ${b.service.name}` : ''}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {formatDate(b.startAt)} · {formatTime(b.startAt)}–{formatTime(b.endAt)}
          </div>
          {b.guestCount && b.guestCount > 1 && (
            <div className="text-xs text-gray-400 mt-0.5">{b.guestCount} чел.</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[b.status]}`}>
            {STATUS_LABEL[b.status]}
          </span>
          {b.payment?.status === 'PAID' && (
            <span className="text-xs text-green-600">✓ Оплачено</span>
          )}
          {canCancel && (
            <button onClick={() => onCancel!(b)}
              className="text-xs text-red-400 hover:text-red-600">
              Отменить
            </button>
          )}
          {canReview && !showReview && (
            <button onClick={() => setShowReview(true)}
              className="text-xs text-amber-500 hover:text-amber-700 font-medium">
              ⭐ Оценить
            </button>
          )}
        </div>
      </div>
      {showReview && token && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <ReviewForm bookingId={b.id} token={token} onSuccess={() => setShowReview(false)} />
        </div>
      )}
    </div>
  )
}
