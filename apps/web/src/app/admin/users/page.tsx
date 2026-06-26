'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: 'Клиент', BUSINESS_OWNER: 'Владелец', SUPERADMIN: 'Админ',
}
const ROLE_COLORS: Record<string, string> = {
  CUSTOMER: 'bg-gray-700 text-gray-300',
  BUSINESS_OWNER: 'bg-blue-900 text-blue-300',
  SUPERADMIN: 'bg-purple-900 text-purple-300',
}

export default function AdminUsersPage() {
  const { token } = useAuth()
  const { success, error: showError } = useToast()
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
      if (!res.ok) throw new Error('Ошибка')
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive } : u))
      success(isActive ? 'Пользователь разблокирован' : 'Пользователь заблокирован')
    } catch { showError('Ошибка') }
  }

  const changeRole = async (id: string, role: string) => {
    if (!token) return
    try {
      const res = await fetch(`${API}/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error('Ошибка')
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
      success('Роль изменена')
    } catch { showError('Ошибка') }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">
        Пользователи
        <span className="ml-3 text-base font-normal text-gray-500">{total} всего</span>
      </h1>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            value={pendingQuery}
            onChange={e => setPendingQuery(e.target.value)}
            placeholder="Поиск по имени или email..."
            className="flex-1 px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700">
            Найти
          </button>
        </form>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); load(1, query, e.target.value) }}
          className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm focus:outline-none">
          <option value="">Все роли</option>
          <option value="CUSTOMER">Клиенты</option>
          <option value="BUSINESS_OWNER">Владельцы</option>
          <option value="SUPERADMIN">Админы</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">Пользователь</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">Роль</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3 hidden md:table-cell">Брони / Бизнесы</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3 hidden lg:table-cell">Регистрация</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">Статус</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-500">Загрузка...</td></tr>
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
                    <option value="CUSTOMER">Клиент</option>
                    <option value="BUSINESS_OWNER">Владелец</option>
                    <option value="SUPERADMIN">Админ</option>
                  </select>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-gray-400">
                    {u._count?.bookings ?? 0} броней · {u._count?.ownedBusinesses ?? 0} бизнесов
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString('ru')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {u.isActive ? 'Активен' : 'Заблок.'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleStatus(u.id, !u.isActive)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${u.isActive
                      ? 'bg-red-900/50 text-red-400 hover:bg-red-900'
                      : 'bg-green-900/50 text-green-400 hover:bg-green-900'}`}>
                    {u.isActive ? 'Блок.' : 'Разблок.'}
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
            Страница {page} из {totalPages} · {total} пользователей
          </span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => load(page - 1)}
              className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-700">
              ← Назад
            </button>
            <button disabled={page >= totalPages} onClick={() => load(page + 1)}
              className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-700">
              Вперёд →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
