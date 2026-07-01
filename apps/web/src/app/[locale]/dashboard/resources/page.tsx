'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import ImageUpload from '@/components/ui/ImageUpload'
import ContentTranslationsPanel from '@/components/dashboard/ContentTranslationsPanel'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const emptySchedule = { start: '09:00', end: '18:00', slot: '60', days: [1, 2, 3, 4, 5] as number[] }

export default function ResourcesPage() {
  const t = useTranslations('Dashboard.resources')
  const DAY_LABELS = [t('dayLabels.mon'), t('dayLabels.tue'), t('dayLabels.wed'), t('dayLabels.thu'), t('dayLabels.fri'), t('dayLabels.sat'), t('dayLabels.sun')]
  const SLOT_OPTIONS = [
    { value: '15', label: t('slotOptions.min15') },
    { value: '30', label: t('slotOptions.min30') },
    { value: '45', label: t('slotOptions.min45') },
    { value: '60', label: t('slotOptions.min60') },
    { value: '90', label: t('slotOptions.min90') },
    { value: '120', label: t('slotOptions.min120') },
    { value: '180', label: t('slotOptions.min180') },
    { value: '240', label: t('slotOptions.min240') },
  ]
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [businesses, setBusinesses] = useState<any[]>([])
  const [selectedBiz, setSelectedBiz] = useState('')
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Create modal
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', capacity: '1', bookingMode: 'FIXED' as 'FIXED' | 'FREE_START', depositAmount: '' })
  const [scheduleForm, setScheduleForm] = useState(emptySchedule)

  // Schedule edit modal
  const [editScheduleFor, setEditScheduleFor] = useState<any>(null) // resource
  const [editScheduleForm, setEditScheduleForm] = useState(emptySchedule)

  // Photos state
  const [editPhotosFor, setEditPhotosFor] = useState<string | null>(null) // resource id
  const [translationsFor, setTranslationsFor] = useState<string | null>(null) // resource id
  const [resourceImages, setResourceImages] = useState<Record<string, string[]>>({}) // resourceId → urls

  // Deposit state
  const [editDepositFor, setEditDepositFor] = useState<string | null>(null) // resource id
  const [depositDraft, setDepositDraft] = useState('')

  useEffect(() => {
    if (!user) return
    api.getMyBusinesses().then(b => {
      setBusinesses(b)
      if (b.length > 0) setSelectedBiz(b[0].id)
    }).finally(() => setLoading(false))
  }, [user])

  const loadResources = (bizId: string) => {
    const slug = businesses.find(b => b.id === bizId)?.slug
    if (!slug) return
    fetch(`${API}/api/businesses/${slug}`)
      .then(r => r.json())
      .then(d => {
        const list = d.resources ?? []
        setResources(list)
        // Seed photo state from existing data
        setResourceImages(prev => {
          const next = { ...prev }
          list.forEach((r: any) => { next[r.id] = r.images ?? [] })
          return next
        })
      })
  }

  useEffect(() => {
    if (!selectedBiz || businesses.length === 0) return
    loadResources(selectedBiz)
  }, [selectedBiz, businesses])

  const saveResourcePhotos = async (resourceId: string) => {
    if (!user) return
    const images = resourceImages[resourceId] ?? []
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/resources/${resourceId}/images`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? t('errorGeneric')) }
      setEditPhotosFor(null)
      success(t('successPhotosSaved'))
    } catch (err: any) {
      showError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleDay = (set: number[], d: number) =>
    set.includes(d) ? set.filter(x => x !== d) : [...set, d].sort()

  const openEditDeposit = (resource: any) => {
    setEditDepositFor(resource.id)
    setDepositDraft(resource.depositAmount ? String(resource.depositAmount) : '')
  }

  const saveDeposit = async (resourceId: string) => {
    if (!user) return
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/resources/${resourceId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositAmount: depositDraft.trim() ? Number(depositDraft) : null }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? t('errorGeneric')) }
      loadResources(selectedBiz)
      setEditDepositFor(null)
      success(t('successDepositSaved'))
    } catch (err: any) {
      showError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Create resource + schedule
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (scheduleForm.days.length === 0) { setFormError(t('errorPickDay')); return }
    if (scheduleForm.start >= scheduleForm.end) { setFormError(t('errorStartBeforeEnd')); return }
    setSaving(true)
    setFormError('')
    try {
      const res = await fetch(`${API}/api/resources`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBiz,
          name: form.name,
          description: form.description || undefined,
          capacity: Number(form.capacity),
          bookingMode: form.bookingMode,
          depositAmount: form.depositAmount.trim() ? Number(form.depositAmount) : null,
        }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? t('errorGeneric')); }
      const resource = await res.json()

      await fetch(`${API}/api/resources/${resource.id}/schedules`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayOfWeek: scheduleForm.days,
          startTime: scheduleForm.start,
          endTime: scheduleForm.end,
          slotDurationMinutes: Number(scheduleForm.slot),
        }),
      })

      loadResources(selectedBiz)
      setShowNew(false)
      setForm({ name: '', description: '', capacity: '1', bookingMode: 'FIXED', depositAmount: '' })
      setScheduleForm(emptySchedule)
    } catch (err: any) {
      setFormError(err.message ?? t('errorGeneric'))
    } finally {
      setSaving(false)
    }
  }

  // Open schedule edit modal prefilled with existing schedule
  const openEditSchedule = (resource: any) => {
    const s = resource.schedules?.[0]
    setEditScheduleFor(resource)
    setEditScheduleForm(s ? {
      start: s.startTime,
      end: s.endTime,
      slot: String(s.slotDurationMinutes ?? 60),
      days: s.dayOfWeek ?? [1, 2, 3, 4, 5],
    } : emptySchedule)
    setFormError('')
  }

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !editScheduleFor) return
    if (editScheduleForm.days.length === 0) { setFormError(t('errorPickDay')); return }
    if (editScheduleForm.start >= editScheduleForm.end) { setFormError(t('errorStartBeforeEnd')); return }
    setSaving(true)
    setFormError('')
    try {
      const existingSchedule = editScheduleFor.schedules?.[0]
      const payload = {
        dayOfWeek: editScheduleForm.days,
        startTime: editScheduleForm.start,
        endTime: editScheduleForm.end,
        slotDurationMinutes: Number(editScheduleForm.slot),
      }

      if (existingSchedule) {
        // Update existing schedule — avoid creating duplicates
        const res = await fetch(`${API}/api/resources/${editScheduleFor.id}/schedules/${existingSchedule.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? t('errorGeneric')) }
      } else {
        // No schedule yet — create
        const res = await fetch(`${API}/api/resources/${editScheduleFor.id}/schedules`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? t('errorGeneric')) }
      }

      loadResources(selectedBiz)
      setEditScheduleFor(null)
      success(t('successScheduleSaved'))
    } catch (err: any) {
      setFormError(err.message ?? t('errorGeneric'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center pt-20">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const ScheduleFields = ({
    value, onChange,
  }: {
    value: typeof emptySchedule
    onChange: (v: typeof emptySchedule) => void
  }) => (
    <div className="pt-3 border-t border-gray-100">
      <div className="text-xs font-medium text-gray-500 mb-3">{t('scheduleSectionTitle')}</div>

      {/* Days */}
      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1.5">{t('workingDays')}</div>
        <div className="flex gap-1.5">
          {DAY_LABELS.map((d, i) => (
            <button key={i} type="button"
              onClick={() => onChange({ ...value, days: toggleDay(value.days, i + 1) })}
              className={`w-9 h-9 rounded-full text-xs font-medium transition-colors
                ${value.days.includes(i + 1) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Times */}
      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1.5">{t('workingHours')}</div>
        <div className="flex items-center gap-2">
          <input type="time" value={value.start}
            onChange={e => onChange({ ...value, start: e.target.value })}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <span className="text-gray-400 text-sm">—</span>
          <input type="time" value={value.end}
            onChange={e => onChange({ ...value, end: e.target.value })}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
        </div>
      </div>

      {/* Slot duration */}
      <div>
        <div className="text-xs text-gray-400 mb-1.5">{t('slotLength')}</div>
        <div className="flex flex-wrap gap-1.5">
          {SLOT_OPTIONS.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => onChange({ ...value, slot: opt.value })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${value.slot === opt.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
        <button onClick={() => { setShowNew(true); setFormError('') }}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
          {t('addButton')}
        </button>
      </div>

      {businesses.length > 1 && (
        <select value={selectedBiz} onChange={e => setSelectedBiz(e.target.value)}
          className="mb-4 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none">
          {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}

      {/* Resource list */}
      <div className="space-y-3">
        {resources.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-gray-400">
            <div className="text-3xl mb-2">🪑</div>
            <p className="mb-1">{t('emptyTitle')}</p>
            <p className="text-xs">{t('emptyHint')}</p>
          </div>
        ) : resources.map(r => {
          const sched = r.schedules?.[0]
          const activeDays = sched?.dayOfWeek ?? []
          return (
            <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{r.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0
                      ${r.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {r.isActive ? t('active') : t('inactive')}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0
                      ${r.bookingMode === 'FREE_START' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                      {r.bookingMode === 'FREE_START' ? t('bookingModeBadgeFreeStart') : t('bookingModeBadgeFixed')}
                    </span>
                  </div>
                  {r.description && <div className="text-sm text-gray-400 mt-0.5">{r.description}</div>}
                  {r.capacity && <div className="text-xs text-gray-400 mt-0.5">{t('capacity', { count: r.capacity })}</div>}
                  {r.depositAmount && (
                    <div className="mt-1">
                      <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                        {t('depositBadge', { amount: Number(r.depositAmount).toLocaleString('ru') })}
                      </span>
                    </div>
                  )}

                  {/* Schedule preview */}
                  {sched ? (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {DAY_LABELS.map((d, i) => (
                          <span key={i} className={`w-7 h-7 rounded-full text-xs flex items-center justify-center font-medium
                            ${activeDays.includes(i + 1) ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-300'}`}>
                            {d}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500">
                        {sched.startTime} – {sched.endTime}
                        <span className="ml-2 text-gray-400">{t('slotsOf', { minutes: sched.slotDurationMinutes })}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1.5 w-fit">
                      {t('noSchedule')}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setEditPhotosFor(editPhotosFor === r.id ? null : r.id)}
                    className={`px-3 py-1.5 text-xs border rounded-lg transition-colors
                      ${editPhotosFor === r.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700'}`}>
                    📷{(resourceImages[r.id]?.length ?? 0) > 0 ? ` ${resourceImages[r.id].length}` : ''}
                  </button>
                  <button
                    onClick={() => openEditSchedule(r)}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors">
                    {sched ? t('scheduleButton') : t('addScheduleButton')}
                  </button>
                  <button
                    onClick={() => setTranslationsFor(translationsFor === r.id ? null : r.id)}
                    className={`px-3 py-1.5 text-xs border rounded-lg transition-colors
                      ${translationsFor === r.id
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'border-gray-200 text-gray-600 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700'}`}>
                    {t('translationsButton')}
                  </button>
                  <button
                    onClick={() => editDepositFor === r.id ? setEditDepositFor(null) : openEditDeposit(r)}
                    className={`px-3 py-1.5 text-xs border rounded-lg transition-colors
                      ${editDepositFor === r.id
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700'}`}>
                    {t('depositButton')}
                  </button>
                </div>
              </div>

              {/* Inline deposit editor */}
              {editDepositFor === r.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="text-xs text-gray-500 mb-1 block">{t('depositLabel')}</label>
                  <div className="flex gap-2">
                    <input type="number" min="0" placeholder={t('depositPlaceholder')} value={depositDraft}
                      onChange={e => setDepositDraft(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    <button type="button" onClick={() => saveDeposit(r.id)} disabled={saving}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-60">
                      {saving ? t('saving') : t('save')}
                    </button>
                    <button type="button" onClick={() => setEditDepositFor(null)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">
                      {t('cancel')}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{t('depositHint')}</p>
                </div>
              )}

              {/* Inline translations editor */}
              {translationsFor === r.id && user && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <ContentTranslationsPanel
                    entity="resources"
                    id={r.id}
                    originalName={r.name}
                    originalDescription={r.description ?? null}
                    onClose={() => setTranslationsFor(null)}
                  />
                </div>
              )}

              {/* Inline photo editor */}
              {editPhotosFor === r.id && user && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <ImageUpload
                    images={resourceImages[r.id] ?? []}
                    onChange={urls => setResourceImages(prev => ({ ...prev, [r.id]: urls }))}
                    max={8}
                    label={t('photosLabel')}
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => saveResourcePhotos(r.id)}
                      disabled={saving}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-60">
                      {saving ? t('savingPhotos') : t('savePhotos')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPhotosFor(null)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Create resource modal ── */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onKeyDown={e => e.key === 'Escape' && setShowNew(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
            role="dialog" aria-modal="true">
            <h2 className="font-semibold text-gray-900 mb-4">{t('newResourceTitle')}</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input required placeholder={t('namePlaceholder')} value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <input placeholder={t('descriptionPlaceholder')} value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t('capacityLabel')}</label>
                <input type="number" min="1" value={form.capacity}
                  onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t('depositLabel')}</label>
                <input type="number" min="0" placeholder={t('depositPlaceholder')} value={form.depositAmount}
                  onChange={e => setForm(p => ({ ...p, depositAmount: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                <p className="text-xs text-gray-400 mt-1">{t('depositHint')}</p>
              </div>

              {/* Booking mode selector */}
              <div className="pt-3 border-t border-gray-100">
                <div className="text-xs font-medium text-gray-500 mb-3">{t('bookingModeLabel')}</div>
                <div className="space-y-2">
                  {(['FIXED', 'FREE_START'] as const).map(mode => (
                    <label key={mode} className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                      ${form.bookingMode === mode ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="radio"
                        name="bookingMode"
                        value={mode}
                        checked={form.bookingMode === mode}
                        onChange={() => setForm(p => ({ ...p, bookingMode: mode }))}
                        className="mt-0.5 accent-blue-600 shrink-0"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {mode === 'FIXED' ? t('bookingModeFixed') : t('bookingModeFreeStart')}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {mode === 'FIXED' ? t('bookingModeFixedDesc') : t('bookingModeFreeStartDesc')}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 italic">
                          {mode === 'FIXED' ? t('bookingModeFixedExample') : t('bookingModeFreeStartExample')}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <ScheduleFields value={scheduleForm} onChange={setScheduleForm} />

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-60">
                  {saving ? t('creating') : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit schedule modal ── */}
      {editScheduleFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onKeyDown={e => e.key === 'Escape' && setEditScheduleFor(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
            role="dialog" aria-modal="true">
            <h2 className="font-semibold text-gray-900 mb-1">{t('scheduleModalTitle')}</h2>
            <p className="text-sm text-gray-400 mb-4">{editScheduleFor.name}</p>
            <form onSubmit={handleSaveSchedule} className="space-y-3">
              <ScheduleFields value={editScheduleForm} onChange={setEditScheduleForm} />

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditScheduleFor(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-60">
                  {saving ? t('saving') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
