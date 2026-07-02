'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toLocalDateStr } from '@/lib/date'

interface Props {
  onSelect: (date: string) => void
  onBack: () => void
  /** JS Date.getDay() convention (0=Sun..6=Sat). Empty/undefined = no restriction. */
  activeDaysOfWeek?: Set<number>
  /** "YYYY-MM-DD" dates fully closed via a schedule exception. */
  closedDates?: Set<string>
}

const formatDate = toLocalDateStr

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export default function DatePicker({ onSelect, onBack, activeDaysOfWeek, closedDates }: Props) {
  const t = useTranslations('Booking.datePicker')
  const DAY_LABELS = [t('days.mon'), t('days.tue'), t('days.wed'), t('days.thu'), t('days.fri'), t('days.sat'), t('days.sun')]
  const MONTH_NAMES = [
    t('months.january'), t('months.february'), t('months.march'), t('months.april'),
    t('months.may'), t('months.june'), t('months.july'), t('months.august'),
    t('months.september'), t('months.october'), t('months.november'), t('months.december'),
  ]
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState<string>('')

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  // Monday-based: 0=Mon, 6=Sun
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ]
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('title')}</h2>
      <div className="select-none">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">‹</button>
          <span className="font-medium text-gray-700">{MONTH_NAMES[month]} {year}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            if (!date) return <div key={i} />
            const str = formatDate(date)
            const isPast = date < today
            const noSchedule = !!activeDaysOfWeek && activeDaysOfWeek.size > 0 && !activeDaysOfWeek.has(date.getDay())
            const isClosed = !!closedDates?.has(str)
            const isUnavailable = isPast || noSchedule || isClosed
            const isToday = str === formatDate(today)
            const isSelected = str === selected
            return (
              <button
                key={i}
                disabled={isUnavailable}
                title={!isPast && (noSchedule || isClosed) ? t('dayUnavailable') : undefined}
                onClick={() => setSelected(str)}
                className={`relative h-9 w-full rounded-lg text-sm font-medium transition-colors
                  ${isUnavailable ? 'text-gray-200 cursor-not-allowed' :
                    isSelected ? 'bg-blue-600 text-white' :
                    isToday ? 'ring-2 ring-blue-400 text-blue-600 hover:bg-blue-50' :
                    'hover:bg-blue-50 text-gray-700'}`}
              >
                {date.getDate()}
                {isToday && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
                )}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          {t('todayIs', { date: today.toLocaleDateString('ru', { day: 'numeric', month: 'long' }) })}
        </p>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm">
          {t('back')}
        </button>
        <button
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('next')}
        </button>
      </div>
    </div>
  )
}
