'use client'

import { useTranslations } from 'next-intl'

interface Props {
  options: number[]
  onSelect: (minutes: number) => void
  onBack: () => void
}

export default function DurationStep({ options, onSelect, onBack }: Props) {
  const t = useTranslations('Booking.duration')

  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) return t('minutes', { count: minutes })
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (m === 0) return t('hours', { count: h })
    if (m === 30) return t('hoursHalf', { hours: h })
    return t('hoursMinutes', { hours: h, minutes: m })
  }

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-1">{t('title')}</h3>
      <p className="text-sm text-gray-400 mb-6">{t('subtitle')}</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {options.map(minutes => (
          <button
            key={minutes}
            onClick={() => onSelect(minutes)}
            className="py-4 px-3 rounded-xl border border-gray-200 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors group"
          >
            <div className="text-xl font-bold text-gray-900 group-hover:text-blue-700">
              {formatMinutes(minutes)}
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center mb-4">{t('priceCalculatedOnSite')}</p>

      <button onClick={onBack}
        className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
        {t('back')}
      </button>
    </div>
  )
}
