'use client'

import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const LOCALES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'kg', label: 'Кыргызча' },
  { code: 'uz', label: "O'zbekcha" },
  { code: 'kk', label: 'Қазақша' },
]

type Entity = 'businesses' | 'resources' | 'services'

interface Props {
  entity: Entity
  id: string
  token: string
  originalName: string
  originalDescription?: string | null
  onClose: () => void
  onSaved?: () => void
}

interface TranslationRow {
  locale: string
  name: string | null
  description: string | null
}

export default function ContentTranslationsPanel({ entity, id, token, originalName, originalDescription, onClose, onSaved }: Props) {
  const [activeLocale, setActiveLocale] = useState('en')
  const [drafts, setDrafts] = useState<Record<string, { name: string; description: string }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedLocale, setSavedLocale] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/api/${entity}/${id}/translations`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((rows: TranslationRow[]) => {
        const map: Record<string, { name: string; description: string }> = {}
        for (const l of LOCALES) map[l.code] = { name: '', description: '' }
        for (const row of rows) {
          map[row.locale] = { name: row.name ?? '', description: row.description ?? '' }
        }
        setDrafts(map)
      })
      .finally(() => setLoading(false))
  }, [entity, id, token])

  const handleSave = async () => {
    setSaving(true)
    setSavedLocale(null)
    try {
      const draft = drafts[activeLocale] ?? { name: '', description: '' }
      const res = await fetch(`${API}/api/${entity}/${id}/translations/${activeLocale}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: draft.name.trim() || null,
          description: draft.description.trim() || null,
        }),
      })
      if (!res.ok) throw new Error()
      setSavedLocale(activeLocale)
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  const draft = drafts[activeLocale] ?? { name: '', description: '' }

  return (
    <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-800">🌐 Переводы контента</div>
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">Закрыть</button>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        Если перевод не заполнен, клиентам покажется оригинальный текст на русском.
      </p>

      <div className="bg-white rounded-xl p-3 text-xs text-gray-500">
        <div className="font-medium text-gray-700 mb-0.5">{originalName}</div>
        {originalDescription && <div className="line-clamp-2">{originalDescription}</div>}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {LOCALES.map(l => (
          <button
            key={l.code}
            onClick={() => { setActiveLocale(l.code); setSavedLocale(null) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
              ${activeLocale === l.code ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
          >
            {l.label}
            {drafts[l.code]?.name && <span className="ml-1 text-[10px]">✓</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          <input
            placeholder="Название"
            value={draft.name}
            onChange={e => setDrafts(p => ({ ...p, [activeLocale]: { ...draft, name: e.target.value } }))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {originalDescription !== undefined && (
            <textarea
              placeholder="Описание"
              rows={3}
              value={draft.description}
              onChange={e => setDrafts(p => ({ ...p, [activeLocale]: { ...draft, description: e.target.value } }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            />
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Сохраняем...' : 'Сохранить перевод'}
            </button>
            {savedLocale === activeLocale && <span className="text-xs text-green-600">✓ Сохранено</span>}
          </div>
        </div>
      )}
    </div>
  )
}
