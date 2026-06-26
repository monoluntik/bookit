'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { api } from '@/lib/api'
import BookingCard from '@/components/dashboard/BookingCard'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает', CONFIRMED: 'Подтверждена',
  CANCELLED: 'Отменена', COMPLETED: 'Завершена', NO_SHOW: 'Не пришёл',
}
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-400', CONFIRMED: 'bg-blue-500',
  CANCELLED: 'bg-red-400', COMPLETED: 'bg-green-500', NO_SHOW: 'bg-gray-400',
}
const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

// ── Calendar view ─────────────────────────────────────────────────────────────

function CalendarView({ bookings, onDateClick }: { bookings: any[]; onDateClick: (d: string) => void }) {
  const [current, setCurrent] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const year = current.getFullYear()
  const month = current.getMonth()
  const monthName = current.toLocaleDateString('ru', { month: 'long', year: 'numeric' })
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7

  const bookingsByDate = useMemo(() => {
    const map: Record<string, any[]> = {}
    bookings.forEach(b => {
      const d = new Date(b.startAt).toISOString().slice(0, 10)
      if (!map[d]) map[d] = []
      map[d].push(b)
    })
    return map
  }, [bookings])

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button onClick={() => setCurrent(new Date(year, month - 1, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600">‹</button>
        <span className="font-semibold text-gray-900 capitalize">{monthName}</span>
        <button onClick={() => setCurrent(new Date(year, month + 1, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600">›</button>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-100">
        {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`e-${i}`} className="h-16 sm:h-20 border-b border-r border-gray-50" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayBookings = bookingsByDate[dateStr] ?? []
          const isToday = dateStr === today
          const col = (firstDow + i) % 7

          return (
            <div key={day}
              onClick={() => dayBookings.length > 0 && onDateClick(dateStr)}
              className={`h-16 sm:h-20 border-b border-r border-gray-50 p-1.5 flex flex-col
                ${col === 6 ? 'border-r-0' : ''}
                ${dayBookings.length > 0 ? 'cursor-pointer hover:bg-blue-50 transition-colors' : ''}`}>
              <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1
                ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                {day}
              </span>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {dayBookings.slice(0, 3).map((b: any) => (
                  <div key={b.id}
                    className={`text-white text-[10px] px-1.5 py-0.5 rounded truncate
                      ${b.source === 'BLOCK' ? 'bg-gray-400' : STATUS_COLORS[b.status] ?? 'bg-gray-400'}`}>
                    {new Date(b.startAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                    {b.source === 'BLOCK' ? ' 🔒' : ` ${b.guestName || b.customer?.name || ''}`}
                  </div>
                ))}
                {dayBookings.length > 3 && (
                  <div className="text-[10px] text-gray-400 pl-1">+{dayBookings.length - 3}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3 px-5 py-3 border-t border-gray-100">
        {STATUSES.map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[s]}`} />
            <span className="text-xs text-gray-400">{STATUS_LABELS[s]}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
          <span className="text-xs text-gray-400">Блокировка</span>
        </div>
      </div>
    </div>
  )
}

// ── Owner booking modal ───────────────────────────────────────────────────────

function OwnerBookingModal({ businesses, token, onClose, onCreated }: {
  businesses: any[]; token: string; onClose: () => void; onCreated: (b: any) => void
}) {
  const { success, error: showError } = useToast()
  const [mode, setMode] = useState<'MANUAL' | 'BLOCK'>('MANUAL')
  const [bizId, setBizId] = useState(businesses[0]?.id ?? '')
  const [resources, setResources] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loadingRes, setLoadingRes] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    resourceId: '', serviceId: '', date: '', startTime: '', endTime: '',
    guestName: '', guestPhone: '', notes: '',
  })

  // Load resources when business changes
  useEffect(() => {
    if (!bizId) return
    setLoadingRes(true)
    const slug = businesses.find(b => b.id === bizId)?.slug
    if (!slug) { setLoadingRes(false); return }
    fetch(`${API_URL}/api/businesses/${slug}`)
      .then(r => r.json())
      .then(d => {
        setResources(d.resources ?? [])
        setServices((d.resources ?? []).flatMap((r: any) => r.services ?? []))
        setForm(p => ({ ...p, resourceId: d.resources?.[0]?.id ?? '', serviceId: '' }))
      })
      .finally(() => setLoadingRes(false))
  }, [bizId, businesses])

  const timeError = form.startTime && form.endTime && form.startTime >= form.endTime
    ? 'Время конца должно быть позже начала' : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.resourceId || !form.date || !form.startTime || !form.endTime) return
    if (timeError) return
    setSaving(true)
    try {
      const startAt = `${form.date}T${form.startTime}`
      const endAt   = `${form.date}T${form.endTime}`
      const body: any = {
        resourceId: form.resourceId,
        startAt, endAt,
        source: mode,
        notes: form.notes || undefined,
      }
      if (mode === 'MANUAL') {
        if (form.guestName)  body.guestName  = form.guestName
        if (form.guestPhone) body.guestPhone = form.guestPhone
        if (form.serviceId)  body.serviceId  = form.serviceId
      }

      const res = await fetch(`${API_URL}/api/bookings/owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Ошибка')

      success(mode === 'BLOCK' ? 'Время заблокировано' : 'Бронь добавлена')
      onCreated(data)
      onClose()
    } catch (err: any) {
      showError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onKeyDown={e => e.key === 'Escape' && onClose()}>
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-md shadow-xl max-h-[95vh] overflow-y-auto"
        role="dialog" aria-modal="true">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-gray-900">Добавить в расписание</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {/* Mode tabs */}
        <div className="px-5 pt-4">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button type="button"
              onClick={() => setMode('MANUAL')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                ${mode === 'MANUAL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              👤 Бронь клиента
            </button>
            <button type="button"
              onClick={() => setMode('BLOCK')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                ${mode === 'BLOCK' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              🔒 Заблокировать
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 mb-4">
            {mode === 'MANUAL'
              ? 'Вручную добавить бронь для клиента, позвонившего по телефону или пришедшего лично.'
              : 'Отметить время как занятое — слоты не будут видны клиентам для онлайн-бронирования.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
          {/* Business selector */}
          {businesses.length > 1 && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Бизнес</label>
              <select value={bizId} onChange={e => setBizId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          {/* Resource */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Ресурс *</label>
            {loadingRes ? (
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              <select required value={form.resourceId} onChange={set('resourceId')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                <option value="">Выберите ресурс</option>
                {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Дата *</label>
            <input type="date" required value={form.date} onChange={set('date')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Начало *</label>
              <input type="time" required value={form.startTime} onChange={set('startTime')}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2
                  ${timeError ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-300'}`} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Конец *</label>
              <input type="time" required value={form.endTime} onChange={set('endTime')}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2
                  ${timeError ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-300'}`} />
            </div>
          </div>
          {timeError && <p className="text-xs text-red-500 -mt-2">{timeError}</p>}

          {/* Manual-only fields */}
          {mode === 'MANUAL' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Имя клиента</label>
                  <input type="text" value={form.guestName} onChange={set('guestName')}
                    placeholder="Айгуль Асанова"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Телефон</label>
                  <input type="tel" value={form.guestPhone} onChange={set('guestPhone')}
                    placeholder="+996 700 000 000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              </div>

              {services.filter(s => !form.resourceId || s.resourceId === form.resourceId || !s.resourceId).length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Услуга</label>
                  <select value={form.serviceId} onChange={set('serviceId')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                    <option value="">Без услуги</option>
                    {services
                      .filter(s => !form.resourceId || s.resourceId === form.resourceId || !s.resourceId)
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} — {Number(s.price).toLocaleString('ru')} с
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              {mode === 'BLOCK' ? 'Причина блокировки' : 'Примечание'}
            </label>
            <textarea value={form.notes} onChange={set('notes')} rows={2}
              placeholder={mode === 'BLOCK' ? 'Технический перерыв, уборка...' : 'Особые пожелания...'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              Отмена
            </button>
            <button type="submit" disabled={saving || !!timeError}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60
                ${mode === 'BLOCK' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {saving ? 'Добавляем...' : mode === 'BLOCK' ? '🔒 Заблокировать' : '✓ Добавить бронь'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

function BookingsContent() {
  const { token } = useAuth()
  const params = useSearchParams()
  const businessId = params.get('businessId') ?? ''

  const [businesses, setBusinesses]   = useState<any[]>([])
  const [selectedBiz, setSelectedBiz] = useState(businessId)
  const [bookings, setBookings]       = useState<any[]>([])
  const [status, setStatus]           = useState('')
  const [date, setDate]               = useState('')
  const [loading, setLoading]         = useState(false)
  const [view, setView]               = useState<'list' | 'calendar'>('list')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (!token) return
    api.getMyBusinesses(token).then(b => {
      setBusinesses(b)
      if (!selectedBiz && b.length > 0) setSelectedBiz(b[0].id)
    })
  }, [token])

  useEffect(() => {
    if (!token || !selectedBiz) return
    setLoading(true)
    api.getBusinessBookings(selectedBiz, token, {
      ...(status ? { status } : {}),
      ...(date ? { date } : {}),
    })
      .then(setBookings)
      .finally(() => setLoading(false))
  }, [token, selectedBiz, status, date])

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    if (!token) return
    await api.updateBookingStatus(bookingId, newStatus, token)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b))
  }

  const handleDelete = (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id))
  }

  const handleCreated = (booking: any) => {
    setBookings(prev => [...prev, booking].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    ))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Брони</h1>
        <div className="flex items-center gap-2">
          {/* Add booking button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
            <span className="text-base leading-none">+</span>
            <span className="hidden sm:inline">Добавить</span>
          </button>
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Список
            </button>
            <button onClick={() => setView('calendar')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${view === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Календарь
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 mb-5 flex flex-wrap gap-3 shadow-sm">
        {businesses.length > 1 && (
          <select value={selectedBiz} onChange={e => setSelectedBiz(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        {view === 'list' && (
          <>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
              <option value="">Все статусы</option>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            {date && (
              <button onClick={() => setDate('')} className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600">
                Сбросить
              </button>
            )}
          </>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center pt-10">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : view === 'calendar' ? (
        <CalendarView bookings={bookings} onDateClick={d => { setView('list'); setDate(d) }} />
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <div className="text-3xl mb-3">📭</div>
          <p className="text-gray-400 mb-4">Броней не найдено</p>
          <button onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
            + Добавить первую бронь
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <BookingCard
              key={b.id}
              booking={b}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Owner booking modal */}
      {showAddModal && token && businesses.length > 0 && (
        <OwnerBookingModal
          businesses={businesses}
          token={token}
          onClose={() => setShowAddModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}

export default function BookingsPage() {
  return <Suspense><BookingsContent /></Suspense>
}
