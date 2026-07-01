'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { useToast } from '@/context/ToastContext'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-sm ${i <= rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
      ))}
    </div>
  )
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-2">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-5 text-right">{count}</span>
    </div>
  )
}

export default function ReviewsPage() {
  const t = useTranslations('Dashboard.reviews')
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [businesses, setBusinesses] = useState<any[]>([])
  const [selectedBiz, setSelectedBiz] = useState('')
  const [businessId, setBusinessId] = useState('')
  const [reviews, setReviews] = useState<any[]>([])
  const [meta, setMeta] = useState({ total: 0, avgRating: 0, page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) return
    api.getMyBusinesses().then(b => {
      setBusinesses(b)
      if (b.length) { setSelectedBiz(b[0].slug); setBusinessId(b[0].id) }
    })
  }, [user])

  const loadReviews = (bizId: string, page = 1) => {
    setLoading(true)
    api.getReviews(bizId).then(r => {
      setReviews(r.reviews)
      setMeta({ total: r.total, avgRating: r.avgRating ?? 0, page, totalPages: r.totalPages ?? 1 })
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!businessId) return
    loadReviews(businessId)
  }, [businessId])

  const handleBizChange = (bizId: string) => {
    const biz = businesses.find(b => b.id === bizId)
    if (!biz) return
    setSelectedBiz(biz.slug)
    setBusinessId(biz.id)
  }

  const submitReply = async (reviewId: string) => {
    if (!user || !replyText[reviewId]?.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/api/reviews/${reviewId}/reply`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText[reviewId] }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? t('errorGeneric')) }
      const updated = await res.json()
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply: updated.reply } : r))
      setReplyingTo(null)
      setReplyText(p => ({ ...p, [reviewId]: '' }))
      success(t('successReplyAdded'))
    } catch (err: any) {
      showError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Rating distribution
  const dist = [5, 4, 3, 2, 1].map(r => ({
    r, count: reviews.filter(rev => rev.rating === r).length,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
        {businesses.length > 1 && (
          <select value={businessId} onChange={e => handleBizChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm focus:outline-none">
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>

      {/* Rating summary */}
      {meta.total > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 flex gap-6 items-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">{meta.avgRating.toFixed(1)}</div>
            <Stars rating={Math.round(meta.avgRating)} />
            <div className="text-xs text-gray-400 mt-1">{t('totalReviews', { count: meta.total })}</div>
          </div>
          <div className="flex-1 space-y-1.5">
            {dist.map(d => (
              <RatingBar key={d.r} label={String(d.r)} count={d.count} total={meta.total} />
            ))}
          </div>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-gray-500">{t('emptyTitle')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('emptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {r.customer?.name?.[0] ?? '?'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{r.customer?.name ?? t('defaultCustomer')}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <Stars rating={r.rating} />
              </div>

              {r.comment && (
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">{r.comment}</p>
              )}

              {/* Existing reply */}
              {r.reply && replyingTo !== r.id && (
                <div className="mt-3 ml-4 pl-3 border-l-2 border-blue-100">
                  <div className="text-xs font-semibold text-blue-700 mb-0.5">{t('ownerReply')}</div>
                  <p className="text-sm text-gray-600">{r.reply}</p>
                  <button
                    onClick={() => { setReplyingTo(r.id); setReplyText(p => ({ ...p, [r.id]: r.reply })) }}
                    className="text-xs text-blue-400 hover:text-blue-600 mt-1">
                    {t('editReply')}
                  </button>
                </div>
              )}

              {/* Reply form */}
              {replyingTo === r.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={replyText[r.id] ?? ''}
                    onChange={e => setReplyText(p => ({ ...p, [r.id]: e.target.value }))}
                    placeholder={t('replyPlaceholder')}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitReply(r.id)}
                      disabled={submitting || !replyText[r.id]?.trim()}
                      className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 disabled:opacity-60">
                      {submitting ? t('sending') : t('publishReply')}
                    </button>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="px-4 py-1.5 border border-gray-200 text-xs text-gray-600 rounded-xl hover:bg-gray-50">
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              ) : !r.reply && (
                <button
                  onClick={() => { setReplyingTo(r.id); setReplyText(p => ({ ...p, [r.id]: '' })) }}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium">
                  {t('addReply')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
