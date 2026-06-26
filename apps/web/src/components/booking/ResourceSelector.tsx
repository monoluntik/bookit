'use client'

interface Props {
  resources: any[]
  onSelect: (resource: any) => void
  label?: string
  resourceIcon?: string
}

export default function ResourceSelector({ resources, onSelect, label = 'Ресурс', resourceIcon = '📋' }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Выберите {label.toLowerCase()}</h2>
      <div className="grid gap-3">
        {resources.filter(r => r.isActive !== false).map((r) => (
          <button
            key={r.id}
            onClick={() => onSelect(r)}
            className="text-left p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{resourceIcon}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-900 group-hover:text-blue-700">{r.name}</div>
                {r.description && <div className="text-sm text-gray-500 mt-0.5">{r.description}</div>}
                {r.capacity && r.capacity > 1 && (
                  <div className="text-xs text-gray-400 mt-0.5">до {r.capacity} чел.</div>
                )}
                {r.schedules?.length > 0 && (
                  <div className="text-xs text-green-600 mt-1">
                    {r.schedules[0].startTime}–{r.schedules[0].endTime}
                  </div>
                )}
              </div>
              <span className="text-blue-400 group-hover:text-blue-600">→</span>
            </div>
          </button>
        ))}
        {resources.filter(r => r.isActive !== false).length === 0 && (
          <div className="text-center py-8 text-gray-400">Нет доступных ресурсов</div>
        )}
      </div>
    </div>
  )
}
