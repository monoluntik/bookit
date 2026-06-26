'use client'

import { useState } from 'react'

interface Props {
  onSelect: (date: string) => void
  onBack: () => void
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

export default function DatePicker({ onSelect, onBack }: Props) {
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
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Выберите дату</h2>
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
            const isSelected = str === selected
            return (
              <button
                key={i}
                disabled={isPast}
                onClick={() => setSelected(str)}
                className={`h-9 w-full rounded-lg text-sm font-medium transition-colors
                  ${isPast ? 'text-gray-200 cursor-not-allowed' :
                    isSelected ? 'bg-blue-600 text-white' :
                    'hover:bg-blue-50 text-gray-700'}`}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm">
          Назад
        </button>
        <button
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Далее
        </button>
      </div>
    </div>
  )
}
