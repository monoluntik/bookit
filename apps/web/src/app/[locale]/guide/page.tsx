import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
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

function MockExplore({ t }: { t: Awaited<ReturnType<typeof getTranslations>> }) {
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
            <span>🔍</span> {t('guide.explore.searchPlaceholder')}
          </div>
          <button className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500">{t('guide.explore.filters')}</button>
        </div>
        <div className="flex gap-2 mb-3 overflow-hidden">
          {[t('guide.explore.categories.all'), t('guide.explore.categories.salons'), t('guide.explore.categories.sport'), t('guide.explore.categories.medical')].map((tag, i) => (
            <span key={tag} className={`shrink-0 text-xs px-3 py-1 rounded-full font-medium ${i === 0 ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
              {tag}
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
                <div className="text-[10px] text-gray-400">{t('guide.explore.reviewsCount', { count: c.reviews })}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MockWindow>
  )
}

function MockBookingFlow({ t }: { t: Awaited<ReturnType<typeof getTranslations>> }) {
  const days = [t('guide.bookingFlow.days.mon'), t('guide.bookingFlow.days.tue'), t('guide.bookingFlow.days.wed'), t('guide.bookingFlow.days.thu'), t('guide.bookingFlow.days.fri'), t('guide.bookingFlow.days.sat'), t('guide.bookingFlow.days.sun')]
  return (
    <MockWindow title="booking.kg/b/salon-oasis">
      <div className="p-4 space-y-3">
        {/* Steps */}
        <div className="flex gap-1">
          {[t('guide.bookingFlow.steps.service'), t('guide.bookingFlow.steps.date'), t('guide.bookingFlow.steps.time'), t('guide.bookingFlow.steps.done')].map((s, i) => (
            <div key={s} className={`flex-1 text-center text-[10px] font-medium py-1 rounded-lg ${i === 1 ? 'bg-blue-600 text-white' : i < 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
              {i < 1 ? '✓' : s}
            </div>
          ))}
        </div>
        {/* Calendar mini */}
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">{t('guide.bookingFlow.monthLabel')}</span>
            <div className="flex gap-1">
              <button className="w-5 h-5 bg-white border border-gray-200 rounded-md text-xs text-gray-500">‹</button>
              <button className="w-5 h-5 bg-white border border-gray-200 rounded-md text-xs text-gray-500">›</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {days.map(d => <div key={d} className="text-center text-[9px] text-gray-400">{d}</div>)}
            {[null,null,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30].map((d, i) => (
              <div key={i} className={`text-center text-[10px] w-5 h-5 mx-auto flex items-center justify-center rounded-full
                ${d === 26 ? 'bg-blue-600 text-white font-bold' : d && d > 20 ? 'hover:bg-blue-50 cursor-pointer text-gray-600' : 'text-gray-400'}`}>
                {d}
              </div>
            ))}
          </div>
        </div>
        <div className="text-[10px] text-gray-400 text-center">{t('guide.bookingFlow.selectedDate')}</div>
      </div>
    </MockWindow>
  )
}

function MockSlots({ t }: { t: Awaited<ReturnType<typeof getTranslations>> }) {
  const slots = ['09:00', '10:00', '11:00', '13:00', '14:00', '16:00']
  return (
    <MockWindow title={t('guide.slots.windowTitle')}>
      <div className="p-4">
        <div className="text-xs font-semibold text-gray-600 mb-3">{t('guide.slots.available')}</div>
        <div className="grid grid-cols-3 gap-2">
          {slots.map((s, i) => (
            <button key={s} className={`py-2 rounded-xl text-xs font-semibold border transition-colors
              ${i === 2 ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'}`}>
              {s}
              <div className="text-[9px] font-normal opacity-70 mt-0.5">{t('guide.slots.duration')}</div>
            </button>
          ))}
        </div>
        <button className="w-full mt-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">
          {t('guide.slots.selectButton')}
        </button>
      </div>
    </MockWindow>
  )
}

function MockDashboard({ t }: { t: Awaited<ReturnType<typeof getTranslations>> }) {
  return (
    <MockWindow title={t('guide.dashboard.windowTitle')}>
      <div className="flex min-h-40">
        {/* Sidebar */}
        <div className="w-28 bg-gray-50 border-r border-gray-100 p-2 space-y-0.5">
          {[['▦', t('guide.dashboard.sidebar.overview')], ['📅', t('guide.dashboard.sidebar.bookings')], ['🪑', t('guide.dashboard.sidebar.resources')], ['✂️', t('guide.dashboard.sidebar.services')], ['⚙️', t('guide.dashboard.sidebar.settings')]].map(([icon, label], i) => (
            <div key={label} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium
              ${i === 1 ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}>
              <span>{icon}</span>{label}
            </div>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 p-3">
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[['12', t('guide.dashboard.stats.todayBookings'), 'text-blue-600'], ['5', t('guide.dashboard.stats.pending'), 'text-amber-600'], ['89 400с', t('guide.dashboard.stats.revenue'), 'text-green-600']].map(([v, l, c]) => (
              <div key={l} className="bg-gray-50 rounded-xl p-2 text-center">
                <div className={`text-sm font-bold ${c}`}>{v}</div>
                <div className="text-[9px] text-gray-400">{l}</div>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            {[
              { time: '09:00', name: t('guide.dashboard.bookingItems.client1'), status: 'CONFIRMED' },
              { time: '10:00', name: t('guide.dashboard.bookingItems.client2'), status: 'PENDING' },
              { time: '11:00', name: t('guide.dashboard.bookingItems.client3'), status: 'MANUAL' },
            ].map(b => (
              <div key={b.time} className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-2 py-1.5">
                <span className="text-[10px] font-mono text-gray-400 w-8">{b.time}</span>
                <span className="flex-1 text-[10px] font-medium text-gray-700 truncate">{b.name}</span>
                <Pill color={b.status === 'CONFIRMED' ? 'bg-green-50 text-green-700' : b.status === 'MANUAL' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'}>
                  {b.status === 'CONFIRMED' ? t('guide.dashboard.statusLabels.confirmed') : b.status === 'MANUAL' ? t('guide.dashboard.statusLabels.manual') : t('guide.dashboard.statusLabels.pending')}
                </Pill>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockWindow>
  )
}

function MockCalendar({ t }: { t: Awaited<ReturnType<typeof getTranslations>> }) {
  const days = [t('guide.bookingFlow.days.mon'), t('guide.bookingFlow.days.tue'), t('guide.bookingFlow.days.wed'), t('guide.bookingFlow.days.thu'), t('guide.bookingFlow.days.fri'), t('guide.bookingFlow.days.sat'), t('guide.bookingFlow.days.sun')]
  return (
    <MockWindow title={t('guide.calendar.windowTitle')}>
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-700">{t('guide.calendar.monthLabel')}</span>
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
            <button className="text-[10px] px-2 py-0.5 rounded bg-white text-gray-700 shadow-sm">{t('guide.calendar.viewList')}</button>
            <button className="text-[10px] px-2 py-0.5 rounded text-gray-400">{t('guide.calendar.viewCalendar')}</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {days.map(d => (
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
                    {[26,27].includes(day) ? t('guide.calendar.bookingsCountMany') : t('guide.calendar.bookingsCountFew')}
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

function MockOwnerBooking({ t }: { t: Awaited<ReturnType<typeof getTranslations>> }) {
  return (
    <MockWindow title={t('guide.ownerBooking.windowTitle')}>
      <div className="p-4">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-4">
          <button className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold bg-white shadow-sm text-gray-800">
            {t('guide.ownerBooking.tabClient')}
          </button>
          <button className="flex-1 py-1.5 rounded-lg text-[11px] font-medium text-gray-400">
            {t('guide.ownerBooking.tabBlock')}
          </button>
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">{t('guide.ownerBooking.resourceLabel')}</label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] text-gray-600">
              {t('guide.ownerBooking.resourceValue')}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">{t('guide.ownerBooking.clientNameLabel')}</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] text-gray-700">{t('guide.ownerBooking.clientNameValue')}</div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">{t('guide.ownerBooking.phoneLabel')}</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] text-gray-700">{t('guide.ownerBooking.phoneValue')}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">{t('guide.ownerBooking.dateLabel')}</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] text-gray-600">{t('guide.ownerBooking.dateValue')}</div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">{t('guide.ownerBooking.startLabel')}</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] text-gray-600">{t('guide.ownerBooking.startValue')}</div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">{t('guide.ownerBooking.endLabel')}</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] text-gray-600">{t('guide.ownerBooking.endValue')}</div>
            </div>
          </div>
          <button className="w-full py-1.5 bg-blue-600 text-white rounded-xl text-[11px] font-semibold">{t('guide.ownerBooking.submitButton')}</button>
        </div>
      </div>
    </MockWindow>
  )
}

function MockScheduleBlock({ t }: { t: Awaited<ReturnType<typeof getTranslations>> }) {
  const entries = [
    { date: t('guide.scheduleBlock.entries.entry1.date'), label: t('guide.scheduleBlock.entries.entry1.label'), reason: t('guide.scheduleBlock.entries.entry1.reason'), color: 'bg-red-50 text-red-600', icon: '🔒' },
    { date: t('guide.scheduleBlock.entries.entry2.date'), label: t('guide.scheduleBlock.entries.entry2.label'), reason: t('guide.scheduleBlock.entries.entry2.reason'), color: 'bg-amber-50 text-amber-600', icon: '⏰' },
    { date: t('guide.scheduleBlock.entries.entry3.date'), label: t('guide.scheduleBlock.entries.entry3.label'), reason: t('guide.scheduleBlock.entries.entry3.reason'), color: 'bg-red-50 text-red-600', icon: '🔒' },
  ]
  return (
    <MockWindow title={t('guide.scheduleBlock.windowTitle')}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-semibold text-gray-800">{t('guide.scheduleBlock.masterName')}</div>
            <div className="text-[10px] text-gray-400">{t('guide.scheduleBlock.businessName')}</div>
          </div>
          <button className="text-[11px] bg-blue-600 text-white px-3 py-1 rounded-lg font-medium">{t('guide.scheduleBlock.addButton')}</button>
        </div>
        <div className="space-y-2">
          {entries.map(e => (
            <div key={e.date} className="flex items-center gap-2 bg-gray-50 rounded-xl px-2.5 py-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm ${e.color}`}>{e.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-gray-700">{e.date}</div>
                <div className="text-[10px] text-gray-400">{e.label} · {e.reason}</div>
              </div>
              <button className="text-[10px] text-red-400 border border-red-100 rounded-full px-2 py-0.5">{t('guide.scheduleBlock.deleteButton')}</button>
            </div>
          ))}
        </div>
      </div>
    </MockWindow>
  )
}

function MockStats({ t }: { t: Awaited<ReturnType<typeof getTranslations>> }) {
  const bars = [40, 70, 55, 90, 65, 80, 45]
  const days = [t('guide.stats.days.mon'), t('guide.stats.days.tue'), t('guide.stats.days.wed'), t('guide.stats.days.thu'), t('guide.stats.days.fri'), t('guide.stats.days.sat'), t('guide.stats.days.sun')]
  return (
    <MockWindow title={t('guide.stats.windowTitle')}>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[['142 500 с', t('guide.stats.revenueLabel'), 'text-green-600', '↑ 18%'], ['87', t('guide.stats.bookingsLabel'), 'text-blue-600', '↑ 12%']].map(([v, l, c, g]) => (
            <div key={l} className="bg-gray-50 rounded-xl p-2.5">
              <div className={`text-sm font-bold ${c}`}>{v}</div>
              <div className="text-[9px] text-gray-400 mt-0.5">{l}</div>
              <div className="text-[9px] text-green-500 font-semibold mt-0.5">{g}</div>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-gray-500 mb-1.5">{t('guide.stats.weeklyChartLabel')}</div>
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

function MockSettings({ t }: { t: Awaited<ReturnType<typeof getTranslations>> }) {
  return (
    <MockWindow title={t('guide.settings.windowTitle')}>
      <div className="p-4 space-y-3">
        <div>
          <label className="text-[10px] text-gray-500 block mb-0.5">{t('guide.settings.nameLabel')}</label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700">{t('guide.settings.nameValue')}</div>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-0.5">{t('guide.settings.linkLabel')}</label>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5 text-[11px] text-blue-700 font-mono">
            booking.kg/b/salon-oasis
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 block mb-0.5">{t('guide.settings.typeLabel')}</label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700">{t('guide.settings.typeValue')}</div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 block mb-0.5">{t('guide.settings.timezoneLabel')}</label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700">{t('guide.settings.timezoneValue')}</div>
          </div>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">{t('guide.settings.galleryLabel')}</label>
          <div className="flex gap-1.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-lg">💇</div>
            {[1,2,3].map(i => (
              <div key={i} className="w-12 h-12 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-lg">+</div>
            ))}
          </div>
        </div>
        <button className="w-full py-1.5 bg-blue-600 text-white rounded-xl text-[11px] font-semibold">{t('guide.settings.saveButton')}</button>
      </div>
    </MockWindow>
  )
}

function MockReview({ t }: { t: Awaited<ReturnType<typeof getTranslations>> }) {
  const reviewers = [
    { name: t('guide.review.reviewer1.name'), rating: 5, text: t('guide.review.reviewer1.text') },
    { name: t('guide.review.reviewer2.name'), rating: 4, text: t('guide.review.reviewer2.text') },
  ]
  return (
    <MockWindow title={t('guide.review.windowTitle')}>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">4.8</div>
            <div className="text-amber-400 text-sm">★★★★★</div>
            <div className="text-[10px] text-gray-400">{t('guide.review.reviewsCount')}</div>
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
        {reviewers.map(r => (
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

function MockCancellationPolicy({ t }: { t: Awaited<ReturnType<typeof getTranslations>> }) {
  return (
    <MockWindow title={t('guide.cancellationPolicy.windowTitle')}>
      <div className="p-4 space-y-3">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
          <div className="text-[11px] font-semibold text-amber-800 mb-1">{t('guide.cancellationPolicy.currentPolicyTitle')}</div>
          <div className="space-y-1 text-[10px] text-amber-700">
            <div>{t('guide.cancellationPolicy.rule1')}</div>
            <div>{t('guide.cancellationPolicy.rule2')}</div>
            <div>{t('guide.cancellationPolicy.rule3')}</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            [t('guide.cancellationPolicy.fields.freeCancel'), '24'],
            [t('guide.cancellationPolicy.fields.latePenalty'), '30'],
            [t('guide.cancellationPolicy.fields.noRefund'), '12'],
          ].map(([label, val]) => (
            <div key={label}>
              <label className="text-[10px] text-gray-500 block mb-0.5">{label}</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700">{val}</div>
            </div>
          ))}
        </div>
        <button className="w-full py-1.5 bg-blue-600 text-white rounded-xl text-[11px] font-semibold">{t('guide.cancellationPolicy.saveButton')}</button>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GuidePage() {
  const t = await getTranslations('Static')

  const TOC_BUSINESS = [
    { id: 'setup', label: t('guide.toc.business.setup') },
    { id: 'bookings', label: t('guide.toc.business.bookings') },
    { id: 'calendar', label: t('guide.toc.business.calendar') },
    { id: 'manual', label: t('guide.toc.business.manual') },
    { id: 'schedule', label: t('guide.toc.business.schedule') },
    { id: 'stats', label: t('guide.toc.business.stats') },
    { id: 'policy', label: t('guide.toc.business.policy') },
  ]

  const TOC_CUSTOMER = [
    { id: 'explore', label: t('guide.toc.customer.explore') },
    { id: 'booking-flow', label: t('guide.toc.customer.bookingFlow') },
    { id: 'slots', label: t('guide.toc.customer.slots') },
    { id: 'reviews', label: t('guide.toc.customer.reviews') },
  ]

  return (
    <div className="min-h-screen bg-white">
      <SmartNav />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            {t('guide.hero.badge')}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-5 leading-tight">
            {t('guide.hero.titleLine1')}<br /><span className="text-blue-600">{t('guide.hero.titleLine2')}</span>
          </h1>
          <p className="text-lg text-gray-500 mb-8">
            {t('guide.hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#business" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors">
              {t('guide.hero.businessOwnerCta')}
            </a>
            <a href="#customer" className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-colors">
              {t('guide.hero.customerCta')}
            </a>
          </div>
        </div>
      </section>

      {/* Sticky TOC */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-2 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            <span className="text-xs font-semibold text-gray-400 mr-2">{t('guide.toc.businessLabel')}</span>
            {TOC_BUSINESS.map(tc => (
              <a key={tc.id} href={`#${tc.id}`}
                className="text-xs px-3 py-1.5 rounded-full text-gray-500 hover:bg-blue-50 hover:text-blue-700 transition-colors whitespace-nowrap">
                {tc.label}
              </a>
            ))}
            <span className="text-gray-200 mx-2">|</span>
            <span className="text-xs font-semibold text-gray-400 mr-2">{t('guide.toc.customerLabel')}</span>
            {TOC_CUSTOMER.map(tc => (
              <a key={tc.id} href={`#${tc.id}`}
                className="text-xs px-3 py-1.5 rounded-full text-gray-500 hover:bg-green-50 hover:text-green-700 transition-colors whitespace-nowrap">
                {tc.label}
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
              <h2 className="text-2xl font-bold text-gray-900">{t('guide.businessSection.title')}</h2>
              <p className="text-gray-400 text-sm">{t('guide.businessSection.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <Section id="setup" badge={t('guide.sections.setup.badge')} bg="bg-white"
        title={t('guide.sections.setup.title')}
        desc={t('guide.sections.setup.desc')}>
        {[
          <>
            <Check>{t('guide.sections.setup.checks.check1')}<code className="bg-gray-100 px-1 rounded text-blue-600">booking.kg/b/ваш-бизнес</code></Check>
            <Check>{t('guide.sections.setup.checks.check2')}</Check>
            <Check>{t('guide.sections.setup.checks.check3')}</Check>
            <Check>{t('guide.sections.setup.checks.check4')}</Check>
            <Check>{t('guide.sections.setup.checks.check5')}</Check>
          </>,
          <MockSettings t={t} />,
        ]}
      </Section>

      <Section id="bookings" badge={t('guide.sections.bookings.badge')} bg="bg-gray-50" reverse
        title={t('guide.sections.bookings.title')}
        desc={t('guide.sections.bookings.desc')}>
        {[
          <>
            <Check>{t('guide.sections.bookings.checks.check1')}</Check>
            <Check>{t('guide.sections.bookings.checks.check2')}</Check>
            <Check>{t('guide.sections.bookings.checks.check3')}</Check>
            <Check>{t('guide.sections.bookings.checks.check4')}</Check>
            <Check>{t('guide.sections.bookings.checks.check5')}</Check>
          </>,
          <MockDashboard t={t} />,
        ]}
      </Section>

      <Section id="calendar" badge={t('guide.sections.calendar.badge')} bg="bg-white"
        title={t('guide.sections.calendar.title')}
        desc={t('guide.sections.calendar.desc')}>
        {[
          <>
            <Check>{t('guide.sections.calendar.checks.check1')}</Check>
            <Check>{t('guide.sections.calendar.checks.check2')}</Check>
            <Check>{t('guide.sections.calendar.checks.check3')}</Check>
            <Check>{t('guide.sections.calendar.checks.check4')}</Check>
          </>,
          <MockCalendar t={t} />,
        ]}
      </Section>

      <Section id="manual" badge={t('guide.sections.manual.badge')} bg="bg-gray-50" reverse
        title={t('guide.sections.manual.title')}
        desc={t('guide.sections.manual.desc')}>
        {[
          <>
            <Check>{t('guide.sections.manual.checks.check1')}</Check>
            <Check>{t('guide.sections.manual.checks.check2')}</Check>
            <Check>{t('guide.sections.manual.checks.check3')}</Check>
            <Check>{t('guide.sections.manual.checks.check4')}</Check>
            <Check>{t('guide.sections.manual.checks.check5')}</Check>
          </>,
          <MockOwnerBooking t={t} />,
        ]}
      </Section>

      <Section id="schedule" badge={t('guide.sections.schedule.badge')} bg="bg-white"
        title={t('guide.sections.schedule.title')}
        desc={t('guide.sections.schedule.desc')}>
        {[
          <>
            <Check>{t('guide.sections.schedule.checks.check1')}</Check>
            <Check>{t('guide.sections.schedule.checks.check2')}</Check>
            <Check>{t('guide.sections.schedule.checks.check3')}</Check>
            <Check>{t('guide.sections.schedule.checks.check4')}</Check>
            <Check>{t('guide.sections.schedule.checks.check5')}</Check>
          </>,
          <MockScheduleBlock t={t} />,
        ]}
      </Section>

      <Section id="stats" badge={t('guide.sections.stats.badge')} bg="bg-gray-50" reverse
        title={t('guide.sections.stats.title')}
        desc={t('guide.sections.stats.desc')}>
        {[
          <>
            <Check>{t('guide.sections.stats.checks.check1')}</Check>
            <Check>{t('guide.sections.stats.checks.check2')}</Check>
            <Check>{t('guide.sections.stats.checks.check3')}</Check>
            <Check>{t('guide.sections.stats.checks.check4')}</Check>
            <Check>{t('guide.sections.stats.checks.check5')}</Check>
          </>,
          <MockStats t={t} />,
        ]}
      </Section>

      <Section id="policy" badge={t('guide.sections.policy.badge')} bg="bg-white"
        title={t('guide.sections.policy.title')}
        desc={t('guide.sections.policy.desc')}>
        {[
          <>
            <Check>{t('guide.sections.policy.checks.check1')}</Check>
            <Check>{t('guide.sections.policy.checks.check2')}</Check>
            <Check>{t('guide.sections.policy.checks.check3')}</Check>
            <Check>{t('guide.sections.policy.checks.check4')}</Check>
            <Check>{t('guide.sections.policy.checks.check5')}</Check>
          </>,
          <MockCancellationPolicy t={t} />,
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
              <h2 className="text-2xl font-bold text-gray-900">{t('guide.customerSection.title')}</h2>
              <p className="text-gray-400 text-sm">{t('guide.customerSection.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <Section id="explore" badge={t('guide.sections.explore.badge')} bg="bg-green-50"
        title={t('guide.sections.explore.title')}
        desc={t('guide.sections.explore.desc')}>
        {[
          <>
            <Check>{t('guide.sections.explore.checks.check1')}</Check>
            <Check>{t('guide.sections.explore.checks.check2')}</Check>
            <Check>{t('guide.sections.explore.checks.check3')}</Check>
            <Check>{t('guide.sections.explore.checks.check4')}</Check>
            <Check>{t('guide.sections.explore.checks.check5')}</Check>
            <Check>{t('guide.sections.explore.checks.check6')}</Check>
          </>,
          <MockExplore t={t} />,
        ]}
      </Section>

      <Section id="booking-flow" badge={t('guide.sections.bookingFlow.badge')} bg="bg-white" reverse
        title={t('guide.sections.bookingFlow.title')}
        desc={t('guide.sections.bookingFlow.desc')}>
        {[
          <>
            <Check>{t('guide.sections.bookingFlow.checks.check1')}</Check>
            <Check>{t('guide.sections.bookingFlow.checks.check2')}</Check>
            <Check>{t('guide.sections.bookingFlow.checks.check3')}</Check>
            <Check>{t('guide.sections.bookingFlow.checks.check4')}</Check>
            <Check>{t('guide.sections.bookingFlow.checks.check5')}</Check>
          </>,
          <MockBookingFlow t={t} />,
        ]}
      </Section>

      <Section id="slots" badge={t('guide.sections.slots.badge')} bg="bg-gray-50"
        title={t('guide.sections.slots.title')}
        desc={t('guide.sections.slots.desc')}>
        {[
          <>
            <Check>{t('guide.sections.slots.checks.check1')}</Check>
            <Check>{t('guide.sections.slots.checks.check2')}</Check>
            <Check>{t('guide.sections.slots.checks.check3')}</Check>
            <Check>{t('guide.sections.slots.checks.check4')}</Check>
            <Check>{t('guide.sections.slots.checks.check5')}</Check>
          </>,
          <MockSlots t={t} />,
        ]}
      </Section>

      <Section id="reviews" badge={t('guide.sections.reviews.badge')} bg="bg-white" reverse
        title={t('guide.sections.reviews.title')}
        desc={t('guide.sections.reviews.desc')}>
        {[
          <>
            <Check>{t('guide.sections.reviews.checks.check1')}</Check>
            <Check>{t('guide.sections.reviews.checks.check2')}</Check>
            <Check>{t('guide.sections.reviews.checks.check3')}</Check>
            <Check>{t('guide.sections.reviews.checks.check4')}</Check>
            <Check>{t('guide.sections.reviews.checks.check5')}</Check>
          </>,
          <MockReview t={t} />,
        ]}
      </Section>

      {/* CTA */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            {t('guide.bottomCta.title')}
          </h2>
          <p className="text-blue-200 mb-8">
            {t('guide.bottomCta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-colors shadow-lg">
              {t('guide.bottomCta.businessButton')}
            </Link>
            <Link href="/explore"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-500 text-white rounded-2xl font-semibold hover:bg-blue-400 transition-colors border border-blue-400">
              {t('guide.bottomCta.customerButton')}
            </Link>
          </div>
          <p className="mt-4 text-blue-300 text-xs">{t('guide.bottomCta.note')}</p>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <span className="font-bold text-blue-600">{t('guide.footer.brand')}</span>
          <div className="flex gap-5">
            <Link href="/" className="hover:text-gray-600">{t('guide.footer.home')}</Link>
            <Link href="/explore" className="hover:text-gray-600">{t('guide.footer.explore')}</Link>
            <Link href="/pricing" className="hover:text-gray-600">{t('guide.footer.pricing')}</Link>
            <Link href="/contact" className="hover:text-gray-600">{t('guide.footer.contact')}</Link>
          </div>
          <span>{t('guide.footer.copyright')}</span>
        </div>
      </footer>
    </div>
  )
}
