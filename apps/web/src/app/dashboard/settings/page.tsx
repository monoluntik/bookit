'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import ImageUpload from '@/components/ui/ImageUpload'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const BIZ_TYPES = ['HOTEL','RESTAURANT','SALON','COWORKING','SPORT','MEDICAL','CUSTOM']
const TYPE_LABELS: Record<string, string> = {
  HOTEL:'Отель', RESTAURANT:'Ресторан', SALON:'Салон', COWORKING:'Коворкинг',
  SPORT:'Спорт', MEDICAL:'Медицина', CUSTOM:'Другое',
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
}

export default function SettingsPage() {
  const { token } = useAuth()
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

  // Photos state per business
  const [photoState, setPhotoState] = useState<Record<string, { logoUrl: string | null; images: string[] }>>({})

  useEffect(() => {
    if (!token) return
    api.getMyBusinesses(token).then(b => {
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
  }, [token])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setCreateError('')
    try {
      const res = await fetch(`${API}/api/businesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      const biz = await res.json()
      if (!res.ok) throw new Error(typeof biz.error === 'string' ? biz.error : 'Ошибка создания')
      setBusinesses(prev => [...prev, biz])
      setMode('view')
      success('Бизнес создан!')
    } catch (err: any) {
      setCreateError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const savePhotos = async (bizId: string) => {
    if (!token) return
    const state = photoState[bizId]
    if (!state) return
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/businesses/${bizId}/images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ logoUrl: state.logoUrl, images: state.images }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Ошибка') }
      setEditPhotos(null)
      success('Фотографии сохранены')
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
    if (!token) return
    setSaving(true)
    try {
      await api.updateBusiness(bizId, editBizForm, token)
      setBusinesses(prev => prev.map(b => b.id === bizId ? { ...b, ...editBizForm } : b))
      setEditingBiz(null)
      success('Бизнес обновлён')
    } catch (err: any) {
      showError(err.message ?? 'Ошибка')
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
    if (!token) return
    setPaymentSaving(true)
    try {
      const res = await fetch(`${API}/api/businesses/${bizId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bakaiUsername: paymentForm.bakaiUsername || null,
          bakaiPassword: paymentForm.bakaiPassword || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Ошибка')
      setBusinesses(prev => prev.map(b => b.id === bizId ? { ...b, hasBakaiCredentials: data.hasBakaiCredentials } : b))
      setEditingPayment(null)
      success('Настройки оплаты сохранены')
    } catch (err: any) {
      showError(err.message ?? 'Ошибка')
    } finally {
      setPaymentSaving(false)
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
        <h1 className="text-xl font-bold text-gray-900">Настройки</h1>
        {mode === 'view' && (
          <button onClick={() => { setMode('new'); setSlugManual(false); setForm({ name:'', slug:'', type:'SALON', description:'', address:'', phone:'', email:'' }) }}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
            + Новый бизнес
          </button>
        )}
      </div>

      {mode === 'new' ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm max-w-lg">
          <h2 className="font-semibold text-gray-900 mb-4">Новый бизнес</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Название" value={form.name} onChange={set('name')}
                className="col-span-2 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <div>
                <input required placeholder="slug (латиница, дефис)" value={form.slug} onChange={set('slug')}
                  pattern="[a-z0-9\-]+" title="Только латиница, цифры и дефис"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                {form.slug && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                    <span>🔗</span>
                    <span>booking.app/b/<strong className="text-gray-600">{form.slug}</strong></span>
                    {slugManual && (
                      <button type="button" onClick={() => { setSlugManual(false); setForm(p => ({ ...p, slug: toSlug(p.name) })) }}
                        className="text-blue-500 hover:text-blue-700 ml-1">↺ авто</button>
                    )}
                  </p>
                )}
              </div>
              <select value={form.type} onChange={set('type')}
                className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none">
                {BIZ_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <textarea placeholder="Описание" value={form.description} onChange={set('description')} rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
            <input placeholder="Адрес" value={form.address} onChange={set('address')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Телефон" value={form.phone} onChange={set('phone')}
                className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <input type="email" placeholder="Email" value={form.email} onChange={set('email')}
                className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            {createError && <p className="text-sm text-red-500">{createError}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setMode('view')}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Отмена</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-60">
                {saving ? 'Создаём...' : 'Создать'}
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
                        ✏️ Изменить
                      </button>
                      <button
                        onClick={() => setEditPhotos(isEditingPhotos ? null : b.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors
                          ${isEditingPhotos ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        📷 Фото
                      </button>
                      <button
                        onClick={() => editingPayment === b.id ? setEditingPayment(null) : openEditPayment(b)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors
                          ${editingPayment === b.id ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {b.hasBakaiCredentials ? '💳 Оплата ✓' : '💳 Оплата'}
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
                          +{photos.images.length - 5}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 text-xs text-gray-400">
                    Страница:{' '}
                    <a href={`/b/${b.slug}`} target="_blank" className="text-blue-500 hover:underline">
                      /b/{b.slug}
                    </a>
                  </div>
                </div>

                {/* Info editor */}
                {editingBiz === b.id && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-3">
                    <div className="text-sm font-medium text-gray-700 mb-3">Основная информация</div>
                    <input placeholder="Название" value={editBizForm.name}
                      onChange={e => setEditBizForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    <div className="grid grid-cols-2 gap-3">
                      <select value={editBizForm.type}
                        onChange={e => setEditBizForm(p => ({ ...p, type: e.target.value }))}
                        className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none">
                        {BIZ_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                      </select>
                      <input placeholder="Адрес" value={editBizForm.address}
                        onChange={e => setEditBizForm(p => ({ ...p, address: e.target.value }))}
                        className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    </div>
                    <textarea placeholder="Описание" value={editBizForm.description} rows={2}
                      onChange={e => setEditBizForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder="Телефон" value={editBizForm.phone}
                        onChange={e => setEditBizForm(p => ({ ...p, phone: e.target.value }))}
                        className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                      <input type="email" placeholder="Email" value={editBizForm.email}
                        onChange={e => setEditBizForm(p => ({ ...p, email: e.target.value }))}
                        className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={() => setEditingBiz(null)}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-white">
                        Отмена
                      </button>
                      <button type="button" onClick={() => handleUpdate(b.id)} disabled={saving}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                        {saving ? 'Сохраняем...' : 'Сохранить'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Photo editor */}
                {isEditingPhotos && token && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-5">
                    {/* Logo */}
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Логотип / обложка</div>
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
                            token={token}
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
                              Удалить логотип
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
                      token={token}
                      max={10}
                      label="Галерея (до 10 фото)"
                    />

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => savePhotos(b.id)}
                        disabled={saving}
                        className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                      >
                        {saving ? 'Сохраняем...' : 'Сохранить фото'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditPhotos(null)}
                        className="px-5 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-white"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
                {/* Payment settings */}
                {editingPayment === b.id && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-800 mb-1">Онлайн-оплата через Bakai</div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Деньги поступают напрямую на ваш счёт в Bakai. Для настройки:
                        войдите в <strong>Bakai Бизнес</strong> → «Внешние сервисы» → создайте подключение «Создание платёжной ссылки» →
                        скачайте PDF с логином и паролем.
                      </p>
                    </div>

                    {b.hasBakaiCredentials && (
                      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-xl px-3 py-2">
                        <span>✓</span>
                        <span>Онлайн-оплата подключена. Введите новые данные чтобы обновить.</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <input
                        placeholder="Логин из PDF (username)"
                        value={paymentForm.bakaiUsername}
                        onChange={e => setPaymentForm(p => ({ ...p, bakaiUsername: e.target.value }))}
                        autoComplete="off"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                      />
                      <div className="relative">
                        <input
                          type={showBakaiPw ? 'text' : 'password'}
                          placeholder="Пароль из PDF (password)"
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
                      Перед сохранением убедитесь, что вы активировали подключение в Bakai Бизнес
                      (статус должен быть «Активен», не «Требует активации»).
                    </div>

                    <div className="flex gap-3">
                      {b.hasBakaiCredentials && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!token) return
                            setPaymentSaving(true)
                            try {
                              await fetch(`${API}/api/businesses/${b.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ bakaiUsername: null, bakaiPassword: null }),
                              })
                              setBusinesses(prev => prev.map(biz => biz.id === b.id ? { ...biz, hasBakaiCredentials: false } : biz))
                              setEditingPayment(null)
                              success('Оплата отключена')
                            } catch {
                              showError('Ошибка')
                            } finally { setPaymentSaving(false) }
                          }}
                          disabled={paymentSaving}
                          className="px-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm hover:bg-red-50 disabled:opacity-60"
                        >
                          Отключить
                        </button>
                      )}
                      <button type="button" onClick={() => setEditingPayment(null)}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-white">
                        Отмена
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSavePayment(b.id)}
                        disabled={paymentSaving || !paymentForm.bakaiUsername || !paymentForm.bakaiPassword}
                        className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60"
                      >
                        {paymentSaving ? 'Сохраняем...' : 'Сохранить'}
                      </button>
                    </div>
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
