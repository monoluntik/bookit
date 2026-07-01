'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const TYPE_KEYS: Record<string, string> = {
  HOTEL: 'hotel', RESTAURANT: 'restaurant', SALON: 'salon',
  COWORKING: 'coworking', SPORT: 'sport', MEDICAL: 'medical', CUSTOM: 'custom',
}
const TYPE_ICONS: Record<string, string> = {
  HOTEL: '🏨', RESTAURANT: '🍽️', SALON: '💇', COWORKING: '💼',
  SPORT: '⚽', MEDICAL: '🏥', CUSTOM: '📋',
}

export default function AdminBusinessesPage() {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const t = useTranslations('Admin.businesses')
  const TYPE_LABELS: Record<string, string> = Object.fromEntries(
    Object.entries(TYPE_KEYS).map(([k, v]) => [k, t(`types.${v}`)])
  )
  const [businesses, setBusinesses] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [pendingQuery, setPendingQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback((p = 1, q = query, type = typeFilter, isActive = statusFilter) => {
    if (!user) return
    setLoading(true)
    const params = new URLSearchParams({
      page: String(p), limit: '30',
      ...(q ? { query: q } : {}),
      ...(type ? { type } : {}),
      ...(isActive !== '' ? { isActive } : {}),
    })
    fetch(`${API}/api/admin/businesses?${params}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setBusinesses(d.businesses ?? [])
        setTotal(d.total ?? 0)
        setTotalPages(d.totalPages ?? 1)
        setPage(p)
      })
      .finally(() => setLoading(false))
  }, [user, query, typeFilter, statusFilter])

  useEffect(() => { load(1) }, [user, typeFilter, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setQuery(pendingQuery)
    load(1, pendingQuery, typeFilter, statusFilter)
  }

  const toggleStatus = async (id: string, isActive: boolean) => {
    if (!user) return
    try {
      const res = await fetch(`${API}/api/admin/businesses/${id}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      if (!res.ok) throw new Error('Error')
      setBusinesses(prev => prev.map(b => b.id === id ? { ...b, isActive } : b))
      success(isActive ? t('toasts.activated') : t('toasts.deactivated'))
    } catch { showError(t('toasts.error')) }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">
        {t('title')}
        <span className="ml-3 text-base font-normal text-gray-500">{t('totalCount', { count: total })}</span>
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
          <input
            value={pendingQuery}
            onChange={e => setPendingQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="flex-1 px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700">{t('searchButton')}</button>
        </form>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); load(1, query, e.target.value, statusFilter) }}
          className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm focus:outline-none">
          <option value="">{t('allTypes')}</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); load(1, query, typeFilter, e.target.value) }}
          className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm focus:outline-none">
          <option value="">{t('allStatuses')}</option>
          <option value="true">{t('activeFilter')}</option>
          <option value="false">{t('inactiveFilter')}</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {businesses.map(b => (
            <div key={b.id} className="bg-gray-800 rounded-2xl border border-gray-700 p-4 flex items-center gap-4">
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center text-xl shrink-0">
                {b.logoUrl
                  ? <img src={b.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                  : (TYPE_ICONS[b.type] ?? '🏢')}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">{b.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${b.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {b.isActive ? t('status.active') : t('status.hidden')}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                    {TYPE_LABELS[b.type] ?? b.type}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5 flex gap-3">
                  <span>/{b.slug}</span>
                  <span>{b.owner?.email}</span>
                  <span>{t('fields.bookingsCount', { count: b._count?.bookings ?? 0 })}</span>
                  <span>{t('fields.reviewsCount', { count: b._count?.reviews ?? 0 })}</span>
                  <span>{t('fields.resourcesCount', { count: b._count?.resources ?? 0 })}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/b/${b.slug}`} target="_blank"
                  className="text-xs px-2.5 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">
                  {t('actions.open')}
                </Link>
                <button
                  onClick={() => toggleStatus(b.id, !b.isActive)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${b.isActive
                    ? 'bg-red-900/50 text-red-400 hover:bg-red-900'
                    : 'bg-green-900/50 text-green-400 hover:bg-green-900'}`}>
                  {b.isActive ? t('actions.hide') : t('actions.activate')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">{t('pagination.pageOf', { page, totalPages })}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => load(page - 1)}
              className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-700">{t('pagination.prev')}</button>
            <button disabled={page >= totalPages} onClick={() => load(page + 1)}
              className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-700">{t('pagination.next')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
