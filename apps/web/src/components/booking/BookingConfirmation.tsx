'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

interface Props {
  booking: any
  business: any
  token?: string | null
  servicePrice?: number | null
  resourcePrice?: number | null
  nights?: number
  guestCount?: number
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BookingConfirmation({ booking, business, token, servicePrice, resourcePrice, nights, guestCount }: Props) {
  const [paying, setPaying] = useState(false)

  const payableAmount = servicePrice
    ? servicePrice
    : (resourcePrice && nights && nights > 0 ? resourcePrice * nights : null)

  const downloadCalendar = () => {
    const start = new Date(booking.startAt)
    const end = new Date(booking.endAt)

    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`

    const summary = `${business.name}${booking.service ? ` — ${booking.service.name}` : ''}`
    const desc = `Ресурс: ${booking.resource?.name ?? ''}\nНомер брони: ${booking.id.slice(0,8).toUpperCase()}`

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Booking//RU',
      'BEGIN:VEVENT',
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc}`,
      `LOCATION:${business.address ?? ''}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'booking.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePay = async () => {
    if (!token || !payableAmount) return
    setPaying(true)
    try {
      const { payUrl } = await api.initiatePayment(booking.id, token)
      window.location.href = payUrl
    } catch {
      setPaying(false)
    }
  }

  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
        ✓
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Бронь подтверждена!</h2>
      <p className="text-gray-500 text-sm mb-6">Детали отправлены на ваш email</p>

      <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-3">
        <Row label="Место" value={business.name} />
        <Row label="Ресурс" value={booking.resource?.name} />
        {booking.service && <Row label="Услуга" value={booking.service.name} />}
        <Row label="Дата" value={formatDate(booking.startAt)} />
        {nights && nights > 0
          ? <Row label="Ночей" value={String(nights)} />
          : <Row label="Время" value={`${formatTime(booking.startAt)} – ${formatTime(booking.endAt)}`} />
        }
        {guestCount && guestCount > 1 && (
          <Row label="Гостей" value={String(guestCount)} />
        )}
        {payableAmount && payableAmount > 0 && (
          <Row label="Итого" value={`${payableAmount.toLocaleString('ru')} сом`} />
        )}
        <Row label="Статус" value="Ожидает подтверждения" />
        <Row label="Номер брони" value={booking.id.slice(0, 8).toUpperCase()} />
      </div>

      <button onClick={downloadCalendar}
        className="mt-4 w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm flex items-center justify-center gap-2">
        📅 Добавить в календарь
      </button>

      {token && payableAmount && payableAmount > 0 && (
        <button onClick={handlePay} disabled={paying}
          className="mt-4 w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
          {paying ? 'Переходим к оплате...' : `Оплатить ${payableAmount.toLocaleString('ru')} сом`}
        </button>
      )}
      <button
        onClick={() => window.location.reload()}
        className="mt-3 w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm"
      >
        Новое бронирование
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  )
}
