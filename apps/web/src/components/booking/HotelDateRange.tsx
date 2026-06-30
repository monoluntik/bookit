'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

function toISO(d: Date) {
  return d.toISOString().slice(0, 10)
}
function parseLocal(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

interface Props {
  onSelect: (checkIn: string, checkOut: string, nights: number) => void
  onBack: () => void
}

export default function HotelDateRange({ onSelect, onBack }: Props) {
  const t = useTranslations('Booking.hotelDateRange')
  const dp = useTranslations('Booking.datePicker')
  const MONTHS = [
    dp('months.january'), dp('months.february'), dp('months.march'), dp('months.april'),
    dp('months.may'), dp('months.june'), dp('months.july'), dp('months.august'),
    dp('months.september'), dp('months.october'), dp('months.november'), dp('months.december'),
  ]
  const DAYS = [dp('days.mon'), dp('days.tue'), dp('days.wed'), dp('days.thu'), dp('days.fri'), dp('days.sat'), dp('days.sun')]
  const today = new Date()
  today.setHours(0,0,0,0)
  const [checkIn, setCheckIn] = useState<string>('')
  const [checkOut, setCheckOut] = useState<string>('')
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const handleDay = (day: number) => {
    const date = toISO(new Date(year, month, day))
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(date); setCheckOut('')
    } else {
      if (date <= checkIn) { setCheckIn(date); setCheckOut('') }
      else setCheckOut(date)
    }
  }

  const isInRange = (day: number) => {
    if (!checkIn || !checkOut) return false
    const d = toISO(new Date(year, month, day))
    return d > checkIn && d < checkOut
  }
  const isStart = (day: number) => toISO(new Date(year, month, day)) === checkIn
  const isEnd = (day: number) => toISO(new Date(year, month, day)) === checkOut
  const isPast = (day: number) => new Date(year, month, day) < today

  const nights = checkIn && checkOut
    ? Math.round((parseLocal(checkOut).getTime() - parseLocal(checkIn).getTime()) / 86400000)
    : 0

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-1">{t('title')}</h3>
      <p className="text-sm text-gray-400 mb-4">
        {!checkIn ? t('selectCheckIn') : !checkOut ? t('selectCheckOut') : t('nights', { count: nights })}
      </p>

      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">←</button>
        <span className="font-medium">{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">→</button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array(startOffset).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1
          const start = isStart(day); const end = isEnd(day); const inRange = isInRange(day); const past = isPast(day)
          return (
            <button key={day} disabled={past} onClick={() => handleDay(day)}
              className={`h-9 w-full rounded-lg text-sm transition-colors
                ${past ? 'text-gray-300 cursor-default' : ''}
                ${start || end ? 'bg-blue-600 text-white font-semibold' : ''}
                ${inRange ? 'bg-blue-100 text-blue-700' : ''}
                ${!past && !start && !end && !inRange ? 'hover:bg-gray-100 text-gray-700' : ''}`}>
              {day}
            </button>
          )
        })}
      </div>

      {checkIn && checkOut && (
        <div className="mt-4 p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
          {t('checkIn')} <strong>{new Date(checkIn).toLocaleDateString('ru', { day: 'numeric', month: 'long' })}</strong>
          {' · '}
          {t('checkOut')} <strong>{new Date(checkOut).toLocaleDateString('ru', { day: 'numeric', month: 'long' })}</strong>
          {' · '}<strong>{t('nights', { count: nights })}</strong>
        </div>
      )}

      <div className="flex gap-3 mt-5">
        <button onClick={onBack} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
          {t('back')}
        </button>
        <button disabled={!checkIn || !checkOut}
          onClick={() => onSelect(checkIn, checkOut, nights)}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-blue-700">
          {t('next')}
        </button>
      </div>
    </div>
  )
}
