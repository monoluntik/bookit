'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { api } from '@/lib/api'
import { toLocalDateStr } from '@/lib/date'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru', { weekday: 'short', day: 'numeric', month: 'long' })
}

type Exception = {
  id: string; date: string; isClosed: boolean; reason?: string | null
  startTime?: string | null; endTime?: string | null
}

export default function SchedulePage() {
  const t = useTranslations('Dashboard.schedule')
  const { user } = useAuth()
  const { success, error: showError } = useToast()

  const [businesses, setBusinesses] = useState<any[]>([])
  const [selectedBiz, setSelectedBiz] = useState('')
  const [resources, setResources] = useState<any[]>([])
  const [selectedRes, setSelectedRes] = useState('')
  const [exceptions, setExceptions] = useState<Exception[]>([])
  const [loading, setLoading] = useState(false)

  // Add form
  const [adding, setAdding] = useState(false)
  const [formDate, setFormDate] = useState('')
  const [formClosed, setFormClosed] = useState(true)
  const [formReason, setFormReason] = useState('')
  const [formStart, setFormStart] = useState('09:00')
  const [formEnd, setFormEnd] = useState('13:00')
  const [saving, setSaving] = useState(false)

  // Load businesses
  useEffect(() => {
    if (!user) return
    api.getMyBusinesses().then(b => {
      setBusinesses(b)
      if (b.length > 0) setSelectedBiz(b[0].id)
    })
  }, [user])

  // Load resources when biz changes
  useEffect(() => {
    if (!user || !selectedBiz) return
    const slug = businesses.find(b => b.id === selectedBiz)?.slug
    if (!slug) return
    fetch(`${API_URL}/api/businesses/${slug}`)
      .then(r => r.json())
      .then(d => {
        setResources(d.resources ?? [])
        setSelectedRes(d.resources?.[0]?.id ?? '')
        setExceptions([])
      })
  }, [selectedBiz, businesses, user])

  // Load exceptions when resource changes
  useEffect(() => {
    if (!user || !selectedRes) return
    setLoading(true)
    fetch(`${API_URL}/api/resources/${selectedRes}/exceptions`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(setExceptions)
      .catch(() => setExceptions([]))
      .finally(() => setLoading(false))
  }, [user, selectedRes])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedRes || !formDate) return
    setSaving(true)
    try {
      const body: any = { date: formDate, isClosed: formClosed, reason: formReason || undefined }
      if (!formClosed) { body.startTime = formStart; body.endTime = formEnd }

      const res = await fetch(`${API_URL}/api/resources/${selectedRes}/exceptions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      success(formClosed ? t('successDayOffAdded') : t('successSpecialHoursSaved'))
      // Upsert locally
      setExceptions(prev => {
        const filtered = prev.filter(e => e.date.slice(0, 10) !== formDate)
        return [...filtered, data].sort((a, b) => a.date.localeCompare(b.date))
      })
      setAdding(false)
      setFormDate(''); setFormReason('')
    } catch (err: any) {
      showError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (exId: string) => {
    if (!user || !selectedRes) return
    try {
      const res = await fetch(`${API_URL}/api/resources/${selectedRes}/exceptions/${exId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      success(t('successExceptionDeleted'))
      setExceptions(prev => prev.filter(e => e.id !== exId))
    } catch (err: any) {
      showError(err.message)
    }
  }

  const today = toLocalDateStr(new Date())
  const upcoming = exceptions.filter(e => e.date.slice(0, 10) >= today)
  const past     = exceptions.filter(e => e.date.slice(0, 10) < today)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
        <button onClick={() => setAdding(v => !v)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
          {t('addButton')}
        </button>
      </div>

      {/* Selectors */}
      <div className="bg-white rounded-2xl p-4 mb-5 flex flex-wrap gap-3 shadow-sm">
        {businesses.length > 1 && (
          <select value={selectedBiz} onChange={e => setSelectedBiz(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        {resources.length > 0 && (
          <select value={selectedRes} onChange={e => setSelectedRes(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
            {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        )}
        {resources.length === 0 && (
          <span className="text-sm text-gray-400">{t('noResourcesInBusiness')}</span>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl p-5 mb-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">{t('newExceptionTitle')}</h3>

          {/* Type toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-4 w-fit">
            <button type="button" onClick={() => setFormClosed(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${formClosed ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              {t('tabDayOff')}
            </button>
            <button type="button" onClick={() => setFormClosed(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${!formClosed ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              {t('tabSpecialHours')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">{t('dateLabel')}</label>
              <input type="date" required min={today} value={formDate} onChange={e => setFormDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            {!formClosed && (
              <>
                <div />
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">{t('startWorkLabel')}</label>
                  <input type="time" value={formStart} onChange={e => setFormStart(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">{t('endWorkLabel')}</label>
                  <input type="time" value={formEnd} onChange={e => setFormEnd(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              </>
            )}

            <div className={formClosed ? '' : 'sm:col-span-2'}>
              <label className="text-xs font-medium text-gray-600 block mb-1">{t('reasonLabel')}</label>
              <input type="text" value={formReason} onChange={e => setFormReason(e.target.value)}
                placeholder={formClosed ? t('reasonPlaceholderClosed') : t('reasonPlaceholderHours')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-3 mb-4">
            {formClosed ? t('hintClosed') : t('hintSpecialHours')}
          </p>

          <div className="flex gap-3">
            <button type="button" onClick={() => setAdding(false)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              {t('cancel')}
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {saving ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      )}

      {/* Exceptions list */}
      {loading ? (
        <div className="flex justify-center pt-10">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !selectedRes ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
          <div className="text-3xl mb-2">📅</div>
          <div>{t('selectResourcePrompt')}</div>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.length === 0 && past.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center">
              <div className="text-3xl mb-3">🏖️</div>
              <p className="text-gray-400 mb-4">{t('emptyTitle')}</p>
              <button onClick={() => setAdding(true)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                {t('addDayOff')}
              </button>
            </div>
          )}

          {upcoming.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">{t('upcoming')}</h2>
              {upcoming.map(ex => (
                <ExceptionRow key={ex.id} ex={ex} onDelete={handleDelete} t={t} />
              ))}
            </>
          )}

          {past.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide px-1 mt-4">{t('past')}</h2>
              {past.map(ex => (
                <ExceptionRow key={ex.id} ex={ex} onDelete={handleDelete} isPast t={t} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ExceptionRow({ ex, onDelete, isPast = false, t }: {
  ex: Exception; onDelete: (id: string) => void; isPast?: boolean
  t: (key: string, values?: Record<string, any>) => string
}) {
  return (
    <div className={`bg-white rounded-2xl px-5 py-4 shadow-sm flex items-center gap-4 ${isPast ? 'opacity-50' : ''}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg
        ${ex.isClosed ? 'bg-red-50' : 'bg-amber-50'}`}>
        {ex.isClosed ? '🔒' : '⏰'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900">{fmtDate(ex.date)}</div>
        <div className="text-sm text-gray-500 mt-0.5">
          {ex.isClosed
            ? t('closed')
            : t('shortDay', { start: ex.startTime ?? '', end: ex.endTime ?? '' })}
          {ex.reason && <span className="text-gray-400"> · {ex.reason}</span>}
        </div>
      </div>

      {!isPast && (
        <button onClick={() => onDelete(ex.id)}
          className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-red-100 text-red-400 hover:bg-red-50">
          {t('delete')}
        </button>
      )}
    </div>
  )
}
