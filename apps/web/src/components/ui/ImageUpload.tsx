'use client'

import { useRef, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface Props {
  images: string[]
  onChange: (urls: string[]) => void
  token: string
  max?: number
  label?: string
}

export default function ImageUpload({ images, onChange, token, max = 10, label }: Props) {
  const t = useTranslations('Dashboard.imageUpload')
  const resolvedLabel = label ?? t('defaultLabel')
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  const upload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (images.length + files.length > max) {
      setError(t('maxPhotos', { max }))
      return
    }
    setError('')
    setUploading(true)
    const newUrls: string[] = []
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch(`${API}/api/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? t('uploadError'))
        newUrls.push(data.url)
      } catch (err: any) {
        setError(err.message)
      }
    }
    if (newUrls.length > 0) onChange([...images, ...newUrls])
    setUploading(false)
  }, [images, onChange, token, max, t])

  const removeImage = async (url: string) => {
    onChange(images.filter(u => u !== url))
    await fetch(`${API}/api/upload`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url }),
    }).catch(() => {})
  }

  const moveImage = (from: number, to: number) => {
    const arr = [...images]
    const [item] = arr.splice(from, 1)
    arr.splice(to, 0, item)
    onChange(arr)
  }

  return (
    <div>
      <div className="text-sm font-medium text-gray-700 mb-2">{resolvedLabel}</div>

      {/* Grid of uploaded images */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {images.map((url, i) => (
            <div key={url} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />

              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {i > 0 && (
                  <button type="button" onClick={() => moveImage(i, i - 1)}
                    title={t('moveLeft')}
                    className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 hover:bg-white">
                    ‹
                  </button>
                )}
                {i < images.length - 1 && (
                  <button type="button" onClick={() => moveImage(i, i + 1)}
                    title={t('moveRight')}
                    className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 hover:bg-white">
                    ›
                  </button>
                )}
                <button type="button" onClick={() => removeImage(url)}
                  title={t('delete')}
                  className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white hover:bg-red-600">
                  ✕
                </button>
              </div>

              {/* First image badge */}
              {i === 0 && (
                <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-md font-semibold">
                  {t('mainBadge')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {images.length < max && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
            ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={e => upload(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-400">{t('uploading')}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div className="text-3xl text-gray-300">📷</div>
              <div className="text-sm font-medium text-gray-600">
                {t('dropHint')}
              </div>
              <div className="text-xs text-gray-400">
                {t('fileHint', { max })}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  )
}
