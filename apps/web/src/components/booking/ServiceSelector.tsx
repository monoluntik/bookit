'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface Props {
  services: any[]
  onSelect: (service: any) => void
  onSkip: () => void
  onBack: () => void
  required?: boolean
}

export default function ServiceSelector({ services, onSelect, onSkip, onBack, required = true }: Props) {
  const t = useTranslations('Booking.serviceSelector')
  const [selected, setSelected] = useState<string | null>(null)

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return t('durationMinutes', { count: minutes })
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (m === 0) return t('durationHours', { count: h })
    if (m === 30) return t('durationHoursHalf', { hours: h })
    return t('durationHoursMinutes', { hours: h, minutes: m })
  }

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-4">{t('title')}</h3>
      <div className="space-y-2 mb-4">
        {services.map(s => {
          const isSelected = selected === s.id
          return (
            <button key={s.id} onClick={() => { setSelected(s.id); onSelect(s) }}
              className={`w-full text-left p-4 rounded-2xl border transition-colors group relative
                ${isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'}`}>
              {isSelected && (
                <span className="absolute top-3 right-3 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">✓</span>
              )}
              <div className="flex justify-between items-start pr-6">
                <div>
                  <div className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-700'}`}>{s.name}</div>
                  {s.description && <div className="text-sm text-gray-400 mt-0.5">{s.description}</div>}
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="text-sm font-semibold text-blue-700">{t('priceSom', { price: Number(s.price).toLocaleString('ru') })}</div>
                  {s.durationMinutes && (
                    <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      {formatDuration(s.durationMinutes)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
          {t('back')}
        </button>
        {!required && (
          <button onClick={onSkip} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-400 hover:bg-gray-50">
            {t('skipService')}
          </button>
        )}
      </div>
    </div>
  )
}
