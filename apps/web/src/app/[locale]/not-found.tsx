import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export default async function NotFound() {
  const t = await getTranslations('Static')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl font-bold text-blue-600 mb-4">404</div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">{t('notFound.title')}</h1>
        <p className="text-gray-500 mb-8">{t('notFound.subtitle')}</p>
        <Link href="/" className="inline-flex px-6 py-3 bg-blue-600 text-white rounded-2xl font-medium hover:bg-blue-700">
          {t('notFound.homeButton')}
        </Link>
      </div>
    </div>
  )
}
