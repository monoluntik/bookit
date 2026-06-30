'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface Props {
  bookingId: string
  token: string
  onSuccess?: () => void
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className={`text-2xl transition-transform hover:scale-110
            ${i <= (hovered || value) ? 'text-amber-400' : 'text-gray-200'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function ReviewForm({ bookingId, token, onSuccess }: Props) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const t = useTranslations('Business')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) { setError(t('reviews.selectRatingError')); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingId, rating, comment: comment || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t('reviews.genericError'))
      setDone(true)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="text-3xl mb-2">⭐</div>
        <div className="font-medium text-gray-900 text-sm">{t('reviews.thankYou')}</div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <div className="text-sm font-medium text-gray-700 mb-1.5">{t('reviews.yourRating')}</div>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <textarea
        placeholder={t('reviews.commentPlaceholder')}
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={3}
        maxLength={1000}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button type="submit" disabled={loading || rating === 0}
        className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
        {loading ? t('reviews.submitting') : t('reviews.submit')}
      </button>
    </form>
  )
}
