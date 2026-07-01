import { getTranslations } from 'next-intl/server'

interface Props { services: any[]; businessType: string }

export default async function ServicesList({ services, businessType }: Props) {
  if (!services?.length) return null

  const t = await getTranslations('Business')
  const titleKeys: Record<string, string> = {
    SALON: 'services.titleSalon', MEDICAL: 'services.titleMedical', SPORT: 'services.titleSport',
    COWORKING: 'services.titleCoworking', RESTAURANT: 'services.titleRestaurant',
    HOTEL: 'services.titleHotel', CUSTOM: 'services.titleCustom',
  }
  const titleKey = titleKeys[businessType] ?? 'services.titleDefault'

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
      <h2 className="font-semibold text-gray-800 mb-3">{t(titleKey as any)}</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {services.map(s => (
          <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors">
            <div>
              <div className="text-sm font-medium text-gray-800">{s.name}</div>
              {s.description && <div className="text-xs text-gray-400 mt-0.5">{s.description}</div>}
              <div className="text-xs text-gray-400 mt-0.5">{t('services.durationMinutes', { minutes: s.durationMinutes })}</div>
            </div>
            <div className="text-right ml-4 shrink-0">
              <div className="text-sm font-bold text-blue-700">
                {Number(s.price) > 0 ? `${Number(s.price).toLocaleString('ru')} ${t('services.currency')}` : t('services.free')}
              </div>
              {s.depositAmount && Number(s.depositAmount) > 0 && (
                <div className="mt-1">
                  <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    {t('services.depositBadge', { amount: Number(s.depositAmount).toLocaleString('ru') })}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
