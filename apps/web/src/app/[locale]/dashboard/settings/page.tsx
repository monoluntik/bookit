'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import ImageUpload from '@/components/ui/ImageUpload'
import ContentTranslationsPanel from '@/components/dashboard/ContentTranslationsPanel'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const BIZ_TYPES = ['HOTEL','RESTAURANT','SALON','COWORKING','SPORT','MEDICAL','CUSTOM']

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
}

const MAX_REMINDER_RULES = 5

export default function SettingsPage() {
  const t = useTranslations('Dashboard.settings')
  const TYPE_LABELS: Record<string, string> = {
    HOTEL: t('typeLabels.HOTEL'), RESTAURANT: t('typeLabels.RESTAURANT'), SALON: t('typeLabels.SALON'),
    COWORKING: t('typeLabels.COWORKING'), SPORT: t('typeLabels.SPORT'), MEDICAL: t('typeLabels.MEDICAL'),
    CUSTOM: t('typeLabels.CUSTOM'),
  }
  const REMINDER_PRESETS = [
    { label: t('remindersSection.presets.week'), minutes: 10080 },
    { label: t('remindersSection.presets.days3'), minutes: 4320 },
    { label: t('remindersSection.presets.day'), minutes: 1440 },
    { label: t('remindersSection.presets.hours3'), minutes: 180 },
    { label: t('remindersSection.presets.hour'), minutes: 60 },
    { label: t('remindersSection.presets.minutes30'), minutes: 30 },
  ]
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [businesses, setBusinesses] = useState<any[]>([])
  const [form, setForm] = useState({ name:'', slug:'', type:'SALON', description:'', address:'', phone:'', email:'' })
  const [slugManual, setSlugManual] = useState(false) // user manually edited slug
  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState('')
  const [mode, setMode] = useState<'view'|'new'>('view')
  const [editPhotos, setEditPhotos] = useState<string | null>(null) // businessId being edited
  const [editingBiz, setEditingBiz] = useState<string | null>(null) // businessId being info-edited
  const [editBizForm, setEditBizForm] = useState({ name: '', type: 'SALON', description: '', address: '', phone: '', email: '' })
  const [editingPayment, setEditingPayment] = useState<string | null>(null) // businessId
  const [paymentForm, setPaymentForm] = useState({ bakaiUsername: '', bakaiPassword: '' })
  const [showBakaiPw, setShowBakaiPw] = useState(false)
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [editingReminders, setEditingReminders] = useState<string | null>(null) // businessId
  const [editingTranslations, setEditingTranslations] = useState<string | null>(null) // businessId
  const [reminderRules, setReminderRules] = useState<Record<string, any[]>>({})
  const [newRulePreset, setNewRulePreset] = useState('1440')
  const [reminderSaving, setReminderSaving] = useState(false)

  // Photos state per business
  const [photoState, setPhotoState] = useState<Record<string, { logoUrl: string | null; images: string[] }>>({})

  useEffect(() => {
    if (!user) return
    api.getMyBusinesses().then(b => {
      setBusinesses(b)
      // Load full business data for photos
      b.forEach(async (biz: any) => {
        const full = await fetch(`${API}/api/businesses/${biz.slug}`).then(r => r.json()).catch(() => null)
        if (full) {
          setPhotoState(prev => ({
            ...prev,
            [biz.id]: { logoUrl: full.logoUrl ?? null, images: full.images ?? [] },
          }))
        }
      })
    })
  }, [user])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setCreateError('')
    try {
      const res = await fetch(`${API}/api/businesses`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const biz = await res.json()
      if (!res.ok) throw new Error(typeof biz.error === 'string' ? biz.error : t('newBusinessSection.errorCreating'))
      setBusinesses(prev => [...prev, biz])
      setMode('view')
      success(t('newBusinessSection.successCreated'))
    } catch (err: any) {
      setCreateError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const savePhotos = async (bizId: string) => {
    if (!user) return
    const state = photoState[bizId]
    if (!state) return
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/businesses/${bizId}/images`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: state.logoUrl, images: state.images }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? t('photosSection.errorGeneric')) }
      setEditPhotos(null)
      success(t('photosSection.successSaved'))
    } catch (err: any) {
      showError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const openEditBiz = (b: any) => {
    setEditBizForm({
      name: b.name ?? '',
      type: b.type ?? 'SALON',
      description: b.description ?? '',
      address: b.address ?? '',
      phone: b.phone ?? '',
      email: b.email ?? '',
    })
    setEditingBiz(b.id)
    setEditPhotos(null)
  }

  const handleUpdate = async (bizId: string) => {
    if (!user) return
    setSaving(true)
    try {
      await api.updateBusiness(bizId, editBizForm)
      setBusinesses(prev => prev.map(b => b.id === bizId ? { ...b, ...editBizForm } : b))
      setEditingBiz(null)
      success(t('editSection.successUpdated'))
    } catch (err: any) {
      showError(err.message ?? t('editSection.errorGeneric'))
    } finally {
      setSaving(false)
    }
  }

  const openEditPayment = (b: any) => {
    setPaymentForm({ bakaiUsername: '', bakaiPassword: '' })
    setShowBakaiPw(false)
    setEditingPayment(b.id)
    setEditingBiz(null)
    setEditPhotos(null)
  }

  const handleSavePayment = async (bizId: string) => {
    if (!user) return
    setPaymentSaving(true)
    try {
      const res = await fetch(`${API}/api/businesses/${bizId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bakaiUsername: paymentForm.bakaiUsername || null,
          bakaiPassword: paymentForm.bakaiPassword || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t('paymentSection.errorGeneric'))
      setBusinesses(prev => prev.map(b => b.id === bizId ? { ...b, hasBakaiCredentials: data.hasBakaiCredentials } : b))
      setEditingPayment(null)
      success(t('paymentSection.successSaved'))
    } catch (err: any) {
      showError(err.message ?? t('paymentSection.errorGeneric'))
    } finally {
      setPaymentSaving(false)
    }
  }

  const loadReminderRules = async (bizId: string) => {
    if (!user) return
    const res = await fetch(`${API}/api/reminder-rules?businessId=${bizId}`, { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setReminderRules(prev => ({ ...prev, [bizId]: data }))
    }
  }

  const openEditReminders = (b: any) => {
    setEditingReminders(b.id)
    setEditingPayment(null)
    setEditingBiz(null)
    setEditPhotos(null)
    loadReminderRules(b.id)
  }

  const handleAddRule = async (bizId: string) => {
    if (!user) return
    const preset = REMINDER_PRESETS.find(p => String(p.minutes) === newRulePreset)
    if (!preset) return
    setReminderSaving(true)
    try {
      const res = await fetch(`${API}/api/reminder-rules`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: bizId, offsetMinutes: preset.minutes, label: preset.label }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t('remindersSection.errorGeneric'))
      setReminderRules(prev => ({ ...prev, [bizId]: [...(prev[bizId] ?? []), data].sort((a, b) => a.offsetMinutes - b.offsetMinutes) }))
      success(t('remindersSection.successRuleAdded'))
    } catch (err: any) {
      showError(err.message ?? t('remindersSection.errorGeneric'))
    } finally {
      setReminderSaving(false)
    }
  }

  const handleToggleRule = async (bizId: string, ruleId: string, isActive: boolean) => {
    if (!user) return
    const res = await fetch(`${API}/api/reminder-rules/${ruleId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    })
    if (res.ok) {
      setReminderRules(prev => ({
        ...prev,
        [bizId]: (prev[bizId] ?? []).map(r => r.id === ruleId ? { ...r, isActive } : r),
      }))
    }
  }

  const handleDeleteRule = async (bizId: string, ruleId: string) => {
    if (!user) return
    const res = await fetch(`${API}/api/reminder-rules/${ruleId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok) {
      setReminderRules(prev => ({ ...prev, [bizId]: (prev[bizId] ?? []).filter(r => r.id !== ruleId) }))
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const v = e.target.value
    setForm(p => {
      // Auto-generate slug from name unless user manually edited it
      if (k === 'name' && !slugManual) {
        return { ...p, name: v, slug: toSlug(v) }
      }
      if (k === 'slug') {
        setSlugManual(true)
        return { ...p, slug: v.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) }
      }
      return { ...p, [k]: v }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
        {mode === 'view' && (
          <button onClick={() => { setMode('new'); setSlugManual(false); setForm({ name:'', slug:'', type:'SALON', description:'', address:'', phone:'', email:'' }) }}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
            {t('newBusinessButton')}
          </button>
        )}
      </div>

      {mode === 'new' ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm max-w-lg">
          <h2 className="font-semibold text-gray-900 mb-4">{t('newBusinessSection.title')}</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder={t('newBusinessSection.namePlaceholder')} value={form.name} onChange={set('name')}
                className="col-span-2 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <div>
                <input required placeholder={t('newBusinessSection.slugPlaceholder')} value={form.slug} onChange={set('slug')}
                  pattern="[a-z0-9\-]+" title={t('newBusinessSection.slugPatternTitle')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                {form.slug && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                    <span>🔗</span>
                    <span>{t('newBusinessSection.slugPreviewPrefix')}<strong className="text-gray-600">{form.slug}</strong></span>
                    {slugManual && (
                      <button type="button" onClick={() => { setSlugManual(false); setForm(p => ({ ...p, slug: toSlug(p.name) })) }}
                        className="text-blue-500 hover:text-blue-700 ml-1">{t('newBusinessSection.slugAuto')}</button>
                    )}
                  </p>
                )}
              </div>
              <select value={form.type} onChange={set('type')}
                className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none">
                {BIZ_TYPES.map(bt => <option key={bt} value={bt}>{TYPE_LABELS[bt]}</option>)}
              </select>
            </div>
            <textarea placeholder={t('newBusinessSection.descriptionPlaceholder')} value={form.description} onChange={set('description')} rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
            <input placeholder={t('newBusinessSection.addressPlaceholder')} value={form.address} onChange={set('address')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder={t('newBusinessSection.phonePlaceholder')} value={form.phone} onChange={set('phone')}
                className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <input type="email" placeholder={t('newBusinessSection.emailPlaceholder')} value={form.email} onChange={set('email')}
                className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            {createError && <p className="text-sm text-red-500">{createError}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setMode('view')}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">{t('newBusinessSection.cancel')}</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-60">
                {saving ? t('newBusinessSection.creating') : t('newBusinessSection.create')}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {businesses.map(b => {
            const photos = photoState[b.id] ?? { logoUrl: null, images: [] }
            const isEditingPhotos = editPhotos === b.id

            return (
              <div key={b.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Info row */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Logo preview */}
                      {photos.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photos.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-2xl shrink-0">
                          🏢
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">{b.name}</div>
                        <div className="text-sm text-gray-400">{TYPE_LABELS[b.type]} · /{b.slug}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize">
                        {b.subscriptionPlan}
                      </span>
                      <button
                        onClick={() => editingBiz === b.id ? setEditingBiz(null) : openEditBiz(b)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors
                          ${editingBiz === b.id ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {t('businessCard.editButton')}
                      </button>
                      <button
                        onClick={() => setEditPhotos(isEditingPhotos ? null : b.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors
                          ${isEditingPhotos ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {t('businessCard.photosButton')}
                      </button>
                      <button
                        onClick={() => editingPayment === b.id ? setEditingPayment(null) : openEditPayment(b)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors
                          ${editingPayment === b.id ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {b.hasBakaiCredentials ? t('businessCard.paymentButtonConnected') : t('businessCard.paymentButton')}
                      </button>
                      <button
                        onClick={() => editingReminders === b.id ? setEditingReminders(null) : openEditReminders(b)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors
                          ${editingReminders === b.id ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {t('businessCard.remindersButton')}
                      </button>
                      <button
                        onClick={() => setEditingTranslations(editingTranslations === b.id ? null : b.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors
                          ${editingTranslations === b.id ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {t('businessCard.translationsButton')}
                      </button>
                    </div>
                  </div>

                  {/* Gallery preview strip */}
                  {photos.images.length > 0 && !isEditingPhotos && (
                    <div className="mt-3 flex gap-1.5 overflow-hidden">
                      {photos.images.slice(0, 5).map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={url} src={url} alt=""
                          className="w-14 h-10 rounded-lg object-cover shrink-0" />
                      ))}
                      {photos.images.length > 5 && (
                        <div className="w-14 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                          {t('businessCard.morePhotos', { count: photos.images.length - 5 })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 text-xs text-gray-400">
                    {t('businessCard.pageLabel')}{' '}
                    <a href={`/b/${b.slug}`} target="_blank" className="text-blue-500 hover:underline">
                      /b/{b.slug}
                    </a>
                  </div>
                </div>

                {/* Info editor */}
                {editingBiz === b.id && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-3">
                    <div className="text-sm font-medium text-gray-700 mb-3">{t('editSection.title')}</div>
                    <input placeholder={t('editSection.namePlaceholder')} value={editBizForm.name}
                      onChange={e => setEditBizForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    <div className="grid grid-cols-2 gap-3">
                      <select value={editBizForm.type}
                        onChange={e => setEditBizForm(p => ({ ...p, type: e.target.value }))}
                        className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none">
                        {BIZ_TYPES.map(bt => <option key={bt} value={bt}>{TYPE_LABELS[bt]}</option>)}
                      </select>
                      <input placeholder={t('editSection.addressPlaceholder')} value={editBizForm.address}
                        onChange={e => setEditBizForm(p => ({ ...p, address: e.target.value }))}
                        className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    </div>
                    <textarea placeholder={t('editSection.descriptionPlaceholder')} value={editBizForm.description} rows={2}
                      onChange={e => setEditBizForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder={t('editSection.phonePlaceholder')} value={editBizForm.phone}
                        onChange={e => setEditBizForm(p => ({ ...p, phone: e.target.value }))}
                        className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                      <input type="email" placeholder={t('editSection.emailPlaceholder')} value={editBizForm.email}
                        onChange={e => setEditBizForm(p => ({ ...p, email: e.target.value }))}
                        className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={() => setEditingBiz(null)}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-white">
                        {t('editSection.cancel')}
                      </button>
                      <button type="button" onClick={() => handleUpdate(b.id)} disabled={saving}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                        {saving ? t('editSection.saving') : t('editSection.save')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Photo editor */}
                {isEditingPhotos && user && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-5">
                    {/* Logo */}
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">{t('photosSection.logoTitle')}</div>
                      <div className="flex items-center gap-3">
                        {photos.logoUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photos.logoUrl} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                        )}
                        <div className="flex flex-col gap-2">
                          <ImageUpload
                            images={photos.logoUrl ? [photos.logoUrl] : []}
                            onChange={urls => setPhotoState(prev => ({
                              ...prev,
                              [b.id]: { ...prev[b.id] ?? { images: [] }, logoUrl: urls[0] ?? null },
                            }))}
                            max={1}
                            label=""
                          />
                          {photos.logoUrl && (
                            <button
                              type="button"
                              onClick={() => setPhotoState(prev => ({
                                ...prev,
                                [b.id]: { ...prev[b.id] ?? { images: [] }, logoUrl: null },
                              }))}
                              className="text-xs text-red-400 hover:text-red-600"
                            >
                              {t('photosSection.removeLogo')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Gallery */}
                    <ImageUpload
                      images={photos.images}
                      onChange={urls => setPhotoState(prev => ({
                        ...prev,
                        [b.id]: { ...prev[b.id] ?? { logoUrl: null }, images: urls },
                      }))}
                      max={10}
                      label={t('photosSection.galleryLabel')}
                    />

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => savePhotos(b.id)}
                        disabled={saving}
                        className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                      >
                        {saving ? t('photosSection.saving') : t('photosSection.save')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditPhotos(null)}
                        className="px-5 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-white"
                      >
                        {t('photosSection.cancel')}
                      </button>
                    </div>
                  </div>
                )}
                {/* Payment settings */}
                {editingPayment === b.id && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-800 mb-1">{t('paymentSection.title')}</div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {t.rich('paymentSection.description', { b: (chunks) => <strong>{chunks}</strong> })}
                      </p>
                    </div>

                    {b.hasBakaiCredentials && (
                      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-xl px-3 py-2">
                        <span>✓</span>
                        <span>{t('paymentSection.connectedNotice')}</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <input
                        placeholder={t('paymentSection.usernamePlaceholder')}
                        value={paymentForm.bakaiUsername}
                        onChange={e => setPaymentForm(p => ({ ...p, bakaiUsername: e.target.value }))}
                        autoComplete="off"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                      />
                      <div className="relative">
                        <input
                          type={showBakaiPw ? 'text' : 'password'}
                          placeholder={t('paymentSection.passwordPlaceholder')}
                          value={paymentForm.bakaiPassword}
                          onChange={e => setPaymentForm(p => ({ ...p, bakaiPassword: e.target.value }))}
                          autoComplete="new-password"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowBakaiPw(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                        >
                          {showBakaiPw ? '🙈' : '👁'}
                        </button>
                      </div>
                    </div>

                    <div className="bg-amber-50 rounded-xl px-3 py-2.5 text-xs text-amber-700">
                      {t('paymentSection.activationWarning')}
                    </div>

                    <div className="flex gap-3">
                      {b.hasBakaiCredentials && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!user) return
                            setPaymentSaving(true)
                            try {
                              await fetch(`${API}/api/businesses/${b.id}`, {
                                method: 'PATCH',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ bakaiUsername: null, bakaiPassword: null }),
                              })
                              setBusinesses(prev => prev.map(biz => biz.id === b.id ? { ...biz, hasBakaiCredentials: false } : biz))
                              setEditingPayment(null)
                              success(t('paymentSection.successDisconnected'))
                            } catch {
                              showError(t('paymentSection.errorGeneric'))
                            } finally { setPaymentSaving(false) }
                          }}
                          disabled={paymentSaving}
                          className="px-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm hover:bg-red-50 disabled:opacity-60"
                        >
                          {t('paymentSection.disconnect')}
                        </button>
                      )}
                      <button type="button" onClick={() => setEditingPayment(null)}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-white">
                        {t('paymentSection.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSavePayment(b.id)}
                        disabled={paymentSaving || !paymentForm.bakaiUsername || !paymentForm.bakaiPassword}
                        className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60"
                      >
                        {paymentSaving ? t('paymentSection.saving') : t('paymentSection.save')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Content translations */}
                {editingTranslations === b.id && user && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50">
                    <ContentTranslationsPanel
                      entity="businesses"
                      id={b.id}
                      originalName={b.name}
                      originalDescription={b.description ?? null}
                      onClose={() => setEditingTranslations(null)}
                    />
                  </div>
                )}

                {/* Reminder rules */}
                {editingReminders === b.id && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-800 mb-1">{t('remindersSection.title')}</div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {t('remindersSection.description', { max: MAX_REMINDER_RULES })}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {(reminderRules[b.id] ?? []).length === 0 ? (
                        <p className="text-xs text-gray-400">{t('remindersSection.emptyText')}</p>
                      ) : (
                        (reminderRules[b.id] ?? []).map(rule => (
                          <div key={rule.id} className="flex items-center justify-between bg-white rounded-xl px-3.5 py-2.5">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleRule(b.id, rule.id, !rule.isActive)}
                                className={`w-9 h-5 rounded-full relative transition-colors shrink-0
                                  ${rule.isActive ? 'bg-purple-600' : 'bg-gray-200'}`}
                              >
                                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform
                                  ${rule.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                              </button>
                              <span className={`text-sm ${rule.isActive ? 'text-gray-800' : 'text-gray-400'}`}>{rule.label}</span>
                            </div>
                            <button onClick={() => handleDeleteRule(b.id, rule.id)}
                              className="text-xs text-red-400 hover:text-red-600">
                              {t('remindersSection.delete')}
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {(reminderRules[b.id] ?? []).length < MAX_REMINDER_RULES && (
                      <div className="flex gap-2">
                        <select value={newRulePreset} onChange={e => setNewRulePreset(e.target.value)}
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                          {REMINDER_PRESETS
                            .filter(p => !(reminderRules[b.id] ?? []).some(r => r.offsetMinutes === p.minutes))
                            .map(p => <option key={p.minutes} value={p.minutes}>{p.label}</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleAddRule(b.id)}
                          disabled={reminderSaving}
                          className="px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-60"
                        >
                          {t('remindersSection.addButton')}
                        </button>
                      </div>
                    )}

                    <button type="button" onClick={() => setEditingReminders(null)}
                      className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-white">
                      {t('remindersSection.done')}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
