'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

const navItems = [
  { href: '/dashboard',               label: 'Обзор',       icon: '▦',  mobileLabel: 'Обзор' },
  { href: '/dashboard/bookings',      label: 'Брони',       icon: '📅', mobileLabel: 'Брони' },
  { href: '/dashboard/stats',         label: 'Статистика',  icon: '📊', mobileLabel: 'Стат.' },
  { href: '/dashboard/resources',     label: 'Ресурсы',     icon: '🪑', mobileLabel: 'Ресурсы' },
  { href: '/dashboard/services',      label: 'Услуги',      icon: '✂️', mobileLabel: 'Услуги' },
  { href: '/dashboard/staff',         label: 'Персонал',    icon: '👥', mobileLabel: 'Персонал' },
  { href: '/dashboard/reviews',       label: 'Отзывы',      icon: '💬', mobileLabel: 'Отзывы' },
  { href: '/dashboard/schedule',      label: 'Выходные',    icon: '🏖️', mobileLabel: 'Выходные' },
  { href: '/dashboard/cancellation',  label: 'Отмена',      icon: '🔄', mobileLabel: 'Отмена' },
  { href: '/dashboard/settings',      label: 'Настройки',   icon: '⚙️', mobileLabel: 'Настройки' },
]

// First 4 items appear in mobile bottom nav, rest go in sidebar only
const mobileNavItems = navItems.slice(0, 4)

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const SidebarContent = () => (
    <>
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="text-xl font-bold text-blue-600">Booking</div>
        <div className="text-xs text-gray-400 mt-0.5 truncate">{user.name}</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors
              ${pathname === item.href
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5 shrink-0">
        <Link href="/profile"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors
            ${pathname === '/profile' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>
          <span>👤</span> Профиль
        </Link>
        {user.role === 'SUPERADMIN' && (
          <Link href="/admin"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-purple-600 hover:bg-purple-50 font-medium">
            <span>🛡️</span> Админка
          </Link>
        )}
        <button
          onClick={() => { logout(); router.push('/login') }}
          className="w-full text-left px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
          Выйти
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-100 flex-col fixed h-full z-20">
        <SidebarContent />
      </aside>

      {/* Mobile drawer overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={`md:hidden fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col z-30
        transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="text-lg font-bold text-blue-600">Booking</div>
          <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors
                ${pathname === item.href
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100 space-y-0.5 shrink-0">
          <div className="px-3 py-2 text-sm font-medium text-gray-900">{user.name}</div>
          <div className="px-3 py-1 text-xs text-gray-400">{user.email}</div>
          <Link href="/profile" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
            <span>👤</span> Профиль
          </Link>
          <button onClick={() => { logout(); router.push('/login') }}
            className="w-full text-left px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-50 flex items-center gap-2.5">
            <span>🚪</span> Выйти
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-56 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="text-sm font-bold text-blue-600">
            {navItems.find(n => n.href === pathname)?.label ?? 'Dashboard'}
          </div>
          <Link href="/profile" className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user.name[0]?.toUpperCase()}
          </Link>
        </div>

        {/* Page content — extra bottom padding on mobile for bottom nav */}
        <div className="p-4 md:p-6 pb-24 md:pb-6 flex-1">{children}</div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-100">
          <div className="grid grid-cols-5 h-16">
            {mobileNavItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors
                  ${pathname === item.href ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span>{item.mobileLabel}</span>
              </Link>
            ))}
            {/* "Ещё" button to open drawer */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-gray-400 hover:text-gray-600"
            >
              <span className="text-xl leading-none">☰</span>
              <span>Ещё</span>
            </button>
          </div>
        </nav>
      </main>
    </div>
  )
}
