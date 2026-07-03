import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import SmartNav from '@/components/SmartNav'

export const metadata = { title: 'О нас — Bronly' }

export default async function AboutPage() {
  const t = await getTranslations('Static')

  const team = [
    { key: 'product', name: t('about.team.product.name'), icon: '🛠️', desc: t('about.team.product.desc') },
    { key: 'support', name: t('about.team.support.name'), icon: '💬', desc: t('about.team.support.desc') },
    { key: 'security', name: t('about.team.security.name'), icon: '🔒', desc: t('about.team.security.desc') },
  ]

  return (
    <div className="min-h-screen bg-white">
      <SmartNav />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 to-white pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('about.hero.title')}</h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            {t('about.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="grid sm:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('about.mission.title')}</h2>
            <p className="text-gray-500 leading-relaxed mb-4">
              {t('about.mission.p1')}
            </p>
            <p className="text-gray-500 leading-relaxed">
              {t('about.mission.p2')}
            </p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-3">🚀</div>
            <div className="text-3xl font-bold text-blue-600 mb-1">2024</div>
            <div className="text-gray-400 text-sm">{t('about.mission.founded')}</div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">{t('about.values.title')}</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {team.map(item => (
              <div key={item.key} className="bg-white rounded-2xl p-6 text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <div className="font-semibold text-gray-900 mb-2">{item.name}</div>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('about.cta.title')}</h2>
        <p className="text-gray-400 mb-6">{t('about.cta.subtitle')}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/contact"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
            {t('about.cta.contact')}
          </Link>
          <Link href="/pricing"
            className="px-6 py-3 bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-50 border border-gray-200 transition-colors">
            {t('about.cta.pricing')}
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-gray-400">
          <Link href="/" className="text-blue-600 font-medium">{t('about.footer.brand')}</Link>
        </div>
      </footer>
    </div>
  )
}
