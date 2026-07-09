'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  return (
    <div className={`flex gap-0.5 ${size === 'lg' ? 'text-xl' : 'text-sm'}`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= rating ? 'text-amber-400' : 'text-gray-200'}>★</span>
      ))}
    </div>
  )
}

interface Props {
  businessId: string
  isOwner?: boolean
}

export default function ReviewsList({ businessId, isOwner }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [replyId, setReplyId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [saving, setSaving] = useState(false)
  const t = useTranslations('Business')

  const load = () => {
    setError(false)
    fetch(`${API}/api/reviews/business/${businessId}?limit=20`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [businessId])

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return
    setSaving(true)
    try {
      await fetch(`${API}/api/reviews/${reviewId}/reply`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText }),
      })
      setReplyId(null)
      setReplyText('')
      load()
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center text-gray-400 text-sm py-4">{t('reviews.loading')}</div>
  if (error) return <div className="text-center text-red-400 text-sm py-4">{t('reviews.genericError')}</div>
  if (!data || data.total === 0) return (
    <div className="text-center text-gray-400 text-sm py-6">
      <div className="text-2xl mb-2">⭐</div>
      {t('reviews.empty')}
    </div>
  )

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-amber-50 rounded-2xl">
        <div className="text-center">
          <div className="text-4xl font-bold text-amber-600">{data.avgRating}</div>
          <Stars rating={Math.round(data.avgRating)} size="lg" />
          <div className="text-xs text-gray-400 mt-1">{t('reviews.reviewCount', { count: data.reviewCount })}</div>
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {data.reviews.map((r: any) => (
          <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-medium text-gray-900 text-sm">{r.customer?.name ?? t('reviews.anonymousCustomer')}</div>
                <div className="text-xs text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <Stars rating={r.rating} />
            </div>
            {r.comment && <p className="text-sm text-gray-600 leading-relaxed mb-2">{r.comment}</p>}

            {/* Owner reply */}
            {r.reply && (
              <div className="mt-3 p-3 bg-blue-50 rounded-xl border-l-2 border-blue-300">
                <div className="text-xs font-semibold text-blue-700 mb-1">{t('reviews.ownerReply')}</div>
                <p className="text-sm text-gray-600">{r.reply}</p>
              </div>
            )}

            {/* Reply form for owner */}
            {isOwner && !r.reply && (
              replyId === r.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={t('reviews.replyPlaceholder')}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleReply(r.id)} disabled={saving || !replyText.trim()}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-60">
                      {saving ? t('reviews.replySubmitting') : t('reviews.replySubmit')}
                    </button>
                    <button onClick={() => { setReplyId(null); setReplyText('') }}
                      className="px-3 py-1.5 border border-gray-200 text-xs rounded-lg text-gray-500 hover:bg-gray-50">
                      {t('reviews.replyCancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setReplyId(r.id); setReplyText('') }}
                  className="mt-2 text-xs text-blue-500 hover:text-blue-700">
                  {t('reviews.replyAction')}
                </button>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
