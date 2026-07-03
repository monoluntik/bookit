import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import SmartNav from '@/components/SmartNav'

const TYPE_KEYS = ['HOTEL', 'RESTAURANT', 'SALON', 'COWORKING', 'SPORT', 'MEDICAL'] as const
const TYPE_ICONS: Record<string, string> = {
  HOTEL: '🏨', RESTAURANT: '🍽️', SALON: '💇', COWORKING: '💼', SPORT: '⚽', MEDICAL: '🏥',
}

const FEATURE_KEYS = ['instantBooking', 'anyDevice', 'onlinePayment', 'emailNotifications', 'analytics', 'staffManagement'] as const
const FEATURE_ICONS: Record<string, string> = {
  instantBooking: '⚡', anyDevice: '📱', onlinePayment: '💳',
  emailNotifications: '🔔', analytics: '📊', staffManagement: '👥',
}

const STEP_KEYS = ['registerBusiness', 'addResources', 'shareLink', 'acceptBookings'] as const

const TESTIMONIAL_KEYS = ['aigul', 'daniyar', 'nurzhan'] as const

export default async function HomePage() {
  const t = await getTranslations('Home')
  return (
    <div className="min-h-screen bg-white">
      <SmartNav />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 pb-24">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            ✨ {t('hero.badge')}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-5 leading-tight">
            {t('hero.titleLine1')}<br />
            <span className="text-blue-600">{t('hero.titleLine2')}</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-semibold text-base hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              {t('hero.ctaPrimary')} →
            </Link>
            <Link href="/explore"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-2xl font-semibold text-base hover:bg-gray-50 transition-colors border border-gray-200">
              {t('hero.ctaSecondary')}
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">{t('hero.footnote')}</p>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">{t('categories.title')}</h2>
        <p className="text-gray-400 text-center mb-8 text-sm">{t('categories.subtitle')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {TYPE_KEYS.map(type => (
            <Link key={type} href={`/explore?type=${type}`}
              className="flex flex-col items-center gap-2.5 p-5 bg-gray-50 rounded-2xl hover:bg-blue-50 hover:text-blue-700 transition-all hover:-translate-y-0.5 text-gray-600 group">
              <span className="text-3xl group-hover:scale-110 transition-transform">{TYPE_ICONS[type]}</span>
              <span className="text-xs font-semibold text-center leading-tight">{t(`categories.types.${type}`)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3">
            {t('features.title')}
          </h2>
          <p className="text-gray-400 text-center mb-12 text-sm">{t('features.subtitle')}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURE_KEYS.map(key => (
              <div key={key} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="text-3xl mb-3">{FEATURE_ICONS[key]}</div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{t(`features.items.${key}.title`)}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{t(`features.items.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3">
          {t('steps.title')}
        </h2>
        <p className="text-gray-400 text-center mb-12 text-sm">{t('steps.subtitle')}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEP_KEYS.map((key, i) => (
            <div key={key} className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {i + 1}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t(`steps.items.${key}.title`)}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{t(`steps.items.${key}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">
            {t('testimonials.title')}
          </h2>
          <p className="text-blue-200 text-center mb-12 text-sm">{t('testimonials.subtitle')}</p>
          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIAL_KEYS.map(key => (
              <div key={key} className="bg-white/10 backdrop-blur rounded-2xl p-6">
                <p className="text-white/90 text-sm leading-relaxed mb-5">&quot;{t(`testimonials.items.${key}.text`)}&quot;</p>
                <div>
                  <div className="font-semibold text-white text-sm">{t(`testimonials.items.${key}.name`)}</div>
                  <div className="text-blue-200 text-xs">{t(`testimonials.items.${key}.role`)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview CTA */}
      <section className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          {t('ctaSection.title')}
        </h2>
        <p className="text-gray-400 mb-8">
          {t('ctaSection.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register"
            className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">
            {t('ctaSection.ctaPrimary')}
          </Link>
          <Link href="/pricing"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-colors border border-gray-200">
            {t('ctaSection.ctaSecondary')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid sm:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-lg font-bold text-blue-600 mb-3">Bronly</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                {t('footer.tagline')}
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">{t('footer.productHeading')}</div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/explore" className="hover:text-gray-600">{t('footer.findBusiness')}</Link></li>
                <li><Link href="/guide" className="hover:text-gray-600">{t('footer.guide')}</Link></li>
                <li><Link href="/pricing" className="hover:text-gray-600">{t('footer.pricing')}</Link></li>
                <li><Link href="/register" className="hover:text-gray-600">{t('footer.forBusiness')}</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">{t('footer.companyHeading')}</div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-gray-600">{t('footer.about')}</Link></li>
                <li><Link href="/contact" className="hover:text-gray-600">{t('footer.contact')}</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">{t('footer.legalHeading')}</div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/terms" className="hover:text-gray-600">{t('footer.terms')}</Link></li>
                <li><Link href="/privacy" className="hover:text-gray-600">{t('footer.privacy')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
            <span>{t('footer.copyright')}</span>
            <span>{t('footer.location')}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
