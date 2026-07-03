'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { useAuth } from '@/context/AuthContext'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)
  const t = useTranslations('Admin.nav')

  const navItems = [
    { href: '/admin',             label: t('overview'),    icon: '▦' },
    { href: '/admin/users',       label: t('users'),       icon: '👤' },
    { href: '/admin/businesses',  label: t('businesses'),  icon: '🏢' },
    { href: '/admin/reviews',     label: t('reviews'),     icon: '💬' },
  ]

  useEffect(() => {
    if (loading) return
    if (!user || user.role !== 'SUPERADMIN') {
      router.replace('/auth?redirect=/admin')
    } else {
      setChecked(true)
    }
  }, [user, loading, router])

  if (!checked) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-52 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-4 py-4 border-b border-gray-800">
          <div className="text-white font-bold text-sm">Bronly Admin</div>
          <div className="text-gray-500 text-xs mt-0.5">{user?.email}</div>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
                  ${active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-2 pb-4 space-y-0.5">
          <Link href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-800 hover:text-white transition-colors">
            <span>↩</span> {t('dashboard')}
          </Link>
          <Link href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-800 hover:text-white transition-colors">
            <span>🌐</span> {t('site')}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  )
}
