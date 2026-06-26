'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

export default function StaffPage() {
  const { token } = useAuth()
  const [businesses, setBusinesses] = useState<any[]>([])
  const [selectedBiz, setSelectedBiz] = useState('')
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ email: '', position: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    api.getMyBusinesses(token).then(b => {
      setBusinesses(b)
      if (b.length > 0) setSelectedBiz(b[0].id)
    }).finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    if (!token || !selectedBiz) return
    api.getStaff(selectedBiz, token).then(setStaff).catch(() => setStaff([]))
  }, [token, selectedBiz])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setError('')
    setSaving(true)
    try {
      const member = await api.addStaff({ businessId: selectedBiz, email: form.email, position: form.position || undefined }, token)
      setStaff(p => [...p, member])
      setShowAdd(false)
      setForm({ email: '', position: '' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id: string, name: string) => {
    if (!token || !confirm(`Удалить ${name} из персонала?`)) return
    await api.removeStaff(id, token)
    setStaff(p => p.filter(s => s.id !== id))
  }

  if (loading) return <div className="flex justify-center pt-20"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Персонал</h1>
        <button onClick={() => { setShowAdd(true); setError('') }}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
          + Добавить
        </button>
      </div>

      {businesses.length > 1 && (
        <select value={selectedBiz} onChange={e => setSelectedBiz(e.target.value)}
          className="mb-4 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none">
          {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}

      <div className="space-y-3">
        {staff.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-gray-400">
            <div className="text-3xl mb-2">👥</div>
            <p>Персонал не добавлен</p>
            <p className="text-xs mt-1">Сотрудник должен быть зарегистрирован в системе</p>
          </div>
        ) : staff.map(s => (
          <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-lg font-bold text-blue-600 shrink-0">
              {s.user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{s.user?.name}</div>
              <div className="text-sm text-gray-400">{s.user?.email}</div>
              {s.position && <div className="text-xs text-blue-600 mt-0.5">{s.position}</div>}
              {s.role && <div className="text-xs text-purple-600 mt-0.5">Роль: {s.role.name}</div>}
            </div>
            <button onClick={() => handleRemove(s.id, s.user?.name)}
              className="text-xs text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 border border-red-100 shrink-0">
              Удалить
            </button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-semibold text-gray-900 mb-2">Добавить сотрудника</h2>
            <p className="text-xs text-gray-400 mb-4">Пользователь должен быть зарегистрирован в системе по email</p>
            <form onSubmit={handleAdd} className="space-y-3">
              <input required type="email" placeholder="Email сотрудника" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <input placeholder="Должность (мастер, администратор, врач...)" value={form.position}
                onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Отмена</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-60">
                  {saving ? 'Добавляем...' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
