'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

export default function BusinessPageNav() {
  const { user, logout } = useAuth()
  const router = useRouter()

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/explore" className="text-sm text-gray-500 hover:text-gray-800">← Назад</Link>
        <Link href="/" className="text-blue-600 font-bold">Booking</Link>
        {user ? (
          <div className="flex items-center gap-3">
            <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900">
              {user.name.split(' ')[0]}
            </Link>
            <button
              onClick={() => { logout(); router.push('/') }}
              className="text-xs text-gray-400 hover:text-gray-700">
              Выйти
            </button>
          </div>
        ) : (
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-800">Войти</Link>
        )}
      </div>
    </header>
  )
}
