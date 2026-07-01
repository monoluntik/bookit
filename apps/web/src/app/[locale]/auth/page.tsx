'use client'

import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import PhoneAuthFlow from '@/components/auth/PhoneAuthFlow'

function AuthForm() {
  const t = useTranslations('Auth')
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get('redirect') ?? '/dashboard'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-600 mb-1 block">{t('brand')}</Link>
          <p className="text-gray-500 text-sm">{t('subtitle')}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <PhoneAuthFlow onAuthenticated={() => router.push(redirect)} />
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return <Suspense><AuthForm /></Suspense>
}
