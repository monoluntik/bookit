'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface Props {
  max?: number
  label?: string
  businessType?: string
  onSelect: (count: number) => void
  onBack: () => void
}

const QUICK_VALUES = [1, 2, 3, 4, 6, 8]

export default function GuestCountStep({ max = 20, label, businessType, onSelect, onBack }: Props) {
  const t = useTranslations('Booking.guestCount')
  const [count, setCount] = useState(1)

  const getHint = (businessType?: string): string => {
    if (businessType === 'RESTAURANT') return t('hintRestaurant')
    if (businessType === 'HOTEL') return t('hintHotel')
    return t('hintDefault')
  }

  const resolvedLabel = label ?? t('defaultLabel')

  const quickValues = QUICK_VALUES.filter(v => v <= max)
  const showCounter = max > 8

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-1">{resolvedLabel}</h3>
      <p className="text-sm text-gray-400 mb-6">{getHint(businessType)}</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {quickValues.map(v => (
          <button
            key={v}
            onClick={() => onSelect(v)}
            className={`w-12 h-12 rounded-xl text-base font-semibold border transition-colors
              ${count === v
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50'}`}
          >
            {v}
          </button>
        ))}
      </div>

      {showCounter && (
        <>
          <p className="text-xs text-gray-400 mb-3">{t('otherCount')}</p>
          <div className="flex items-center justify-center gap-6 py-4">
            <button onClick={() => setCount(c => Math.max(1, c - 1))}
              className="w-12 h-12 rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200 flex items-center justify-center">
              −
            </button>
            <div className="text-4xl font-bold text-gray-900 w-16 text-center">{count}</div>
            <button onClick={() => setCount(c => Math.min(max, c + 1))}
              className="w-12 h-12 rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200 flex items-center justify-center">
              +
            </button>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onBack} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              {t('back')}
            </button>
            <button onClick={() => onSelect(count)}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
              {t('next')}
            </button>
          </div>
        </>
      )}

      {!showCounter && (
        <div className="mt-2">
          <button onClick={onBack} className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            {t('back')}
          </button>
        </div>
      )}
    </div>
  )
}
