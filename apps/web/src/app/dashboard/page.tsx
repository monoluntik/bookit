'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { getMeta, STATUS_COLOR, STATUS_LABEL, formatDate, formatTime } from '@/lib/businessTypes'

// ── Mini bar chart (pure SVG, no deps) ──────────────────────────────────────
function BarChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(d => d.count), 1)
  const H = 64
  const barW = 100 / data.length

  return (
    <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className="w-full h-16">
      {data.map((d, i) => {
        const barH = (d.count / max) * H
        const x = i * barW + barW * 0.1
        const w = barW * 0.8
        return (
          <rect key={d.date} x={x} y={H - barH} width={w} height={barH}
            fill={barH > 0 ? '#3b82f6' : '#e5e7eb'} rx="1" opacity="0.85" />
        )
      })}
    </svg>
  )
}

// ── Donut chart for status breakdown ────────────────────────────────────────
const STATUS_DONUT_COLORS: Record<string, string> = {
  PENDING: '#f59e0b', CONFIRMED: '#3b82f6',
  COMPLETED: '#10b981', CANCELLED: '#ef4444', NO_SHOW: '#9ca3af',
}
const STATUS_LABELS_SHORT: Record<string, string> = {
  PENDING: 'Ожидает', CONFIRMED: 'Подтверждена',
  COMPLETED: 'Завершена', CANCELLED: 'Отменена', NO_SHOW: 'Не пришёл',
}

function DonutChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (total === 0) return <div className="text-sm text-gray-400 text-center py-4">Нет данных</div>

  let offset = 0
  const R = 32, cx = 40, cy = 40, strokeW = 12
  const circ = 2 * Math.PI * R

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 80 80" className="w-20 h-20 shrink-0 -rotate-90">
        {entries.map(([status, count]) => {
          const dash = (count / total) * circ
          const seg = (
            <circle key={status} cx={cx} cy={cy} r={R}
              fill="none"
              stroke={STATUS_DONUT_COLORS[status] ?? '#9ca3af'}
              strokeWidth={strokeW}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
            />
          )
          offset += dash
          return seg
        })}
      </svg>
      <div className="flex flex-col gap-1.5 flex-1">
        {entries.map(([status, count]) => (
          <div key={status} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: STATUS_DONUT_COLORS[status] ?? '#9ca3af' }} />
              <span className="text-xs text-gray-500">{STATUS_LABELS_SHORT[status] ?? status}</span>
            </div>
            <span className="text-xs font-semibold text-gray-700">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Trend badge ──────────────────────────────────────────────────────────────
function Trend({ curr, prev }: { curr: number; prev: number }) {
  if (prev === 0) return null
  const pct = Math.round(((curr - prev) / prev) * 100)
  if (pct === 0) return null
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${pct > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
      {pct > 0 ? '↑' : '↓'}{Math.abs(pct)}%
    </span>
  )
}

export default function DashboardPage() {
  const { token } = useAuth()
  const [businesses, setBusinesses] = useState<any[]>([])
  const [selectedBiz, setSelectedBiz] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [todayBookings, setTodayBookings] = useState<any[]>([])

  useEffect(() => {
    if (!token) return
    api.getMyBusinesses(token).then(b => {
      setBusinesses(b)
      if (b.length > 0) setSelectedBiz(b[0].id)
    }).finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    if (!token || !selectedBiz) return
    setStats(null)
    api.getStats(selectedBiz, token).then(setStats).catch(() => setStats(null))
  }, [token, selectedBiz])

  useEffect(() => {
    if (!token) return
    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
    const today = new Date().toISOString().slice(0, 10)
    fetch(`${API}/api/bookings/mine?date=${today}&limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setTodayBookings(d.bookings ?? []) })
      .catch(() => {})
  }, [token])

  if (loading) return <div className="flex justify-center pt-20"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  if (businesses.length === 0) return (
    <div className="bg-white rounded-2xl p-12 text-center">
      <div className="text-4xl mb-3">🏢</div>
      <div className="font-medium text-gray-700 mb-1">Нет бизнесов</div>
      <p className="text-sm text-gray-400 mb-4">Создайте первый бизнес чтобы начать принимать брони</p>
      <Link href="/dashboard/settings" className="inline-flex px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
        Создать бизнес
      </Link>
    </div>
  )

  const biz = businesses.find(b => b.id === selectedBiz)
  const meta = biz ? getMeta(biz.type) : null

  return (
    <div>
      {/* Business selector */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {meta && <span className="text-2xl">{meta.icon}</span>}
          {businesses.length > 1 ? (
            <select value={selectedBiz} onChange={e => setSelectedBiz(e.target.value)}
              className="text-xl font-bold text-gray-900 bg-transparent border-none focus:outline-none cursor-pointer">
              {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          ) : (
            <h1 className="text-xl font-bold text-gray-900">{biz?.name}</h1>
          )}
        </div>
        <div className="flex gap-2">
          {biz && (
            <Link href={`/b/${biz.slug}`} target="_blank"
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              Страница ↗
            </Link>
          )}
          <Link href="/dashboard/settings" className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            Настройки
          </Link>
        </div>
      </div>

      {/* Today's bookings */}
      {todayBookings.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-700 mb-3">
            📅 Сегодня — {todayBookings.length} {todayBookings.length === 1 ? 'запись' : 'записей'}
          </h2>
          <div className="space-y-2">
            {todayBookings.slice(0, 5).map(b => (
              <div key={b.id} className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center justify-between gap-3">
                <div>
                  <span className="font-medium text-sm text-gray-900">{b.resource?.name}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(b.startAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {new Date(b.endAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {b.service && <span className="text-xs text-blue-600 ml-1">· {b.service.name}</span>}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[b.status]}`}>
                  {STATUS_LABEL[b.status]}
                </span>
              </div>
            ))}
            {todayBookings.length > 5 && (
              <p className="text-xs text-gray-400 text-center">+ ещё {todayBookings.length - 5}</p>
            )}
          </div>
        </div>
      )}

      {/* Stats cards */}
      {stats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <div className="bg-blue-50 rounded-2xl p-4">
              <div className="text-2xl mb-1">📅</div>
              <div className="text-2xl font-bold text-blue-700">{stats.today}</div>
              <div className="text-xs font-medium text-blue-500 mt-0.5">Сегодня</div>
            </div>
            <div className="bg-green-50 rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div className="text-2xl mb-1">📊</div>
                <Trend curr={stats.month} prev={stats.prevMonthCount} />
              </div>
              <div className="text-2xl font-bold text-green-700">{stats.month}</div>
              <div className="text-xs font-medium text-green-500 mt-0.5">За месяц</div>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4">
              <div className="text-2xl mb-1">⏳</div>
              <div className="text-2xl font-bold text-amber-700">{stats.pending}</div>
              <div className="text-xs font-medium text-amber-500 mt-0.5">Ожидают</div>
            </div>
            <div className="bg-purple-50 rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div className="text-2xl mb-1">💰</div>
                <Trend curr={stats.revenueMonth} prev={stats.prevRevenueMonth} />
              </div>
              <div className="text-2xl font-bold text-purple-700">{stats.revenueMonth.toLocaleString('ru')} с</div>
              <div className="text-xs font-medium text-purple-500 mt-0.5">Доход (месяц)</div>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid lg:grid-cols-3 gap-4 mb-5">
            {/* Bar chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 text-sm">Брони за месяц</h2>
                <span className="text-xs text-gray-400">по дням</span>
              </div>
              <BarChart data={stats.dailyChart ?? []} />
              <div className="flex justify-between text-xs text-gray-300 mt-1 px-0.5">
                <span>{stats.dailyChart?.[0]?.date?.slice(8)}</span>
                <span>{stats.dailyChart?.[stats.dailyChart.length - 1]?.date?.slice(8)}</span>
              </div>
            </div>

            {/* Donut chart */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 text-sm mb-4">По статусам</h2>
              <DonutChart data={stats.statusBreakdown ?? {}} />
            </div>
          </div>

          {/* Upcoming bookings */}
          {stats.upcomingBookings?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Ближайшие брони</h2>
                <Link href={`/dashboard/bookings?businessId=${selectedBiz}`} className="text-sm text-blue-600 hover:text-blue-800">
                  Все →
                </Link>
              </div>
              <div className="space-y-3">
                {stats.upcomingBookings.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
                      {new Date(b.startAt).getDate()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{b.customer?.name}</div>
                      <div className="text-xs text-gray-400">
                        {b.resource?.name}{b.service ? ` · ${b.service.name}` : ''} · {formatTime(b.startAt)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 shrink-0 hidden sm:block">
                      {formatDate(b.startAt)}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[b.status]}`}>
                      {STATUS_LABEL[b.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: `/dashboard/bookings?businessId=${selectedBiz}`, icon: '📅', label: 'Все брони' },
          { href: '/dashboard/resources', icon: '🪑', label: 'Ресурсы' },
          { href: '/dashboard/services', icon: '✂️', label: 'Услуги' },
          { href: '/dashboard/staff', icon: '👥', label: 'Персонал' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="bg-white rounded-2xl p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="text-sm font-medium text-gray-700">{item.label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
