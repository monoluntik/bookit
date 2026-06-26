'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

export default function SmartNav() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!mobileOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [mobileOpen])

  return (
    <>
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">Booking</Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/explore" className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5">Каталог</Link>
            <Link href="/guide" className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5">Гайд</Link>
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5">Тарифы</Link>
          </nav>
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5">
                  {user.name.split(' ')[0]}
                </Link>
                <Link href="/dashboard" className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-xl hover:bg-blue-700">
                  Дашборд
                </Link>
                <button onClick={() => { logout(); router.push('/') }}
                  className="text-sm text-gray-400 hover:text-gray-700 px-2 py-1.5">
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5">Войти</Link>
                <Link href="/register" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5">Регистрация</Link>
                <Link href="/dashboard" className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-xl hover:bg-blue-700">
                  Бизнесу
                </Link>
              </>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Меню"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-white md:hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <Link href="/" className="text-xl font-bold text-blue-600" onClick={() => setMobileOpen(false)}>Booking</Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              aria-label="Закрыть"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col px-4 py-6 gap-1">
            <Link href="/explore" onClick={() => setMobileOpen(false)}
              className="text-base text-gray-700 hover:text-gray-900 px-3 py-3 rounded-xl hover:bg-gray-50">
              Каталог
            </Link>
            <Link href="/guide" onClick={() => setMobileOpen(false)}
              className="text-base text-gray-700 hover:text-gray-900 px-3 py-3 rounded-xl hover:bg-gray-50">
              Гайд
            </Link>
            <Link href="/pricing" onClick={() => setMobileOpen(false)}
              className="text-base text-gray-700 hover:text-gray-900 px-3 py-3 rounded-xl hover:bg-gray-50">
              Тарифы
            </Link>
            <div className="border-t border-gray-100 mt-2 pt-4 flex flex-col gap-1">
              {user ? (
                <>
                  <Link href="/profile" onClick={() => setMobileOpen(false)}
                    className="text-base text-gray-700 hover:text-gray-900 px-3 py-3 rounded-xl hover:bg-gray-50">
                    {user.name.split(' ')[0]}
                  </Link>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                    className="text-base bg-blue-600 text-white px-3 py-3 rounded-xl hover:bg-blue-700 text-center font-medium">
                    Дашборд
                  </Link>
                  <button onClick={() => { logout(); router.push('/'); setMobileOpen(false) }}
                    className="text-base text-left text-red-500 hover:text-red-700 px-3 py-3 rounded-xl hover:bg-red-50">
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)}
                    className="text-base text-gray-700 hover:text-gray-900 px-3 py-3 rounded-xl hover:bg-gray-50">
                    Войти
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}
                    className="text-base text-gray-700 hover:text-gray-900 px-3 py-3 rounded-xl hover:bg-gray-50">
                    Регистрация
                  </Link>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                    className="text-base bg-blue-600 text-white px-3 py-3 rounded-xl hover:bg-blue-700 text-center font-medium">
                    Бизнесу
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
