'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import ContentTranslationsPanel from '@/components/dashboard/ContentTranslationsPanel'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export default function ServicesPage() {
  const t = useTranslations('Dashboard.services')
  const { token } = useAuth()
  const [businesses, setBusinesses] = useState<any[]>([])
  const [selectedBiz, setSelectedBiz] = useState('')
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const empty = { name: '', description: '', durationMinutes: '60', price: '0' }
  const [form, setForm] = useState(empty)
  const [formError, setFormError] = useState('')
  const [translationsFor, setTranslationsFor] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    api.getMyBusinesses(token).then(b => {
      setBusinesses(b)
      if (b.length > 0) setSelectedBiz(b[0].id)
    }).finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    if (!selectedBiz) return
    fetch(`${API}/api/services/business/${selectedBiz}`)
      .then(r => r.json()).then(setServices)
  }, [selectedBiz])

  const openNew = () => { setEditId(null); setForm(empty); setFormError(''); setShowNew(true) }
  const openEdit = (s: any) => {
    setEditId(s.id)
    setForm({ name: s.name, description: s.description ?? '', durationMinutes: String(s.durationMinutes), price: String(s.price) })
    setShowNew(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setFormError('')
    try {
      const body = { name: form.name, description: form.description, durationMinutes: Number(form.durationMinutes), price: Number(form.price) }
      if (editId) {
        const res = await fetch(`${API}/api/services/${editId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        })
        if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? t('errorGeneric')); }
        const updated = await res.json()
        setServices(p => p.map(s => s.id === editId ? updated : s))
      } else {
        const res = await fetch(`${API}/api/services`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...body, businessId: selectedBiz }),
        })
        if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? t('errorGeneric')); }
        const created = await res.json()
        setServices(p => [...p, created])
      }
      setShowNew(false)
    } catch (err: any) {
      setFormError(err.message ?? t('errorSaving'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!token || !confirm(t('confirmDelete'))) return
    await fetch(`${API}/api/services/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setServices(p => p.filter(s => s.id !== id))
  }

  if (loading) return <div className="flex justify-center pt-20"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
        <button onClick={openNew} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
          {t('addButton')}
        </button>
      </div>

      {businesses.length > 1 && (
        <select value={selectedBiz} onChange={e => setSelectedBiz(e.target.value)}
          className="mb-4 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none">
          {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}

      <div className="space-y-3">
        {services.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-gray-400">
            <div className="text-3xl mb-2">✂️</div>
            {t('emptyText')}
          </div>
        ) : services.map(s => (
          <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{s.name}</div>
                {s.description && <div className="text-sm text-gray-400">{s.description}</div>}
                <div className="flex gap-3 mt-1">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{t('minutesShort', { count: s.durationMinutes })}</span>
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{Number(s.price).toLocaleString('ru')} сом</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(s)} className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50 border border-gray-200">
                  {t('edit')}
                </button>
                <button
                  onClick={() => setTranslationsFor(translationsFor === s.id ? null : s.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors
                    ${translationsFor === s.id ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  {t('translationsButton')}
                </button>
                <button onClick={() => handleDelete(s.id)} className="text-xs text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 border border-red-100">
                  {t('delete')}
                </button>
              </div>
            </div>
            {translationsFor === s.id && token && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <ContentTranslationsPanel
                  entity="services"
                  id={s.id}
                  token={token}
                  originalName={s.name}
                  originalDescription={s.description ?? null}
                  onClose={() => setTranslationsFor(null)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onKeyDown={e => e.key === 'Escape' && setShowNew(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" role="dialog" aria-modal="true">
            <h2 className="font-semibold text-gray-900 mb-4">{editId ? t('editTitle') : t('newTitle')}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder={t('namePlaceholder')} value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <input placeholder={t('descriptionPlaceholder')} value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">{t('durationLabel')}</label>
                  <input type="number" min="5" required value={form.durationMinutes}
                    onChange={e => setForm(p => ({ ...p, durationMinutes: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">{t('priceLabel')}</label>
                  <input type="number" min="0" required value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              </div>
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-60">
                  {saving ? t('saving') : editId ? t('save') : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
