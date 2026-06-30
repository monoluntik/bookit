'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const ROLE_COLORS: Record<string, string> = {
  CUSTOMER: 'bg-gray-700 text-gray-300',
  BUSINESS_OWNER: 'bg-blue-900 text-blue-300',
  SUPERADMIN: 'bg-purple-900 text-purple-300',
}

export default function AdminUsersPage() {
  const { token } = useAuth()
  const { success, error: showError } = useToast()
  const t = useTranslations('Admin.users')
  const ROLE_LABELS: Record<string, string> = {
    CUSTOMER: t('roles.customer'), BUSINESS_OWNER: t('roles.owner'), SUPERADMIN: t('roles.admin'),
  }
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [pendingQuery, setPendingQuery] = useState('')

  const load = useCallback((p = 1, q = query, role = roleFilter) => {
    if (!token) return
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: '30', ...(q ? { query: q } : {}), ...(role ? { role } : {}) })
    fetch(`${API}/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setUsers(d.users ?? []); setTotal(d.total ?? 0); setTotalPages(d.totalPages ?? 1); setPage(p) })
      .finally(() => setLoading(false))
  }, [token, query, roleFilter])

  useEffect(() => { load(1) }, [token, roleFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setQuery(pendingQuery)
    load(1, pendingQuery, roleFilter)
  }

  const toggleStatus = async (id: string, isActive: boolean) => {
    if (!token) return
    try {
      const res = await fetch(`${API}/api/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive }),
      })
      if (!res.ok) throw new Error('Error')
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive } : u))
      success(isActive ? t('toasts.unblocked') : t('toasts.blocked'))
    } catch { showError(t('toasts.error')) }
  }

  const changeRole = async (id: string, role: string) => {
    if (!token) return
    try {
      const res = await fetch(`${API}/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error('Error')
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
      success(t('toasts.roleChanged'))
    } catch { showError(t('toasts.error')) }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">
        {t('title')}
        <span className="ml-3 text-base font-normal text-gray-500">{t('totalCount', { count: total })}</span>
      </h1>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            value={pendingQuery}
            onChange={e => setPendingQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="flex-1 px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700">
            {t('searchButton')}
          </button>
        </form>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); load(1, query, e.target.value) }}
          className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm focus:outline-none">
          <option value="">{t('allRoles')}</option>
          <option value="CUSTOMER">{t('roles.customers')}</option>
          <option value="BUSINESS_OWNER">{t('roles.owners')}</option>
          <option value="SUPERADMIN">{t('roles.admins')}</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">{t('table.user')}</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">{t('table.role')}</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3 hidden md:table-cell">{t('table.activity')}</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3 hidden lg:table-cell">{t('table.registered')}</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">{t('table.status')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-500">{t('loading')}</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="border-b border-gray-700/50 hover:bg-gray-750">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {u.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={e => changeRole(u.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-lg border-0 font-medium focus:outline-none cursor-pointer ${ROLE_COLORS[u.role] ?? 'bg-gray-700 text-gray-300'}`}
                  >
                    <option value="CUSTOMER">{t('roles.customer')}</option>
                    <option value="BUSINESS_OWNER">{t('roles.owner')}</option>
                    <option value="SUPERADMIN">{t('roles.admin')}</option>
                  </select>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-gray-400">
                    {t('activitySummary', { bookings: u._count?.bookings ?? 0, businesses: u._count?.ownedBusinesses ?? 0 })}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString('ru')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {u.isActive ? t('status.active') : t('status.blocked')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleStatus(u.id, !u.isActive)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${u.isActive
                      ? 'bg-red-900/50 text-red-400 hover:bg-red-900'
                      : 'bg-green-900/50 text-green-400 hover:bg-green-900'}`}>
                    {u.isActive ? t('actions.block') : t('actions.unblock')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">
            {t('pagination.pageOf', { page, totalPages })} · {t('totalCount', { count: total })}
          </span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => load(page - 1)}
              className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-700">
              {t('pagination.prev')}
            </button>
            <button disabled={page >= totalPages} onClick={() => load(page + 1)}
              className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-700">
              {t('pagination.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
