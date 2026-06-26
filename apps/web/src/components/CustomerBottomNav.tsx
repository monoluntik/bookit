'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

const NAV = [
  { href: '/', label: 'Главная', icon: '🏠' },
  { href: '/explore', label: 'Каталог', icon: '🔍' },
  { href: '/my-bookings', label: 'Брони', icon: '📅' },
  { href: '/profile', label: 'Профиль', icon: '👤' },
]

export default function CustomerBottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 flex sm:hidden safe-area-pb">
      {NAV.map(item => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
        return (
          <Link key={item.href} href={item.href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors
              ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
