'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
}

function ClientsContent() {
  const t = useTranslations('Dashboard.clients')
  const { user } = useAuth()
  const params = useSearchParams()
  const businessId = params.get('businessId') ?? ''

  const [businesses, setBusinesses] = useState<any[]>([])
  const [selectedBiz, setSelectedBiz] = useState(businessId)
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    api.getMyBusinesses().then(b => {
      setBusinesses(b)
      if (!selectedBiz && b.length > 0) setSelectedBiz(b[0].id)
    })
  }, [user])

  useEffect(() => {
    if (!user || !selectedBiz) return
    setLoading(true)
    const handle = setTimeout(() => {
      api.getClients(selectedBiz, search || undefined)
        .then(d => setClients(d.clients))
        .finally(() => setLoading(false))
    }, search ? 300 : 0)
    return () => clearTimeout(handle)
  }, [user, selectedBiz, search])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 mb-5 flex flex-wrap gap-3 shadow-sm">
        {businesses.length > 1 && (
          <select value={selectedBiz} onChange={e => setSelectedBiz(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="flex-1 min-w-[180px] px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {loading ? (
        <div className="flex justify-center pt-10">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <div className="text-3xl mb-3">👤</div>
          <p className="text-gray-400">{search ? t('emptySearch') : t('emptyTitle')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map(c => (
            <div key={c.key} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-[180px]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-lg shrink-0">
                  {c.userId ? '👤' : '🚶'}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{c.name}</div>
                  <div className="text-xs text-gray-400">
                    {c.phone ?? t('noPhone')}
                    {!c.userId && <span className="ml-1.5 text-amber-500">· {t('walkInBadge')}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-5 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{c.totalBookings}</div>
                  <div className="text-xs text-gray-400">{t('bookingsLabel')}</div>
                </div>
                {c.upcomingBookings > 0 && (
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">{c.upcomingBookings}</div>
                    <div className="text-xs text-gray-400">{t('upcomingLabel')}</div>
                  </div>
                )}
                {c.totalPaid > 0 && (
                  <div className="text-center">
                    <div className="font-semibold text-green-600">{c.totalPaid.toLocaleString('ru')}</div>
                    <div className="text-xs text-gray-400">{t('paidLabel')}</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="font-medium text-gray-600">{formatDate(c.lastBookingAt, 'ru')}</div>
                  <div className="text-xs text-gray-400">{t('lastVisitLabel')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ClientsPage() {
  return <Suspense><ClientsContent /></Suspense>
}
