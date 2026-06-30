import { getTranslations } from 'next-intl/server'
import { getMeta } from '@/lib/businessTypes'

const BG: Record<string, string> = {
  HOTEL: 'from-blue-500 to-blue-700',
  RESTAURANT: 'from-orange-500 to-red-600',
  SALON: 'from-pink-500 to-rose-600',
  COWORKING: 'from-purple-500 to-indigo-700',
  SPORT: 'from-green-500 to-emerald-700',
  MEDICAL: 'from-teal-500 to-cyan-700',
  CUSTOM: 'from-gray-500 to-gray-700',
}

interface Props { business: any }

export default async function BusinessHero({ business }: Props) {
  const t = await getTranslations('Business')
  const meta = getMeta(business.type)
  const bg = BG[business.type] ?? BG.CUSTOM
  const hasCover = Boolean(business.logoUrl)
  const typeLabel = t.has(`typeMeta.${business.type}.label`)
    ? t(`typeMeta.${business.type}.label` as any)
    : t('typeMeta.CUSTOM.label')
  const reviewCount = t('reviews.reviewCount', { count: business.reviewCount })

  if (hasCover) {
    return (
      <div className="rounded-2xl overflow-hidden mb-6 relative">
        {/* Cover photo */}
        <div className="h-52 sm:h-64 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={business.logoUrl} alt={business.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>

        {/* Info overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex items-center gap-1.5 mb-1 opacity-80">
            <span className="text-lg">{meta.icon}</span>
            <span className="text-xs font-semibold uppercase tracking-widest">{typeLabel}</span>
          </div>
          <h1 className="text-2xl font-bold mb-1 drop-shadow-sm">{business.name}</h1>
          {business.avgRating > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-yellow-400 text-sm">{'★'.repeat(Math.round(business.avgRating))}</span>
              <span className="text-sm font-semibold text-white">{business.avgRating.toFixed(1)}</span>
              <span className="text-xs opacity-70">({reviewCount})</span>
            </div>
          )}
          {business.description && (
            <p className="text-sm opacity-90 max-w-lg line-clamp-2">{business.description}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm opacity-90">
            {business.address && <span className="flex items-center gap-1.5">📍 {business.address}</span>}
            {business.phone && <a href={`tel:${business.phone}`} className="flex items-center gap-1.5 hover:opacity-100">📞 {business.phone}</a>}
            {business.email && <a href={`mailto:${business.email}`} className="flex items-center gap-1.5 hover:opacity-100">✉️ {business.email}</a>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br ${bg} rounded-2xl p-6 text-white mb-6 relative overflow-hidden`}>
      <div className="absolute top-0 right-0 text-9xl opacity-10 leading-none select-none pointer-events-none pr-4 pt-2">
        {meta.icon}
      </div>
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{meta.icon}</span>
          <span className="text-xs font-semibold uppercase tracking-widest opacity-80">{typeLabel}</span>
        </div>
        <h1 className="text-2xl font-bold mb-1">{business.name}</h1>
        {business.avgRating > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-yellow-400 text-sm">{'★'.repeat(Math.round(business.avgRating))}</span>
            <span className="text-sm font-semibold text-white">{business.avgRating.toFixed(1)}</span>
            <span className="text-xs opacity-70">({reviewCount})</span>
          </div>
        )}
        {business.description && (
          <p className="text-sm opacity-90 max-w-lg">{business.description}</p>
        )}
        <div className="flex flex-wrap gap-4 mt-4 text-sm opacity-90">
          {business.address && <span className="flex items-center gap-1.5">📍 {business.address}</span>}
          {business.phone && <a href={`tel:${business.phone}`} className="flex items-center gap-1.5 hover:opacity-100">📞 {business.phone}</a>}
          {business.email && <a href={`mailto:${business.email}`} className="flex items-center gap-1.5 hover:opacity-100">✉️ {business.email}</a>}
        </div>
      </div>
    </div>
  )
}
