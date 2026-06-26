'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 text-sm">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

export default function AdminReviewsPage() {
  const { token } = useAuth()
  const { success, error: showError } = useToast()
  const [reviews, setReviews] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  const load = (p = 1) => {
    if (!token) return
    setLoading(true)
    fetch(`${API}/api/admin/reviews?page=${p}&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => {
      setReviews(d.reviews ?? [])
      setTotal(d.total ?? 0)
      setTotalPages(d.totalPages ?? 1)
      setPage(p)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [token])

  const deleteReview = async (id: string) => {
    if (!token || !confirm('Удалить этот отзыв?')) return
    try {
      const res = await fetch(`${API}/api/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Ошибка')
      setReviews(prev => prev.filter(r => r.id !== id))
      setTotal(t => t - 1)
      success('Отзыв удалён')
    } catch { showError('Ошибка удаления') }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">
        Отзывы
        <span className="ml-3 text-base font-normal text-gray-500">{total} всего</span>
      </h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-gray-800 rounded-2xl border border-gray-700 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {r.customer?.name?.[0] ?? '?'}
                      </div>
                      <span className="text-sm font-medium text-white">{r.customer?.name ?? 'Клиент'}</span>
                    </div>
                    <Stars rating={r.rating} />
                    <Link href={`/b/${r.business?.slug}`} target="_blank"
                      className="text-xs text-blue-400 hover:text-blue-300">
                      {r.business?.name} ↗
                    </Link>
                    <span className="text-xs text-gray-500 ml-auto">
                      {new Date(r.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-gray-300 mt-2 leading-relaxed">{r.comment}</p>
                  )}
                  {r.reply && (
                    <div className="mt-2 pl-3 border-l-2 border-blue-700">
                      <span className="text-xs text-blue-400 font-semibold">Ответ владельца: </span>
                      <span className="text-xs text-gray-400">{r.reply}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deleteReview(r.id)}
                  className="px-2.5 py-1.5 text-xs bg-red-900/40 text-red-400 rounded-lg hover:bg-red-900 transition-colors shrink-0">
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Страница {page} из {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => load(page - 1)}
              className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-700">← Назад</button>
            <button disabled={page >= totalPages} onClick={() => load(page + 1)}
              className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-700">Вперёд →</button>
          </div>
        </div>
      )}
    </div>
  )
}
