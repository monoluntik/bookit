'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { toIntlLocale } from '@/lib/businessTypes'

interface Props {
  booking: any
  business: any
  servicePrice?: number | null
  resourcePrice?: number | null
  depositAmount?: number | null
  nights?: number
  guestCount?: number
}

function formatTime(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(toIntlLocale(locale), { hour: '2-digit', minute: '2-digit' })
}
function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(toIntlLocale(locale), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BookingConfirmation({ booking, business, servicePrice, resourcePrice, depositAmount, nights, guestCount }: Props) {
  const t = useTranslations('Booking.confirmation')
  const locale = useLocale()
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  const payableAmount = servicePrice
    ? servicePrice
    : (resourcePrice && nights && nights > 0 ? resourcePrice * nights : null)

  const isDeposit = !!depositAmount && depositAmount > 0
  const amountDue = isDeposit ? depositAmount! : payableAmount
  const remainder = isDeposit && payableAmount ? payableAmount - depositAmount! : null

  const downloadCalendar = () => {
    const start = new Date(booking.startAt)
    const end = new Date(booking.endAt)

    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`

    const summary = `${business.name}${booking.service ? ` — ${booking.service.name}` : ''}`
    const desc = `${t('calendarResource', { resource: booking.resource?.name ?? '' })}\n${t('calendarBookingNumber', { id: booking.id.slice(0,8).toUpperCase() })}`

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Bronly//RU',
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
    if (!amountDue) return
    setPaying(true)
    setPayError('')
    try {
      const { payUrl } = await api.initiatePayment(booking.id)
      window.location.href = payUrl
    } catch (err: any) {
      setPayError(err.message ?? t('paymentError'))
      setPaying(false)
    }
  }

  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
        ✓
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">{t('title')}</h2>
      <p className="text-gray-500 text-sm mb-6">{isDeposit ? t('subtitleDeposit') : t('subtitle')}</p>

      <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-3">
        <Row label={t('place')} value={business.name} />
        <Row label={t('resource')} value={booking.resource?.name} />
        {booking.service && <Row label={t('service')} value={booking.service.name} />}
        <Row label={t('date')} value={formatDate(booking.startAt, locale)} />
        {nights && nights > 0
          ? <Row label={t('nightsLabel')} value={String(nights)} />
          : <Row label={t('time')} value={`${formatTime(booking.startAt, locale)} – ${formatTime(booking.endAt, locale)}`} />
        }
        {guestCount && guestCount > 1 && (
          <Row label={t('guests')} value={String(guestCount)} />
        )}
        {isDeposit ? (
          <>
            <Row label={t('depositLabel')} value={t('priceSom', { price: amountDue!.toLocaleString('ru') })} />
            {remainder != null && remainder > 0 && (
              <Row label={t('remainderLabel')} value={t('priceSomAtVenue', { price: remainder.toLocaleString('ru') })} />
            )}
          </>
        ) : (
          payableAmount && payableAmount > 0 && (
            <Row label={t('total')} value={t('priceSom', { price: payableAmount.toLocaleString('ru') })} />
          )
        )}
        <Row label={t('status')} value={isDeposit ? t('statusPendingDeposit') : t('statusPending')} />
        <Row label={t('bookingNumber')} value={booking.id.slice(0, 8).toUpperCase()} />
      </div>

      {isDeposit && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
          {t('depositRequiredNotice')}
        </div>
      )}

      {amountDue && amountDue > 0 && (
        <>
          <button onClick={handlePay} disabled={paying}
            className="mt-4 w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {paying ? t('processingPayment') : isDeposit ? t('payDeposit', { price: amountDue.toLocaleString('ru') }) : t('pay', { price: amountDue.toLocaleString('ru') })}
          </button>
          {payError && <p className="text-sm text-red-500 mt-2">{payError}</p>}
        </>
      )}

      <button onClick={downloadCalendar}
        className="mt-3 w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm flex items-center justify-center gap-2">
        {t('addToCalendar')}
      </button>

      {!isDeposit && (
        <button
          onClick={() => window.location.reload()}
          className="mt-3 w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm"
        >
          {t('newBooking')}
        </button>
      )}
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
