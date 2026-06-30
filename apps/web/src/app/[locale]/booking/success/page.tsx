import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export default async function PaymentSuccess() {
  const t = await getTranslations('Booking.success')
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">{t('title')}</h1>
        <p className="text-gray-500 text-sm mb-6">{t('subtitle')}</p>
        <Link href="/" className="block w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
          {t('home')}
        </Link>
      </div>
    </div>
  )
}
