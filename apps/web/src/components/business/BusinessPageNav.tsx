'use client'

import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useAuth } from '@/context/AuthContext'

export default function BusinessPageNav() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const t = useTranslations('Business')

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/explore" className="text-sm text-gray-500 hover:text-gray-800">{t('nav.back')}</Link>
        <Link href="/" className="text-blue-600 font-bold">{t('nav.brand')}</Link>
        {user ? (
          <div className="flex items-center gap-3">
            <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900">
              {user.name.split(' ')[0]}
            </Link>
            <button
              onClick={() => { logout(); router.push('/') }}
              className="text-xs text-gray-400 hover:text-gray-700">
              {t('nav.logout')}
            </button>
          </div>
        ) : (
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-800">{t('nav.login')}</Link>
        )}
      </div>
    </header>
  )
}
