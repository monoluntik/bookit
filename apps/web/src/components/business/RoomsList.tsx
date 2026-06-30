import { getTranslations } from 'next-intl/server'
import { getMeta } from '@/lib/businessTypes'

interface Props { resources: any[]; businessType: string }

export default async function RoomsList({ resources, businessType }: Props) {
  if (!resources?.length) return null
  if (!['HOTEL', 'COWORKING'].includes(businessType)) return null

  const t = await getTranslations('Business')
  const meta = getMeta(businessType)
  const info = businessType === 'HOTEL'
    ? { title: t('rooms.title'), capacityLabel: t('rooms.capacityLabel') }
    : businessType === 'COWORKING'
      ? { title: t('rooms.titleCoworking'), capacityLabel: t('rooms.capacityLabelCoworking') }
      : { title: t('rooms.titleDefault'), capacityLabel: t('rooms.capacityLabelDefault') }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
      <h2 className="font-semibold text-gray-800 mb-3">{info.title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {resources.filter(r => r.isActive).map(r => (
          <div key={r.id} className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium text-gray-800 flex items-center gap-2">
                  <span>{meta.resourceIcon}</span> {r.name}
                </div>
                {r.description && <div className="text-xs text-gray-400 mt-1">{r.description}</div>}
              </div>
              {r.capacity && r.capacity > 1 && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full shrink-0">
                  {t('rooms.upTo', { count: r.capacity, label: info.capacityLabel })}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
