interface Props { services: any[]; businessType: string }

export default function ServicesList({ services, businessType }: Props) {
  if (!services?.length) return null

  const labels: Record<string, string> = {
    SALON: 'Услуги и цены', MEDICAL: 'Приём и процедуры', SPORT: 'Виды занятий',
    COWORKING: 'Тарифы', RESTAURANT: 'Бронирование', HOTEL: 'Категории', CUSTOM: 'Услуги',
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
      <h2 className="font-semibold text-gray-800 mb-3">{labels[businessType] ?? 'Услуги'}</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {services.map(s => (
          <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors">
            <div>
              <div className="text-sm font-medium text-gray-800">{s.name}</div>
              {s.description && <div className="text-xs text-gray-400 mt-0.5">{s.description}</div>}
              <div className="text-xs text-gray-400 mt-0.5">{s.durationMinutes} мин</div>
            </div>
            <div className="text-sm font-bold text-blue-700 ml-4 shrink-0">
              {Number(s.price) > 0 ? `${Number(s.price).toLocaleString('ru')} с` : 'Бесплатно'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
