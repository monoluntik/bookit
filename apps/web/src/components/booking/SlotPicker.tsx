'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/api'
import { toLocalDateStr, addDaysToDateStr, parseLocalDateStr } from '@/lib/date'

interface Slot { start: string; end: string }

interface Props {
  resourceId: string
  date: string
  slotDuration?: number
  onSelect: (slot: Slot) => void
  onBack: () => void
  onChangeDate?: (newDate: string) => void
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
}

export default function SlotPicker({ resourceId, date, slotDuration, onSelect, onBack, onChangeDate }: Props) {
  const t = useTranslations('Booking.slotPicker')
  const [slots, setSlots] = useState<Slot[]>([])

  const formatDuration = (slot: Slot) => {
    const mins = (new Date(slot.end).getTime() - new Date(slot.start).getTime()) / 60000
    if (mins < 60) return t('minutes', { count: mins })
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m ? t('hoursMinutes', { hours: h, minutes: m }) : t('hours', { count: h })
  }
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(false)
  const [selected, setSelected] = useState<Slot | null>(null)

  const load = () => {
    setLoading(true)
    setApiError(false)
    const q = slotDuration ? `&duration=${slotDuration}` : ''
    api.getSlots(resourceId, date, q)
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => { setApiError(true); setSlots([]) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [resourceId, date]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNextDay = () => {
    if (!onChangeDate) return
    onChangeDate(addDaysToDateStr(date, 1))
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-0.5">{t('title')}</h2>
      <p className="text-sm text-gray-400 mb-4">
        {parseLocalDateStr(date).toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Array(9).fill(0).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>

      ) : apiError ? (
        <div className="text-center py-10">
          <p className="text-gray-400 mb-3">{t('loadError')}</p>
          <button onClick={load}
            className="text-sm text-blue-600 hover:underline">{t('retry')}</button>
        </div>

      ) : slots.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl">
          <div className="text-3xl mb-2">
            {date === toLocalDateStr(new Date()) ? '🌙' : '😔'}
          </div>
          {date === toLocalDateStr(new Date()) ? (
            <>
              <p className="text-gray-500 font-medium text-sm">{t('noSlotsToday')}</p>
              <p className="text-xs text-gray-400 mt-1">{t('noSlotsTodayHint')}</p>
              <button onClick={onBack}
                className="mt-3 text-sm text-blue-600 hover:underline font-medium">
                {t('chooseAnotherDay')}
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-500 font-medium text-sm">{t('noSlotsDate')}</p>
              <p className="text-xs text-gray-400 mt-1">{t('noSlotsDateHint')}</p>
              <button onClick={onBack}
                className="mt-3 text-sm text-blue-600 hover:underline font-medium">
                {t('chooseAnotherDay')}
              </button>
            </>
          )}
          {onChangeDate && (
            <button onClick={handleNextDay}
              className="mt-3 block mx-auto px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
              {t('showNextDay')}
            </button>
          )}
        </div>

      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {slots.map((slot) => {
            const isSelected = selected?.start === slot.start
            return (
              <button
                key={slot.start}
                onClick={() => setSelected(slot)}
                className={`py-2.5 px-2 rounded-xl text-sm font-medium border transition-all
                  ${isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-[1.02]'
                    : 'border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'}`}
              >
                <div>{formatTime(slot.start)}</div>
                <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                  {formatDuration(slot)}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button onClick={onBack}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm">
          {t('back')}
        </button>
        <button
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {selected ? t('selectSlot', { time: formatTime(selected.start) }) : t('selectTime')}
        </button>
      </div>
    </div>
  )
}
