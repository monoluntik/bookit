import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import SmartNav from '@/components/SmartNav'

export const metadata = { title: 'Условия использования — Booking' }

export default async function TermsPage() {
  const t = await getTranslations('Static')

  return (
    <div className="min-h-screen bg-white">
      <SmartNav />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('terms.title')}</h1>
        <p className="text-gray-400 text-sm mb-10">{t('terms.lastUpdated')}</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('terms.section1.title')}</h2>
            <p>{t('terms.section1.body')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('terms.section2.title')}</h2>
            <p>{t('terms.section2.body')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('terms.section3.title')}</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>{t('terms.section3.items.item1')}</li>
              <li>{t('terms.section3.items.item2')}</li>
              <li>{t('terms.section3.items.item3')}</li>
              <li>{t('terms.section3.items.item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('terms.section4.title')}</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>{t('terms.section4.items.item1')}</li>
              <li>{t('terms.section4.items.item2')}</li>
              <li>{t('terms.section4.items.item3')}</li>
              <li>{t('terms.section4.items.item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('terms.section5.title')}</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>{t('terms.section5.items.item1')}</li>
              <li>{t('terms.section5.items.item2')}</li>
              <li>{t('terms.section5.items.item3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('terms.section6.title')}</h2>
            <p>{t('terms.section6.body')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('terms.section7.title')}</h2>
            <p>{t('terms.section7.body')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('terms.section8.title')}</h2>
            <p>
              {t('terms.section8.bodyPrefix')}
              <Link href="/contact" className="text-blue-600 hover:underline">{t('terms.section8.linkText')}</Link>.
            </p>
          </section>
        </div>
      </div>

      <footer className="border-t border-gray-100 py-6 mt-10">
        <div className="max-w-5xl mx-auto px-4 flex justify-between text-xs text-gray-400">
          <Link href="/" className="text-blue-600 font-medium">{t('terms.footer.home')}</Link>
          <Link href="/privacy" className="hover:text-gray-600">{t('terms.footer.privacy')}</Link>
        </div>
      </footer>
    </div>
  )
}
