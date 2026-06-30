'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { formatDate, formatTime } from '@/lib/businessTypes'

// ── SVG bar chart ─────────────────────────────────────────────────────────────
function BarChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data?.length) return null
  const visible = data.slice(-30)
  const max = Math.max(...visible.map(d => d.count), 1)
  const H = 80, W = 100
  const barW = W / visible.length

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-20">
      {visible.map((d, i) => {
        const barH = Math.max((d.count / max) * H, d.count > 0 ? 2 : 0)
        return (
          <rect key={d.date} x={i * barW + barW * 0.1} y={H - barH}
            width={barW * 0.8} height={barH}
            fill={barH > 0 ? '#3b82f6' : '#e5e7eb'} rx="0.5" opacity="0.9" />
        )
      })}
    </svg>
  )
}

// ── Donut chart ───────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b', CONFIRMED: '#3b82f6', COMPLETED: '#10b981',
  CANCELLED: '#ef4444', NO_SHOW: '#9ca3af', BLOCK: '#6b7280',
}

function DonutChart({ data, statusLabels, noDataLabel }: { data: Record<string, number>; statusLabels: Record<string, string>; noDataLabel: string }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (!total) return <p className="text-sm text-gray-400 py-4 text-center">{noDataLabel}</p>

  const R = 32, cx = 40, cy = 40, sw = 12
  const circ = 2 * Math.PI * R
  let offset = 0

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 80 80" className="w-20 h-20 shrink-0 -rotate-90">
        {entries.map(([status, count]) => {
          const dash = (count / total) * circ
          const el = (
            <circle key={status} cx={cx} cy={cy} r={R} fill="none"
              stroke={STATUS_COLORS[status] ?? '#9ca3af'} strokeWidth={sw}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset} />
          )
          offset += dash
          return el
        })}
      </svg>
      <div className="space-y-1.5 flex-1">
        {entries.map(([status, count]) => (
          <div key={status} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full"
                style={{ background: STATUS_COLORS[status] ?? '#9ca3af' }} />
              <span className="text-xs text-gray-500">{statusLabels[status] ?? status}</span>
            </div>
            <span className="text-xs font-semibold text-gray-700">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Service breakdown ─────────────────────────────────────────────────────────
function ServiceBar({ name, count, max }: { name: string; count: number; max: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 w-28 truncate shrink-0">{name}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${Math.round((count / max) * 100)}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-6 text-right">{count}</span>
    </div>
  )
}

export default function StatsPage() {
  const t = useTranslations('Dashboard.stats')
  const STATUS_LABELS: Record<string, string> = {
    PENDING: t('statusLabels.PENDING'), CONFIRMED: t('statusLabels.CONFIRMED'), COMPLETED: t('statusLabels.COMPLETED'),
    CANCELLED: t('statusLabels.CANCELLED'), NO_SHOW: t('statusLabels.NO_SHOW'), BLOCK: t('statusLabels.BLOCK'),
  }
  const { token } = useAuth()
  const [businesses, setBusinesses] = useState<any[]>([])
  const [selectedBiz, setSelectedBiz] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    api.getMyBusinesses(token).then(b => {
      setBusinesses(b)
      if (b.length) setSelectedBiz(b[0].id)
    })
  }, [token])

  useEffect(() => {
    if (!selectedBiz || !token) return
    setLoading(true)
    api.getStats(selectedBiz, token)
      .then(setStats)
      .finally(() => setLoading(false))
  }, [selectedBiz, token])

  const pct = (a: number, b: number) => {
    if (!b) return null
    const d = Math.round(((a - b) / b) * 100)
    return { d, up: d >= 0 }
  }

  const revenueΔ = pct(stats?.revenueMonth ?? 0, stats?.prevRevenueMonth ?? 0)
  const bookingsΔ = pct(stats?.month ?? 0, stats?.prevMonthCount ?? 0)

  if (loading || !stats) return (
    <div className="flex justify-center pt-20">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // Service popularity from upcoming bookings (approximation)
  const serviceCount: Record<string, number> = {}
  stats.upcomingBookings?.forEach((b: any) => {
    const name = b.service?.name ?? t('noService')
    serviceCount[name] = (serviceCount[name] ?? 0) + 1
  })
  const serviceEntries = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])
  const serviceMax = serviceEntries[0]?.[1] ?? 1

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
        {businesses.length > 1 && (
          <select value={selectedBiz} onChange={e => setSelectedBiz(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm focus:outline-none">
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: t('cardBookingsToday'), value: stats.today,
            sub: t('cardBookingsTodaySub', { count: stats.month }),
            color: 'text-blue-600', bg: 'bg-blue-50',
          },
          {
            label: t('cardRevenueMonth'),
            value: `${Number(stats.revenueMonth).toLocaleString('ru')} с`,
            sub: revenueΔ ? t('cardRevenueMonthSub', { pct: `${revenueΔ.up ? '↑' : '↓'} ${Math.abs(revenueΔ.d)}` }) : t('noDataShort'),
            color: 'text-green-600', bg: 'bg-green-50',
            subColor: revenueΔ?.up ? 'text-green-500' : 'text-red-500',
          },
          {
            label: t('cardBookingsMonth'), value: stats.month,
            sub: bookingsΔ ? t('cardRevenueMonthSub', { pct: `${bookingsΔ.up ? '↑' : '↓'} ${Math.abs(bookingsΔ.d)}` }) : t('noDataShort'),
            color: 'text-indigo-600', bg: 'bg-indigo-50',
            subColor: bookingsΔ?.up ? 'text-green-500' : 'text-red-500',
          },
          {
            label: t('cardPending'), value: stats.pending,
            sub: t('cardPendingSub', { total: stats.total }),
            color: 'text-amber-600', bg: 'bg-amber-50',
          },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-xs text-gray-500 mt-1">{card.label}</div>
            <div className={`text-xs mt-1 ${(card as any).subColor ?? 'text-gray-400'}`}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Daily bookings chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-semibold text-gray-700 mb-3">{t('chartTitle30d')}</div>
          <BarChart data={stats.dailyChart} />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>{stats.dailyChart?.[0]?.date?.slice(5)}</span>
            <span>{stats.dailyChart?.[stats.dailyChart.length - 1]?.date?.slice(5)}</span>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-semibold text-gray-700 mb-3">{t('statusBreakdown')}</div>
          <DonutChart data={stats.statusBreakdown} statusLabels={STATUS_LABELS} noDataLabel={t('noData')} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Upcoming bookings */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-semibold text-gray-700 mb-3">{t('upcomingAppointments')}</div>
          {stats.upcomingBookings?.length === 0 ? (
            <p className="text-sm text-gray-400">{t('noUpcoming')}</p>
          ) : (
            <div className="space-y-2">
              {stats.upcomingBookings?.map((b: any) => (
                <div key={b.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
                    {formatTime(b.startAt)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {b.customer?.name ?? t('defaultCustomer')}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(b.startAt)} · {b.resource?.name}{b.service ? ` · ${b.service.name}` : ''}
                    </div>
                  </div>
                  {b.customer?.phone && (
                    <a href={`tel:${b.customer.phone}`}
                      className="text-xs text-blue-500 hover:text-blue-700 shrink-0">
                      📞
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Service popularity */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-semibold text-gray-700 mb-3">{t('servicePopularity')}</div>
          {serviceEntries.length === 0 ? (
            <p className="text-sm text-gray-400">{t('noUpcomingDataForServices')}</p>
          ) : (
            <div className="space-y-2.5">
              {serviceEntries.map(([name, count]) => (
                <ServiceBar key={name} name={name} count={count} max={serviceMax} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
