'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

const TYPE_ICONS: Record<string, string> = {
  HOTEL: '🏨', RESTAURANT: '🍽️', SALON: '💇', COWORKING: '💼', SPORT: '⚽', MEDICAL: '🏥', CUSTOM: '🏢',
}
const TYPE_CARD_KEYS = ['HOTEL', 'RESTAURANT', 'SALON', 'COWORKING', 'SPORT', 'MEDICAL', 'CUSTOM']
const TYPE_BG: Record<string, string> = {
  HOTEL: 'from-blue-100 to-blue-200',
  RESTAURANT: 'from-orange-100 to-red-100',
  SALON: 'from-pink-100 to-rose-100',
  COWORKING: 'from-purple-100 to-indigo-100',
  SPORT: 'from-green-100 to-emerald-100',
  MEDICAL: 'from-teal-100 to-cyan-100',
  CUSTOM: 'from-gray-100 to-gray-200',
}

interface Props {
  business: any
}

export default function BusinessCard({ business }: Props) {
  const t = useTranslations('Explore')
  const hasCover = Boolean(business.logoUrl)
  const rating = business.avgRating as number | undefined
  const reviewCount = business.reviewCount as number | undefined

  return (
    <Link href={`/b/${business.slug}`}
      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group border border-transparent hover:border-blue-100 flex flex-col">

      {/* Cover */}
      <div className={`h-40 relative overflow-hidden shrink-0 ${!hasCover ? `bg-gradient-to-br ${TYPE_BG[business.type] ?? TYPE_BG.CUSTOM}` : ''}`}>
        {hasCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logoUrl}
            alt={business.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-60">
            {TYPE_ICONS[business.type] ?? '🏢'}
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span className="text-xs bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-0.5 rounded-full font-medium shadow-sm">
            {TYPE_CARD_KEYS.includes(business.type) ? t(`cardTypes.${business.type}`) : business.type}
          </span>
        </div>

        {/* Rating badge */}
        {rating !== undefined && rating > 0 && (
          <div className="absolute top-2 right-2">
            <span className="text-xs bg-white/90 backdrop-blur-sm text-gray-800 px-2 py-0.5 rounded-full font-semibold shadow-sm flex items-center gap-1">
              <span className="text-amber-400">★</span>
              {rating.toFixed(1)}
              {reviewCount ? <span className="text-gray-400 font-normal">({reviewCount})</span> : null}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-tight line-clamp-1">
          {business.name}
        </h3>
        {business.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2 flex-1">{business.description}</p>
        )}
        {business.address && (
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1 truncate">
            <span>📍</span><span className="truncate">{business.address}</span>
          </p>
        )}
        <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-blue-600 font-medium group-hover:text-blue-700">
          {t('bookCta')} →
        </div>
      </div>
    </Link>
  )
}
