'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const STATUS_COLOR_MAP: Record<string, string> = {
  PENDING:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  CONFIRMED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-500 border-red-200',
  COMPLETED: 'bg-blue-50 text-blue-600 border-blue-200',
  NO_SHOW:   'bg-gray-100 text-gray-500 border-gray-200',
}

const TRANSITIONS: Record<string, string[]> = {
  PENDING:   ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'NO_SHOW', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW:   [],
}

interface Props {
  booking: any
  onStatusChange: (id: string, status: string) => Promise<void>
  onDelete?: (id: string) => void
}

function fmt(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleString('ru', opts)
}

export default function BookingCard({ booking, onStatusChange, onDelete }: Props) {
  const t = useTranslations('Dashboard.bookings')
  const tc = useTranslations('Dashboard.bookings.card')
  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PENDING:   { label: t('statusLabels.PENDING'),   color: STATUS_COLOR_MAP.PENDING },
    CONFIRMED: { label: t('statusLabels.CONFIRMED'), color: STATUS_COLOR_MAP.CONFIRMED },
    CANCELLED: { label: t('statusLabels.CANCELLED'), color: STATUS_COLOR_MAP.CANCELLED },
    COMPLETED: { label: t('statusLabels.COMPLETED'), color: STATUS_COLOR_MAP.COMPLETED },
    NO_SHOW:   { label: t('statusLabels.NO_SHOW'),   color: STATUS_COLOR_MAP.NO_SHOW },
  }
  const { token } = useAuth()
  const { success, error: showError } = useToast()
  const [loading, setLoading]           = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleStart, setRescheduleStart] = useState('')
  const [rescheduleEnd, setRescheduleEnd]   = useState('')
  const [rescheduleSaving, setRescheduleSaving] = useState(false)

  const cfg          = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.PENDING
  const next         = TRANSITIONS[booking.status] ?? []
  const canReschedule = ['PENDING', 'CONFIRMED'].includes(booking.status)
  const isBlock      = booking.source === 'BLOCK'
  const isManual     = booking.source === 'MANUAL'
  const today        = new Date().toISOString().split('T')[0]

  const rescheduleTimeError =
    rescheduleStart && rescheduleEnd && rescheduleStart >= rescheduleEnd
      ? tc('endAfterStart')
      : rescheduleDate && rescheduleDate < today
        ? tc('noPastReschedule')
        : null

  const handleAction = async (status: string) => {
    setLoading(true)
    await onStatusChange(booking.id, status)
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!token || !onDelete) return
    try {
      const res = await fetch(`${API}/api/bookings/${booking.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      success(isBlock ? tc('successBlockDeleted') : tc('successBookingDeleted'))
      onDelete(booking.id)
    } catch (err: any) {
      showError(err.message)
    }
  }

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !rescheduleDate || !rescheduleStart || !rescheduleEnd) return
    if (rescheduleTimeError) return
    setRescheduleSaving(true)
    try {
      const startAt = `${rescheduleDate}T${rescheduleStart}`
      const endAt   = `${rescheduleDate}T${rescheduleEnd}`
      const res = await fetch(`${API}/api/bookings/${booking.id}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ startAt, endAt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? tc('errorGeneric'))
      booking.startAt = data.startAt
      booking.endAt   = data.endAt
      setShowReschedule(false)
      success(tc('successTimeUpdated'))
    } catch (err: any) {
      showError(err.message)
    } finally {
      setRescheduleSaving(false)
    }
  }

  // ── Blocked slot card ──────────────────────────────────────────────────────
  if (isBlock) {
    return (
      <div className="bg-gray-50 border border-gray-200 border-dashed rounded-2xl overflow-hidden">
        <div className="p-4 flex items-center gap-4">
          <div className="sm:w-32 shrink-0 text-center">
            <div className="text-lg font-bold text-gray-500">
              {fmt(booking.startAt, { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-gray-400">
              {fmt(booking.startAt, { day: 'numeric', month: 'short' })}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base">🔒</span>
              <span className="font-medium text-gray-500">{tc('blocked')}</span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {booking.resource?.name} · {fmt(booking.startAt, { hour: '2-digit', minute: '2-digit' })}–{fmt(booking.endAt, { hour: '2-digit', minute: '2-digit' })}
            </div>
            {booking.notes && (
              <div className="text-xs text-gray-400 mt-0.5 italic">"{booking.notes}"</div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canReschedule && (
              <button onClick={() => setShowReschedule(v => !v)}
                className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:bg-white">
                {tc('reschedule')}
              </button>
            )}
            {onDelete && (
              <button onClick={handleDelete}
                className="text-xs px-2.5 py-1 rounded-full border border-red-200 text-red-400 hover:bg-red-50">
                {tc('delete')}
              </button>
            )}
          </div>
        </div>

        {showReschedule && <RescheduleForm
          date={rescheduleDate} start={rescheduleStart} end={rescheduleEnd}
          setDate={setRescheduleDate} setStart={setRescheduleStart} setEnd={setRescheduleEnd}
          today={today} error={rescheduleTimeError} saving={rescheduleSaving} onSubmit={handleReschedule}
          onCancel={() => setShowReschedule(false)} tc={tc}
        />}
      </div>
    )
  }

  // ── Regular & manual booking card ─────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Time */}
        <div className="sm:w-32 shrink-0 text-center">
          <div className="text-lg font-bold text-gray-900">
            {fmt(booking.startAt, { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-xs text-gray-400">
            {fmt(booking.startAt, { day: 'numeric', month: 'short' })}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 truncate">
              {isManual
                ? (booking.guestName || tc('manualCustomer'))
                : (booking.customer?.name ?? booking.guestName ?? tc('defaultCustomer'))}
            </span>
            {isManual && (
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide bg-purple-50 text-purple-600 border border-purple-100 px-1.5 py-0.5 rounded-full">
                {tc('manualBadge')}
              </span>
            )}
          </div>

          <div className="text-sm text-gray-500 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
            <span>{booking.resource?.name}</span>
            {booking.service && <span>· {booking.service.name}</span>}
            {(isManual ? booking.guestPhone : booking.customer?.phone) && (
              <span>· {isManual ? booking.guestPhone : booking.customer.phone}</span>
            )}
            {!isManual && booking.customer?.email && (
              <span className="text-xs">· {booking.customer.email}</span>
            )}
          </div>
          {booking.notes && (
            <div className="text-xs text-gray-400 mt-1 italic">"{booking.notes}"</div>
          )}
          {booking.payment?.status === 'PAID' && (
            <div className="text-xs text-green-600 mt-1">
              {tc('paid', { amount: Number(booking.payment.amount).toLocaleString('ru') })}
            </div>
          )}
        </div>

        {/* Status + actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.color}`}>
            {cfg.label}
          </span>
          {!loading && next.map(s => (
            <button key={s} onClick={() => handleAction(s)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-opacity hover:opacity-80 ${STATUS_CONFIG[s].color}`}>
              → {STATUS_CONFIG[s].label}
            </button>
          ))}
          {canReschedule && !loading && (
            <button onClick={() => setShowReschedule(v => !v)}
              className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50">
              {tc('reschedule')}
            </button>
          )}
          {isManual && onDelete && !loading && (
            <button onClick={handleDelete}
              className="text-xs px-2.5 py-1 rounded-full border border-red-200 text-red-400 hover:bg-red-50">
              {tc('delete')}
            </button>
          )}
          {loading && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
        </div>
      </div>

      {showReschedule && <RescheduleForm
        date={rescheduleDate} start={rescheduleStart} end={rescheduleEnd}
        setDate={setRescheduleDate} setStart={setRescheduleStart} setEnd={setRescheduleEnd}
        today={today} error={rescheduleTimeError} saving={rescheduleSaving} onSubmit={handleReschedule}
        onCancel={() => setShowReschedule(false)} tc={tc}
      />}
    </div>
  )
}

function RescheduleForm({ date, start, end, setDate, setStart, setEnd, today, error, saving, onSubmit, onCancel, tc }: {
  date: string; start: string; end: string
  setDate: (v: string) => void; setStart: (v: string) => void; setEnd: (v: string) => void
  today: string; error: string | null; saving: boolean
  onSubmit: (e: React.FormEvent) => void; onCancel: () => void
  tc: (key: string, values?: Record<string, any>) => string
}) {
  return (
    <form onSubmit={onSubmit} className="px-4 pb-4 pt-3 border-t border-gray-100 bg-gray-50">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">{tc('date')}</label>
          <input type="date" required min={today} value={date} onChange={e => setDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">{tc('start')}</label>
          <input type="time" required value={start} onChange={e => setStart(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2
              ${error ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-blue-300'}`} />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">{tc('end')}</label>
          <input type="time" required value={end} onChange={e => setEnd(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2
              ${error ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-blue-300'}`} />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving || !!error}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {saving ? '...' : tc('save')}
          </button>
          <button type="button" onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-white">
            {tc('cancel')}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </form>
  )
}
