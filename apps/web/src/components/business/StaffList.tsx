import { getMeta } from '@/lib/businessTypes'

interface Props { resources: any[]; businessType: string }

export default function StaffList({ resources, businessType }: Props) {
  if (!resources?.length) return null
  const meta = getMeta(businessType)

  const showAsStaff = ['SALON', 'MEDICAL'].includes(businessType)
  if (!showAsStaff) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
      <h2 className="font-semibold text-gray-800 mb-3">
        {businessType === 'MEDICAL' ? 'Врачи' : 'Мастера'}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {resources.filter(r => r.isActive).map(r => (
          <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-lg shrink-0">
              {meta.resourceIcon}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-800">{r.name}</div>
              {r.description && <div className="text-xs text-gray-400 mt-0.5">{r.description}</div>}
              {r.schedules?.length > 0 && (
                <div className="text-xs text-green-600 mt-0.5">
                  {r.schedules[0].startTime}–{r.schedules[0].endTime}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
