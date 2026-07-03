import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import SmartNav from '@/components/SmartNav'

export const metadata = { title: 'Политика конфиденциальности — Bronly' }

export default async function PrivacyPage() {
  const t = await getTranslations('Static')

  return (
    <div className="min-h-screen bg-white">
      <SmartNav />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('privacy.title')}</h1>
        <p className="text-gray-400 text-sm mb-10">{t('privacy.lastUpdated')}</p>

        <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('privacy.section1.title')}</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><b>{t('privacy.section1.items.item1.label')}</b> {t('privacy.section1.items.item1.text')}</li>
              <li><b>{t('privacy.section1.items.item2.label')}</b> {t('privacy.section1.items.item2.text')}</li>
              <li><b>{t('privacy.section1.items.item3.label')}</b> {t('privacy.section1.items.item3.text')}</li>
              <li><b>{t('privacy.section1.items.item4.label')}</b> {t('privacy.section1.items.item4.text')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('privacy.section2.title')}</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>{t('privacy.section2.items.item1')}</li>
              <li>{t('privacy.section2.items.item2')}</li>
              <li>{t('privacy.section2.items.item3')}</li>
              <li>{t('privacy.section2.items.item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('privacy.section3.title')}</h2>
            <p>{t('privacy.section3.intro')}</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>{t('privacy.section3.items.item1')}</li>
              <li>{t('privacy.section3.items.item2')}</li>
              <li>{t('privacy.section3.items.item3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('privacy.section4.title')}</h2>
            <p>{t('privacy.section4.body')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('privacy.section5.title')}</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><b>{t('privacy.section5.items.item1.label')}</b> {t('privacy.section5.items.item1.text')}</li>
              <li><b>{t('privacy.section5.items.item2.label')}</b> {t('privacy.section5.items.item2.text')}</li>
              <li><b>{t('privacy.section5.items.item3.label')}</b> {t('privacy.section5.items.item3.text')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('privacy.section6.title')}</h2>
            <p>{t('privacy.section6.body')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('privacy.section7.title')}</h2>
            <p>
              {t('privacy.section7.bodyPrefix')}
              <Link href="/contact" className="text-blue-600 hover:underline">{t('privacy.section7.linkText')}</Link>.
            </p>
          </section>
        </div>
      </div>

      <footer className="border-t border-gray-100 py-6 mt-10">
        <div className="max-w-5xl mx-auto px-4 flex justify-between text-xs text-gray-400">
          <Link href="/" className="text-blue-600 font-medium">{t('privacy.footer.home')}</Link>
          <Link href="/terms" className="hover:text-gray-600">{t('privacy.footer.terms')}</Link>
        </div>
      </footer>
    </div>
  )
}
