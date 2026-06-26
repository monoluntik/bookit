'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const TYPE_LABELS: Record<string, string> = {
  HOTEL: 'Отели', RESTAURANT: 'Рестораны', SALON: 'Салоны',
  COWORKING: 'Коворкинг', SPORT: 'Спорт', MEDICAL: 'Медицина', CUSTOM: 'Другое',
}

function StatCard({ label, value, sub, color = 'text-white' }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  )
}

function MiniBar({ data }: { data: { date: string; count: number }[] }) {
  if (!data?.length) return null
  const last = data.slice(-30)
  const max = Math.max(...last.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-px h-12">
      {last.map(d => (
        <div key={d.date} className="flex-1 bg-blue-500 rounded-sm opacity-80 min-h-[2px] transition-all"
          style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 8 : 0)}%` }} />
      ))}
    </div>
  )
}

export default function AdminOverview() {
  const { token } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch(`${API}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(setStats).finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="flex justify-center pt-20">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const roleLabels: Record<string, string> = { CUSTOMER: 'Клиенты', BUSINESS_OWNER: 'Владельцы', SUPERADMIN: 'Админы' }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Обзор платформы</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Пользователей" value={stats?.users?.total ?? 0}
          sub={`+${stats?.users?.newMonth ?? 0} за месяц`} color="text-blue-400" />
        <StatCard label="Бизнесов" value={stats?.businesses?.active ?? 0}
          sub={`из ${stats?.businesses?.total ?? 0} всего`} color="text-green-400" />
        <StatCard label="Броней" value={stats?.bookings?.total ?? 0}
          sub={`${stats?.bookings?.month ?? 0} за месяц`} color="text-purple-400" />
        <StatCard label="Выручка (всего)"
          value={`${Number(stats?.revenue?.total ?? 0).toLocaleString('ru')} с`}
          sub={`${Number(stats?.revenue?.month ?? 0).toLocaleString('ru')} с за месяц`}
          color="text-amber-400" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Bookings chart */}
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <div className="text-sm font-semibold text-gray-300 mb-3">Брони за последние 30 дней</div>
          <MiniBar data={stats?.dailyChart ?? []} />
          <div className="text-xs text-gray-500 mt-2">
            Всего отзывов: {stats?.reviews?.total ?? 0}
          </div>
        </div>

        {/* Businesses by type */}
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <div className="text-sm font-semibold text-gray-300 mb-3">Бизнесы по категориям</div>
          <div className="space-y-2">
            {Object.entries(stats?.businesses?.byType ?? {}).map(([type, count]: [string, any]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{TYPE_LABELS[type] ?? type}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${Math.min((count / (stats?.businesses?.active || 1)) * 100, 100) * 0.8}px` }} />
                  <span className="text-sm font-semibold text-white">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Users by role */}
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <div className="text-sm font-semibold text-gray-300 mb-3">Пользователи по ролям</div>
          <div className="space-y-3">
            {Object.entries(stats?.users?.byRole ?? {}).map(([role, count]: [string, any]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{roleLabels[role] ?? role}</span>
                <span className="text-sm font-bold text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent bookings */}
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <div className="text-sm font-semibold text-gray-300 mb-3">Последние брони</div>
          <div className="space-y-2">
            {(stats?.recentBookings ?? []).slice(0, 5).map((b: any) => (
              <div key={b.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-gray-300 truncate">
                    {b.customer?.name ?? 'Клиент'} → {b.business?.name}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {b.service?.name ?? 'Без услуги'} · {new Date(b.startAt).toLocaleDateString('ru')}
                  </div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium
                  ${b.status === 'CONFIRMED' ? 'bg-blue-900 text-blue-300' :
                    b.status === 'COMPLETED' ? 'bg-green-900 text-green-300' :
                    b.status === 'CANCELLED' ? 'bg-red-900 text-red-300' :
                    'bg-gray-700 text-gray-300'}`}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
