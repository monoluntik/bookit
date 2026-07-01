'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname, Link } from '@/i18n/navigation'
import { useAuth } from '@/context/AuthContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const t = useTranslations('Dashboard.nav')

  const navItems = [
    { href: '/dashboard',               label: t('overview'),    icon: '▦',  mobileLabel: t('overview') },
    { href: '/dashboard/bookings',      label: t('bookings'),    icon: '📅', mobileLabel: t('bookings') },
    { href: '/dashboard/stats',         label: t('stats'),       icon: '📊', mobileLabel: t('statsShort') },
    { href: '/dashboard/resources',     label: t('resources'),   icon: '🪑', mobileLabel: t('resources') },
    { href: '/dashboard/services',      label: t('services'),    icon: '✂️', mobileLabel: t('services') },
    { href: '/dashboard/staff',         label: t('staff'),       icon: '👥', mobileLabel: t('staff') },
    { href: '/dashboard/reviews',       label: t('reviews'),     icon: '💬', mobileLabel: t('reviews') },
    { href: '/dashboard/schedule',      label: t('schedule'),    icon: '🏖️', mobileLabel: t('schedule') },
    { href: '/dashboard/cancellation',  label: t('cancellation'), icon: '🔄', mobileLabel: t('cancellation') },
    { href: '/dashboard/settings',      label: t('settings'),    icon: '⚙️', mobileLabel: t('settings') },
  ]

  // First 4 items appear in mobile bottom nav, rest go in sidebar only
  const mobileNavItems = navItems.slice(0, 4)

  useEffect(() => {
    if (!loading && !user) router.push('/auth?redirect=/dashboard')
  }, [user, loading, router])

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  useEffect(() => {
    if (!user) return
    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
    fetch(`${API}/api/bookings/mine?status=PENDING&limit=100`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => setPendingCount(data.bookings?.length ?? 0))
      .catch(() => {})
  }, [user])

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
            {item.href === '/dashboard/bookings' && pendingCount > 0 && (
              <span className="ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5 shrink-0">
        <div className="px-3 pb-2">
          <LanguageSwitcher className="w-full" />
        </div>
        <Link href="/profile"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors
            ${pathname === '/profile' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>
          <span>👤</span> {t('profile')}
        </Link>
        {user.role === 'SUPERADMIN' && (
          <Link href="/admin"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-purple-600 hover:bg-purple-50 font-medium">
            <span>🛡️</span> {t('admin')}
          </Link>
        )}
        <button
          onClick={() => { logout(); router.push('/auth') }}
          className="w-full text-left px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
          {t('logout')}
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
              {item.href === '/dashboard/bookings' && pendingCount > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100 space-y-0.5 shrink-0">
          <div className="px-3 py-2 text-sm font-medium text-gray-900">{user.name}</div>
          <div className="px-3 py-1 text-xs text-gray-400">{user.email}</div>
          <div className="px-3 pb-2">
            <LanguageSwitcher className="w-full" />
          </div>
          <Link href="/profile" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
            <span>👤</span> {t('profile')}
          </Link>
          <button onClick={() => { logout(); router.push('/auth') }}
            className="w-full text-left px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-50 flex items-center gap-2.5">
            <span>🚪</span> {t('logout')}
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
                className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors relative
                  ${pathname === item.href ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <span className="text-xl leading-none relative">
                  {item.icon}
                  {item.href === '/dashboard/bookings' && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </span>
                <span>{item.mobileLabel}</span>
              </Link>
            ))}
            {/* "Ещё" button to open drawer */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-gray-400 hover:text-gray-600"
            >
              <span className="text-xl leading-none">☰</span>
              <span>{t('more')}</span>
            </button>
          </div>
        </nav>
      </main>
    </div>
  )
}
