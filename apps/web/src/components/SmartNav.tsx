'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

export default function SmartNav() {
  const { user, logout } = useAuth()
  const router = useRouter()

  return (
    <header className="border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600">Booking</Link>
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/explore" className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5">Каталог</Link>
          <Link href="/guide" className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5">Гайд</Link>
          <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5">Тарифы</Link>
        </nav>
        <div className="flex items-center gap-2">
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
      </div>
    </header>
  )
}
