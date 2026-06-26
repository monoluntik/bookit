'use client'

import { useState } from 'react'

interface Props {
  images: string[]
}

export default function GallerySection({ images }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  if (images.length === 0) return null

  const [first, ...rest] = images

  return (
    <div className="mt-4 mb-6">
      {/* Mosaic grid */}
      <div className={`grid gap-1.5 rounded-2xl overflow-hidden
        ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>

        {/* First (large) image */}
        <div
          className={`relative cursor-pointer overflow-hidden bg-gray-100
            ${images.length >= 3 ? 'row-span-2' : ''}`}
          style={{ aspectRatio: images.length >= 3 ? '4/5' : '16/9' }}
          onClick={() => setLightbox(0)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={first} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
        </div>

        {/* Secondary images */}
        {rest.slice(0, images.length >= 4 ? 3 : 1).map((url, i) => {
          const idx = i + 1
          const isLast = idx === 3 && images.length > 4
          return (
            <div key={url}
              className="relative cursor-pointer overflow-hidden bg-gray-100"
              style={{ aspectRatio: images.length >= 3 ? '4/3' : '16/9' }}
              onClick={() => setLightbox(isLast ? null : idx)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              {isLast && (
                <button
                  onClick={e => { e.stopPropagation(); setLightbox(idx) }}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-sm">
                  +{images.length - 4} фото
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* "See all" button if > 4 */}
      {images.length > 4 && (
        <button
          onClick={() => setLightbox(0)}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Посмотреть все {images.length} фото →
        </button>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl w-10 h-10 flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>

          {/* Prev */}
          {lightbox > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl w-12 h-12 flex items-center justify-center bg-white/10 rounded-full"
              onClick={e => { e.stopPropagation(); setLightbox(l => Math.max(0, (l ?? 1) - 1)) }}
            >
              ‹
            </button>
          )}

          <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[lightbox]}
              alt=""
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
            <div className="text-center text-white/50 text-sm mt-3">
              {lightbox + 1} / {images.length}
            </div>
          </div>

          {/* Next */}
          {lightbox < images.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl w-12 h-12 flex items-center justify-center bg-white/10 rounded-full"
              onClick={e => { e.stopPropagation(); setLightbox(l => Math.min(images.length - 1, (l ?? 0) + 1)) }}
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  )
}
