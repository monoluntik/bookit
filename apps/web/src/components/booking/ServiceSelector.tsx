'use client'

interface Props {
  services: any[]
  onSelect: (service: any) => void
  onSkip: () => void
  onBack: () => void
}

export default function ServiceSelector({ services, onSelect, onSkip, onBack }: Props) {
  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-4">Выберите услугу</h3>
      <div className="space-y-2 mb-4">
        {services.map(s => (
          <button key={s.id} onClick={() => onSelect(s)}
            className="w-full text-left p-4 rounded-2xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors group">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-gray-900 group-hover:text-blue-700">{s.name}</div>
                {s.description && <div className="text-sm text-gray-400 mt-0.5">{s.description}</div>}
              </div>
              <div className="text-right shrink-0 ml-4">
                <div className="text-sm font-semibold text-blue-700">{Number(s.price).toLocaleString('ru')} сом</div>
                <div className="text-xs text-gray-400">{s.durationMinutes} мин</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
          ← Назад
        </button>
        <button onClick={onSkip} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
          Пропустить
        </button>
      </div>
    </div>
  )
}
