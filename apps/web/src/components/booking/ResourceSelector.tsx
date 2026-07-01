'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface Props {
  resources: any[]
  onSelect: (resource: any) => void
  onBack?: () => void
  label?: string
  resourceIcon?: string
  businessType?: string
  minCapacity?: number
}

export default function ResourceSelector({
  resources,
  onSelect,
  onBack,
  label,
  resourceIcon = '📋',
  businessType,
  minCapacity,
}: Props) {
  const t = useTranslations('Booking.resourceSelector')
  const resolvedLabel = label ?? t('defaultLabel')
  const active = resources.filter(r => r.isActive !== false)
  const filtered = minCapacity && minCapacity > 0
    ? active.filter(r => !r.capacity || r.capacity >= minCapacity)
    : active

  useEffect(() => {
    if (filtered.length === 1) {
      onSelect(filtered[0])
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (filtered.length === 1) {
    return null
  }

  if (filtered.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('selectLabel', { label: resolvedLabel.toLowerCase() })}</h2>
        <div className="text-center py-10 bg-gray-50 rounded-xl">
          <div className="text-3xl mb-3">😔</div>
          <p className="text-gray-600 font-medium text-sm">
            {t('noTablesForGuests', { count: minCapacity ?? 0 })}
          </p>
          <p className="text-xs text-gray-400 mt-1">{t('tryFewerGuests')}</p>
          {onBack && (
            <button onClick={onBack}
              className="mt-4 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              {t('back')}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('selectLabel', { label: resolvedLabel.toLowerCase() })}</h2>
      <div className="grid gap-3">
        {filtered.map((r) => (
          <button
            key={r.id}
            onClick={() => onSelect(r)}
            className="text-left p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{resourceIcon}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-900 group-hover:text-blue-700">{r.name}</div>
                {r.description && (
                  <div className="text-sm text-gray-500 mt-0.5">
                    {businessType === 'MEDICAL' && <span className="text-gray-400">{t('specialization')}</span>}
                    {r.description}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {r.capacity && r.capacity > 1 && (
                    <span className={`text-xs ${businessType === 'HOTEL' ? 'bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full' : 'text-gray-400'}`}>
                      {businessType === 'HOTEL' ? t('upToGuestsHotel', { count: r.capacity }) : t('upToGuests', { count: r.capacity })}
                    </span>
                  )}
                  {r.schedules?.length > 0 && (
                    <span className="text-xs text-green-600">
                      {r.schedules[0].startTime}–{r.schedules[0].endTime}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                {r.basePrice && (
                  <div className="text-sm font-semibold text-blue-700">
                    {t('fromPrice', { price: Number(r.basePrice).toLocaleString('ru') })}
                  </div>
                )}
                {r.depositAmount && Number(r.depositAmount) > 0 && (
                  <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    {t('depositBadge', { amount: Number(r.depositAmount).toLocaleString('ru') })}
                  </span>
                )}
                <span className="text-blue-400 group-hover:text-blue-600 block mt-1">→</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
