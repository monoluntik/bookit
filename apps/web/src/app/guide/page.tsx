import Link from 'next/link'
import SmartNav from '@/components/SmartNav'

// ─── Shared UI mock components ───────────────────────────────────────────────

function MockWindow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-md bg-white">
      <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <span className="ml-2 text-xs text-gray-400 font-mono">{title}</span>
      </div>
      {children}
    </div>
  )
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {children}
    </span>
  )
}

// ─── Visual mocks ─────────────────────────────────────────────────────────────

function MockExplore() {
  const cards = [
    { name: 'Салон Oasis', type: 'SALON', rating: '4.8', reviews: 12 },
    { name: 'FitZone', type: 'SPORT', rating: '4.6', reviews: 8 },
    { name: 'Dr. Asanov', type: 'MEDICAL', rating: '5.0', reviews: 21 },
  ]
  return (
    <MockWindow title="booking.kg/explore">
      <div className="p-4 bg-gray-50">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-400 flex items-center gap-1.5">
            <span>🔍</span> Поиск заведений...
          </div>
          <button className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500">Фильтры</button>
        </div>
        <div className="flex gap-2 mb-3 overflow-hidden">
          {['Все', 'Салоны', 'Спорт', 'Медицина'].map((t, i) => (
            <span key={t} className={`shrink-0 text-xs px-3 py-1 rounded-full font-medium ${i === 0 ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
              {t}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {cards.map(c => (
            <div key={c.name} className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="h-16 bg-gradient-to-br from-blue-400 to-indigo-500 relative">
                <span className="absolute top-1 right-1 bg-white/90 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-amber-600">
                  ★ {c.rating}
                </span>
              </div>
              <div className="p-1.5">
                <div className="text-[11px] font-semibold text-gray-800 truncate">{c.name}</div>
                <div className="text-[10px] text-gray-400">{c.reviews} отзывов</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MockWindow>
  )
}

function MockBookingFlow() {
  return (
    <MockWindow title="booking.kg/b/salon-oasis">
      <div className="p-4 space-y-3">
        {/* Steps */}
        <div className="flex gap-1">
          {['Услуга', 'Дата', 'Время', 'Готово'].map((s, i) => (
            <div key={s} className={`flex-1 text-center text-[10px] font-medium py-1 rounded-lg ${i === 1 ? 'bg-blue-600 text-white' : i < 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
              {i < 1 ? '✓' : s}
            </div>
          ))}
        </div>
        {/* Calendar mini */}
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">Июнь 2026</span>
            <div className="flex gap-1">
              <button className="w-5 h-5 bg-white border border-gray-200 rounded-md text-xs text-gray-500">‹</button>
              <button className="w-5 h-5 bg-white border border-gray-200 rounded-md text-xs text-gray-500">›</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => <div key={d} className="text-center text-[9px] text-gray-400">{d}</div>)}
            {[null,null,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30].map((d, i) => (
              <div key={i} className={`text-center text-[10px] w-5 h-5 mx-auto flex items-center justify-center rounded-full
                ${d === 26 ? 'bg-blue-600 text-white font-bold' : d && d > 20 ? 'hover:bg-blue-50 cursor-pointer text-gray-600' : 'text-gray-400'}`}>
                {d}
              </div>
            ))}
          </div>
        </div>
        <div className="text-[10px] text-gray-400 text-center">Выбрана дата: 26 июня</div>
      </div>
    </MockWindow>
  )
}

function MockSlots() {
  const slots = ['09:00', '10:00', '11:00', '13:00', '14:00', '16:00']
  return (
    <MockWindow title="Выбор времени">
      <div className="p-4">
        <div className="text-xs font-semibold text-gray-600 mb-3">Доступные слоты — Пт, 26 июня</div>
        <div className="grid grid-cols-3 gap-2">
          {slots.map((s, i) => (
            <button key={s} className={`py-2 rounded-xl text-xs font-semibold border transition-colors
              ${i === 2 ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'}`}>
              {s}
              <div className="text-[9px] font-normal opacity-70 mt-0.5">60 мин</div>
            </button>
          ))}
        </div>
        <button className="w-full mt-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">
          Выбрать 11:00
        </button>
      </div>
    </MockWindow>
  )
}

function MockDashboard() {
  return (
    <MockWindow title="booking.kg/dashboard">
      <div className="flex min-h-40">
        {/* Sidebar */}
        <div className="w-28 bg-gray-50 border-r border-gray-100 p-2 space-y-0.5">
          {[['▦', 'Обзор'], ['📅', 'Брони'], ['🪑', 'Ресурсы'], ['✂️', 'Услуги'], ['⚙️', 'Настройки']].map(([icon, label], i) => (
            <div key={label} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium
              ${i === 1 ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}>
              <span>{icon}</span>{label}
            </div>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 p-3">
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[['12', 'Брони сегодня', 'text-blue-600'], ['5', 'Ожидают', 'text-amber-600'], ['89 400с', 'Выручка', 'text-green-600']].map(([v, l, c]) => (
              <div key={l} className="bg-gray-50 rounded-xl p-2 text-center">
                <div className={`text-sm font-bold ${c}`}>{v}</div>
                <div className="text-[9px] text-gray-400">{l}</div>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            {[
              { time: '09:00', name: 'Элдияр Н.', status: 'CONFIRMED' },
              { time: '10:00', name: 'Руслан М.', status: 'PENDING' },
              { time: '11:00', name: 'Манас Б. (вручную)', status: 'MANUAL' },
            ].map(b => (
              <div key={b.time} className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-2 py-1.5">
                <span className="text-[10px] font-mono text-gray-400 w-8">{b.time}</span>
                <span className="flex-1 text-[10px] font-medium text-gray-700 truncate">{b.name}</span>
                <Pill color={b.status === 'CONFIRMED' ? 'bg-green-50 text-green-700' : b.status === 'MANUAL' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'}>
                  {b.status === 'CONFIRMED' ? 'Подтв.' : b.status === 'MANUAL' ? 'вручную' : 'Ожидает'}
                </Pill>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockWindow>
  )
}

function MockCalendar() {
  return (
    <MockWindow title="Календарь броней">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-700">Июнь 2026</span>
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
            <button className="text-[10px] px-2 py-0.5 rounded bg-white text-gray-700 shadow-sm">Список</button>
            <button className="text-[10px] px-2 py-0.5 rounded text-gray-400">Календарь</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
            <div key={d} className="text-center text-[9px] text-gray-400 py-1">{d}</div>
          ))}
          {Array.from({length: 30}, (_, i) => {
            const day = i + 1
            const hasBookings = [3,4,9,10,11,16,17,23,25,26,27].includes(day)
            const isToday = day === 26
            return (
              <div key={day} className={`h-10 border border-gray-50 rounded-lg p-0.5 flex flex-col ${hasBookings ? 'bg-blue-50 cursor-pointer' : ''}`}>
                <span className={`text-[10px] font-medium w-4 h-4 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>
                  {day}
                </span>
                {hasBookings && (
                  <div className={`text-[8px] px-0.5 rounded truncate mt-0.5 ${isToday ? 'bg-blue-500 text-white' : 'bg-blue-200 text-blue-700'}`}>
                    {[26,27].includes(day) ? '5 броней' : '2 брони'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </MockWindow>
  )
}

function MockOwnerBooking() {
  return (
    <MockWindow title="Добавить вручную">
      <div className="p-4">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-4">
          <button className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold bg-white shadow-sm text-gray-800">
            👤 Бронь клиента
          </button>
          <button className="flex-1 py-1.5 rounded-lg text-[11px] font-medium text-gray-400">
            🔒 Заблокировать
          </button>
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">Ресурс</label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] text-gray-600">
              Мастер Аида ▾
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">Имя клиента</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] text-gray-700">Айгуль А.</div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">Телефон</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] text-gray-700">+996 700...</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">Дата</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] text-gray-600">26.06</div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">Начало</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] text-gray-600">11:00</div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">Конец</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] text-gray-600">12:00</div>
            </div>
          </div>
          <button className="w-full py-1.5 bg-blue-600 text-white rounded-xl text-[11px] font-semibold">✓ Добавить бронь</button>
        </div>
      </div>
    </MockWindow>
  )
}

function MockScheduleBlock() {
  return (
    <MockWindow title="Выходные и отпуска">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-semibold text-gray-800">Мастер Аида</div>
            <div className="text-[10px] text-gray-400">Салон Oasis</div>
          </div>
          <button className="text-[11px] bg-blue-600 text-white px-3 py-1 rounded-lg font-medium">+ Добавить</button>
        </div>
        <div className="space-y-2">
          {[
            { date: '28 июня', label: 'Выходной', reason: 'Отпуск', color: 'bg-red-50 text-red-600', icon: '🔒' },
            { date: '5 июля', label: 'Особые часы', reason: '10:00–15:00', color: 'bg-amber-50 text-amber-600', icon: '⏰' },
            { date: '10 июля', label: 'Выходной', reason: 'Праздник', color: 'bg-red-50 text-red-600', icon: '🔒' },
          ].map(e => (
            <div key={e.date} className="flex items-center gap-2 bg-gray-50 rounded-xl px-2.5 py-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm ${e.color}`}>{e.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-gray-700">{e.date}</div>
                <div className="text-[10px] text-gray-400">{e.label} · {e.reason}</div>
              </div>
              <button className="text-[10px] text-red-400 border border-red-100 rounded-full px-2 py-0.5">Удалить</button>
            </div>
          ))}
        </div>
      </div>
    </MockWindow>
  )
}

function MockStats() {
  const bars = [40, 70, 55, 90, 65, 80, 45]
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  return (
    <MockWindow title="Аналитика">
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[['142 500 с', 'Выручка за месяц', 'text-green-600', '↑ 18%'], ['87', 'Броней за месяц', 'text-blue-600', '↑ 12%']].map(([v, l, c, g]) => (
            <div key={l} className="bg-gray-50 rounded-xl p-2.5">
              <div className={`text-sm font-bold ${c}`}>{v}</div>
              <div className="text-[9px] text-gray-400 mt-0.5">{l}</div>
              <div className="text-[9px] text-green-500 font-semibold mt-0.5">{g}</div>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-gray-500 mb-1.5">Брони по дням недели</div>
        <div className="flex items-end gap-1 h-16">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full bg-blue-500 rounded-t-sm" style={{ height: `${h}%` }} />
              <span className="text-[8px] text-gray-400">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </MockWindow>
  )
}

function MockSettings() {
  return (
    <MockWindow title="Настройки бизнеса">
      <div className="p-4 space-y-3">
        <div>
          <label className="text-[10px] text-gray-500 block mb-0.5">Название</label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700">Салон красоты Oasis</div>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-0.5">Ваша ссылка</label>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5 text-[11px] text-blue-700 font-mono">
            booking.kg/b/salon-oasis
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 block mb-0.5">Тип</label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700">Салон красоты ▾</div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 block mb-0.5">Часовой пояс</label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700">Asia/Bishkek ▾</div>
          </div>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">Логотип и галерея</label>
          <div className="flex gap-1.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-lg">💇</div>
            {[1,2,3].map(i => (
              <div key={i} className="w-12 h-12 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-lg">+</div>
            ))}
          </div>
        </div>
        <button className="w-full py-1.5 bg-blue-600 text-white rounded-xl text-[11px] font-semibold">Сохранить изменения</button>
      </div>
    </MockWindow>
  )
}

function MockReview() {
  return (
    <MockWindow title="Отзывы">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">4.8</div>
            <div className="text-amber-400 text-sm">★★★★★</div>
            <div className="text-[10px] text-gray-400">33 отзыва</div>
          </div>
          <div className="flex-1 space-y-1">
            {[5,4,3,2,1].map(r => (
              <div key={r} className="flex items-center gap-1.5">
                <span className="text-[9px] text-gray-400 w-2">{r}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${r===5?75:r===4?18:r===3?5:2}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {[
          { name: 'Айгуль М.', rating: 5, text: 'Отличный сервис! Мастер Аида — профессионал.' },
          { name: 'Манас Б.', rating: 4, text: 'Удобно бронировать, пришёл без очереди.' },
        ].map(r => (
          <div key={r.name} className="border-t border-gray-100 pt-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">{r.name[0]}</div>
              <span className="text-[10px] font-semibold text-gray-700">{r.name}</span>
              <span className="text-amber-400 text-[10px]">{'★'.repeat(r.rating)}</span>
            </div>
            <p className="text-[10px] text-gray-500 ml-6">{r.text}</p>
          </div>
        ))}
      </div>
    </MockWindow>
  )
}

function MockCancellationPolicy() {
  return (
    <MockWindow title="Политика отмены">
      <div className="p-4 space-y-3">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
          <div className="text-[11px] font-semibold text-amber-800 mb-1">Текущая политика</div>
          <div className="space-y-1 text-[10px] text-amber-700">
            <div>✓ Бесплатная отмена за 24ч</div>
            <div>✓ Штраф 30% при отмене за 12–24ч</div>
            <div>✗ Без возврата при отмене позднее 12ч</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            ['Бесплатная отмена (часов)', '24'],
            ['Штраф за позднюю отмену (%)', '30'],
            ['Без возврата (часов до)', '12'],
          ].map(([label, val]) => (
            <div key={label}>
              <label className="text-[10px] text-gray-500 block mb-0.5">{label}</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700">{val}</div>
            </div>
          ))}
        </div>
        <button className="w-full py-1.5 bg-blue-600 text-white rounded-xl text-[11px] font-semibold">Сохранить политику</button>
      </div>
    </MockWindow>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  id, badge, title, desc, children, reverse = false, bg = 'bg-white',
}: {
  id: string; badge: string; title: string; desc: string
  children: [React.ReactNode, React.ReactNode]; reverse?: boolean; bg?: string
}) {
  const [text, visual] = children
  return (
    <section id={id} className={`${bg} py-16 scroll-mt-24`}>
      <div className={`max-w-5xl mx-auto px-4 flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-10`}>
        <div className="flex-1">
          <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">{badge}</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">{title}</h2>
          <p className="text-gray-500 leading-relaxed">{desc}</p>
          <div className="mt-5 space-y-2">{text}</div>
        </div>
        <div className="flex-1 w-full">{visual}</div>
      </div>
    </section>
  )
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-gray-600">
      <span className="mt-0.5 w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-[10px] font-bold">✓</span>
      <span>{children}</span>
    </div>
  )
}

// ─── Table of contents ────────────────────────────────────────────────────────

const TOC_BUSINESS = [
  { id: 'setup', label: 'Настройка бизнеса' },
  { id: 'bookings', label: 'Управление бронями' },
  { id: 'calendar', label: 'Календарь' },
  { id: 'manual', label: 'Ручное бронирование' },
  { id: 'schedule', label: 'Выходные и отпуска' },
  { id: 'stats', label: 'Аналитика' },
  { id: 'policy', label: 'Политика отмены' },
]

const TOC_CUSTOMER = [
  { id: 'explore', label: 'Поиск и фильтры' },
  { id: 'booking-flow', label: 'Процесс бронирования' },
  { id: 'slots', label: 'Выбор времени' },
  { id: 'reviews', label: 'Отзывы' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-white">
      <SmartNav />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            📖 Полный гайд по платформе
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-5 leading-tight">
            Всё что умеет<br /><span className="text-blue-600">Booking</span>
          </h1>
          <p className="text-lg text-gray-500 mb-8">
            Пошаговый обзор каждой функции — для владельцев бизнеса и для клиентов.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#business" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors">
              Я владелец бизнеса
            </a>
            <a href="#customer" className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-colors">
              Я клиент
            </a>
          </div>
        </div>
      </section>

      {/* Sticky TOC */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-2 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            <span className="text-xs font-semibold text-gray-400 mr-2">Для бизнеса:</span>
            {TOC_BUSINESS.map(t => (
              <a key={t.id} href={`#${t.id}`}
                className="text-xs px-3 py-1.5 rounded-full text-gray-500 hover:bg-blue-50 hover:text-blue-700 transition-colors whitespace-nowrap">
                {t.label}
              </a>
            ))}
            <span className="text-gray-200 mx-2">|</span>
            <span className="text-xs font-semibold text-gray-400 mr-2">Для клиента:</span>
            {TOC_CUSTOMER.map(t => (
              <a key={t.id} href={`#${t.id}`}
                className="text-xs px-3 py-1.5 rounded-full text-gray-500 hover:bg-green-50 hover:text-green-700 transition-colors whitespace-nowrap">
                {t.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          BUSINESS OWNER SECTION
      ════════════════════════════════════════════ */}
      <div id="business" className="scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl">🏢</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Для владельца бизнеса</h2>
              <p className="text-gray-400 text-sm">Управляйте бизнесом, бронями и расписанием в одном месте</p>
            </div>
          </div>
        </div>
      </div>

      <Section id="setup" badge="Шаг 1 · Настройка" bg="bg-white"
        title="Создайте профиль бизнеса за 5 минут"
        desc="Укажите название, тип заведения, адрес и получите уникальную ссылку-страницу бронирования. Добавьте логотип и до 10 фото для галереи — это повышает доверие клиентов.">
        {[
          <>
            <Check>Уникальный slug-адрес: <code className="bg-gray-100 px-1 rounded text-blue-600">booking.kg/b/ваш-бизнес</code></Check>
            <Check>Автогенерация slug из названия с ручным редактированием</Check>
            <Check>Типы: Салон, Ресторан, Отель, Коворкинг, Спорт, Медицина</Check>
            <Check>Загрузка логотипа и галереи до 10 фото (drag & drop)</Check>
            <Check>Часовой пояс, телефон, адрес, описание</Check>
          </>,
          <MockSettings />,
        ]}
      </Section>

      <Section id="bookings" badge="Шаг 2 · Брони" bg="bg-gray-50" reverse
        title="Все брони в одном дашборде"
        desc="Список текущих бронирований с фильтрами по статусу и дате. Подтверждайте, завершайте или отменяйте брони в один клик. Переносите брони на другое время прямо из карточки.">
        {[
          <>
            <Check>Статусы: Ожидает → Подтверждена → Завершена / Не пришёл</Check>
            <Check>Фильтр по дате и статусу</Check>
            <Check>Перенос брони: выбор новой даты и времени с проверкой конфликтов</Check>
            <Check>Имя, телефон и email клиента в каждой карточке</Check>
            <Check>Отображение оплаченных броней (сумма, дата оплаты)</Check>
          </>,
          <MockDashboard />,
        ]}
      </Section>

      <Section id="calendar" badge="Вид · Календарь" bg="bg-white"
        title="Визуальный календарь загрузки"
        desc="Переключитесь в режим Calendar и видите все брони месяца с цветовой кодировкой по статусу. Кликните на день — и получите список броней за эту дату.">
        {[
          <>
            <Check>Цвета: жёлтый (ожидает), синий (подтверждена), зелёный (завершена), серый (блок)</Check>
            <Check>Клик по дате переключает в список с фильтром на этот день</Check>
            <Check>Навигация по месяцам вперёд и назад</Check>
            <Check>Блокировки времени отображаются отдельно иконкой 🔒</Check>
          </>,
          <MockCalendar />,
        ]}
      </Section>

      <Section id="manual" badge="Функция · Ручное бронирование" bg="bg-gray-50" reverse
        title="Добавьте бронь вручную или заблокируйте время"
        desc="Клиент позвонил или пришёл лично? Внесите его бронь вручную прямо из дашборда. Нужно закрыть час для технических нужд? Поставьте блокировку — слот исчезнет из онлайн-записи.">
        {[
          <>
            <Check>Режим «Бронь клиента»: имя, телефон, услуга, дата и время</Check>
            <Check>Режим «Заблокировать»: время становится недоступным для клиентов</Check>
            <Check>Ручные брони помечаются бейджем «вручную» в дашборде</Check>
            <Check>Блокировки удаляются одной кнопкой, брони можно переносить</Check>
            <Check>Конфликт-проверка: нельзя создать перекрывающую запись</Check>
          </>,
          <MockOwnerBooking />,
        ]}
      </Section>

      <Section id="schedule" badge="Функция · Расписание" bg="bg-white"
        title="Выходные и отпуска для каждого мастера"
        desc="Задайте для любого ресурса или мастера конкретные даты-исключения: полный выходной (клиенты не смогут забронировать) или сокращённый день с другими рабочими часами.">
        {[
          <>
            <Check>Выходной день: слот полностью исчезает из онлайн-записи</Check>
            <Check>Особые часы: временно заменяют стандартное расписание</Check>
            <Check>Причина (опционально): «отпуск», «болезнь», «праздник»</Check>
            <Check>Предстоящие и прошедшие исключения разделены на вкладки</Check>
            <Check>Существующие брони не отменяются автоматически</Check>
          </>,
          <MockScheduleBlock />,
        ]}
      </Section>

      <Section id="stats" badge="Аналитика" bg="bg-gray-50" reverse
        title="Статистика и выручка в реальном времени"
        desc="Дашборд показывает ключевые метрики бизнеса: выручку, количество броней, загрузку по дням недели и популярные услуги. Сравнивайте текущий месяц с прошлым.">
        {[
          <>
            <Check>Выручка за месяц и сравнение с предыдущим периодом</Check>
            <Check>Количество броней, подтверждённых, завершённых</Check>
            <Check>График загрузки по дням недели</Check>
            <Check>Топ-5 популярных услуг с процентом от выручки</Check>
            <Check>Фильтр по бизнесу (если у вас несколько заведений)</Check>
          </>,
          <MockStats />,
        ]}
      </Section>

      <Section id="policy" badge="Настройка · Отмена" bg="bg-white"
        title="Политика отмены бронирований"
        desc="Настройте правила отмены: бесплатный период, размер штрафа и окно «без возврата». Клиент видит эту политику перед подтверждением отмены.">
        {[
          <>
            <Check>Бесплатная отмена: укажите за сколько часов до начала</Check>
            <Check>Штраф в процентах при поздней отмене</Check>
            <Check>Окно «без возврата» — за сколько часов оплата не возвращается</Check>
            <Check>Клиент видит политику в модальном окне перед отменой</Check>
            <Check>Политика применяется ко всем бронированиям этого бизнеса</Check>
          </>,
          <MockCancellationPolicy />,
        ]}
      </Section>

      {/* ════════════════════════════════════════════
          CUSTOMER SECTION
      ════════════════════════════════════════════ */}
      <div id="customer" className="scroll-mt-20 bg-green-50">
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-2xl flex items-center justify-center text-white text-xl">👤</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Для клиента</h2>
              <p className="text-gray-400 text-sm">Найдите заведение и забронируйте за 30 секунд</p>
            </div>
          </div>
        </div>
      </div>

      <Section id="explore" badge="Шаг 1 · Поиск" bg="bg-green-50"
        title="Найдите заведение с удобными фильтрами"
        desc="Каталог всех заведений с поиском по названию, фильтром по типу, рейтингу, наличию фото и возможности онлайн-записи. Сортировка по новизне, рейтингу и алфавиту.">
        {[
          <>
            <Check>Поиск по названию и описанию в реальном времени</Check>
            <Check>Фильтр по категории: Салон, Ресторан, Отель, Спорт…</Check>
            <Check>Фильтр по рейтингу: от 3★, 4★, 4.5★</Check>
            <Check>Переключатель «Есть фото» и «Онлайн-запись»</Check>
            <Check>Сортировка: новые, по рейтингу, А–Я, Я–А</Check>
            <Check>Активные фильтры отображаются тегами с кнопкой ×</Check>
          </>,
          <MockExplore />,
        ]}
      </Section>

      <Section id="booking-flow" badge="Шаг 2 · Бронирование" bg="bg-white" reverse
        title="Пошаговый процесс бронирования"
        desc="Адаптивный мастер бронирования ведёт клиента через выбор услуги, мастера, даты и времени. На каждом шаге — понятные подсказки и возможность вернуться назад.">
        {[
          <>
            <Check>Шаги: Услуга → Мастер/ресурс → Дата → Время → Подтверждение</Check>
            <Check>Для отелей: выбор диапазона дат заезда/выезда</Check>
            <Check>Для ресторанов: количество гостей</Check>
            <Check>Email-подтверждение клиенту после бронирования</Check>
            <Check>Онлайн-оплата через Bakai PayLink (если настроено бизнесом)</Check>
          </>,
          <MockBookingFlow />,
        ]}
      </Section>

      <Section id="slots" badge="Шаг 3 · Слоты" bg="bg-gray-50"
        title="Выбор времени с живыми слотами"
        desc="Только реально свободные слоты — система автоматически убирает занятые интервалы, выходные дни и заблокированное время. Показывает длительность каждого слота.">
        {[
          <>
            <Check>Слоты генерируются из расписания мастера в реальном времени</Check>
            <Check>Занятые, прошедшие и заблокированные слоты скрыты</Check>
            <Check>Выходные дни и особые часы учитываются автоматически</Check>
            <Check>Под каждым слотом — длительность услуги</Check>
            <Check>Если слотов нет — понятное сообщение с предложением выбрать другую дату</Check>
          </>,
          <MockSlots />,
        ]}
      </Section>

      <Section id="reviews" badge="После визита · Отзывы" bg="bg-white" reverse
        title="Оставьте отзыв после визита"
        desc="После завершённой брони клиент может оставить рейтинг и комментарий. Отзывы видны всем на странице заведения. Владелец может ответить на каждый отзыв.">
        {[
          <>
            <Check>Рейтинг 1–5 звёзд и текстовый комментарий</Check>
            <Check>Один отзыв на одно посещение — защита от накрутки</Check>
            <Check>Средний рейтинг отображается на карточке в каталоге</Check>
            <Check>Владелец может публично ответить на отзыв</Check>
            <Check>Гистограмма распределения оценок на странице заведения</Check>
          </>,
          <MockReview />,
        ]}
      </Section>

      {/* CTA */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Готовы начать?
          </h2>
          <p className="text-blue-200 mb-8">
            Зарегистрируйтесь бесплатно и настройте онлайн-запись за один день.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-colors shadow-lg">
              Подключить бизнес бесплатно →
            </Link>
            <Link href="/explore"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-500 text-white rounded-2xl font-semibold hover:bg-blue-400 transition-colors border border-blue-400">
              Найти заведение
            </Link>
          </div>
          <p className="mt-4 text-blue-300 text-xs">Без скрытых платежей · Настройка за 5 минут · Отмена в любой момент</p>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <span className="font-bold text-blue-600">Booking</span>
          <div className="flex gap-5">
            <Link href="/" className="hover:text-gray-600">Главная</Link>
            <Link href="/explore" className="hover:text-gray-600">Каталог</Link>
            <Link href="/pricing" className="hover:text-gray-600">Тарифы</Link>
            <Link href="/contact" className="hover:text-gray-600">Контакты</Link>
          </div>
          <span>© 2026 Booking</span>
        </div>
      </footer>
    </div>
  )
}
