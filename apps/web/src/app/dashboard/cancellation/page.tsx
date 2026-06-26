'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { useToast } from '@/context/ToastContext'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export default function CancellationPolicyPage() {
  const { token } = useAuth()
  const { success, error: showError } = useToast()
  const [businesses, setBusinesses] = useState<any[]>([])
  const [selectedBiz, setSelectedBiz] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    freeCancellationHours: 24,
    penaltyPercent: 0,
    noRefundHours: 0,
  })

  useEffect(() => {
    if (!token) return
    api.getMyBusinesses(token).then(b => {
      setBusinesses(b)
      if (b.length > 0) setSelectedBiz(b[0].id)
    }).finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    if (!token || !selectedBiz) return
    fetch(`${API}/api/businesses/${selectedBiz}/cancellation-policy`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setForm({
          freeCancellationHours: data.freeCancellationHours,
          penaltyPercent: Number(data.penaltyPercent),
          noRefundHours: data.noRefundHours,
        })
      })
  }, [token, selectedBiz])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !selectedBiz) return
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/businesses/${selectedBiz}/cancellation-policy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Ошибка') }
      success('Политика отмены сохранена')
    } catch (err: any) {
      showError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const setField = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [key]: Number(e.target.value) }))

  if (loading) return <div className="flex justify-center pt-20"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Политика отмены</h1>
      <p className="text-sm text-gray-400 mb-6">Настройте условия отмены бронирований для клиентов.</p>

      {businesses.length > 1 && (
        <select value={selectedBiz} onChange={e => setSelectedBiz(e.target.value)}
          className="mb-5 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none">
          {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}

      <form onSubmit={handleSave} className="max-w-lg space-y-5">
        {/* Free cancellation */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Бесплатная отмена</h2>
          <p className="text-xs text-gray-400 mb-4">
            Клиент может отменить без штрафа если до визита осталось не менее указанного времени.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number" min="0" max="720" step="1"
              value={form.freeCancellationHours}
              onChange={setField('freeCancellationHours')}
              className="w-24 px-3 py-2 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <span className="text-sm text-gray-500">часов до визита</span>
          </div>
          {form.freeCancellationHours === 0 && (
            <p className="text-xs text-amber-600 mt-2">⚠️ При 0 часов бесплатная отмена недоступна</p>
          )}
        </div>

        {/* Penalty */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Штраф при поздней отмене</h2>
          <p className="text-xs text-gray-400 mb-4">
            Процент от суммы бронирования, который удерживается при отмене после окончания бесплатного периода.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number" min="0" max="100" step="5"
              value={form.penaltyPercent}
              onChange={setField('penaltyPercent')}
              className="w-24 px-3 py-2 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <span className="text-sm text-gray-500">% от суммы</span>
          </div>
        </div>

        {/* No-refund window */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Зона без возврата</h2>
          <p className="text-xs text-gray-400 mb-4">
            Если до визита осталось меньше указанного времени — возврат невозможен (100% штраф).
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number" min="0" max="720" step="1"
              value={form.noRefundHours}
              onChange={setField('noRefundHours')}
              className="w-24 px-3 py-2 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <span className="text-sm text-gray-500">часов до визита</span>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-blue-50 rounded-2xl p-4 text-sm text-blue-800 space-y-1">
          <div className="font-semibold mb-2">Как клиент увидит вашу политику:</div>
          {form.freeCancellationHours > 0
            ? <div>✓ Бесплатная отмена за {form.freeCancellationHours}+ ч до визита</div>
            : <div>✕ Бесплатная отмена недоступна</div>
          }
          {form.penaltyPercent > 0 && form.freeCancellationHours > 0 && form.noRefundHours < form.freeCancellationHours && (
            <div>⚠ Штраф {form.penaltyPercent}% при отмене менее чем за {form.freeCancellationHours} ч</div>
          )}
          {form.noRefundHours > 0 && (
            <div>✕ Без возврата при отмене менее чем за {form.noRefundHours} ч</div>
          )}
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-60">
          {saving ? 'Сохраняем...' : 'Сохранить политику'}
        </button>
      </form>
    </div>
  )
}
