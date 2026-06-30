'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { useAuth } from '@/context/AuthContext'

export default function CustomerBottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const t = useTranslations('Common.bottomNav')

  const NAV = [
    { href: '/', label: t('home'), icon: '🏠' },
    { href: '/explore', label: t('explore'), icon: '🔍' },
    { href: '/my-bookings', label: t('bookings'), icon: '📅' },
    { href: '/profile', label: t('profile'), icon: '👤' },
  ]

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
