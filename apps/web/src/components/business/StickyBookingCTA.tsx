'use client'

import { useEffect, useState } from 'react'

export default function StickyBookingCTA({ label = 'Записаться' }: { label?: string }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const bookingSection = document.getElementById('booking')
    if (!bookingSection) return

    const observer = new IntersectionObserver(
      ([entry]) => setShow(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px -100px 0px' }
    )
    observer.observe(bookingSection)
    return () => observer.disconnect()
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <button
        onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
        className="pointer-events-auto px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-semibold text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
      >
        📅 {label}
      </button>
    </div>
  )
}
