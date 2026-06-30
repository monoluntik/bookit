import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import SmartNav from '@/components/SmartNav'

export default async function PricingPage() {
  const t = await getTranslations('Static')

  const plans = [
    {
      key: 'free',
      name: t('pricing.plans.free.name'),
      price: t('pricing.plans.free.price'),
      period: t('pricing.plans.free.period'),
      description: t('pricing.plans.free.description'),
      color: 'bg-white border-gray-200',
      badgeColor: '',
      badge: '',
      cta: t('pricing.plans.free.cta'),
      ctaHref: '/register',
      ctaStyle: 'bg-gray-900 text-white hover:bg-gray-800',
      features: [
        { text: t('pricing.plans.free.features.businesses') },
        { text: t('pricing.plans.free.features.resources') },
        { text: t('pricing.plans.free.features.bookings') },
        { text: t('pricing.plans.free.features.bookingPage') },
        { text: t('pricing.plans.free.features.analytics') },
        { text: t('pricing.plans.free.features.emailNotifications'), soon: true },
      ],
      missing: [
        t('pricing.plans.free.missing.onlinePayment'),
        t('pricing.plans.free.missing.customDomain'),
        t('pricing.plans.free.missing.apiAccess'),
      ],
    },
    {
      key: 'pro',
      name: t('pricing.plans.pro.name'),
      price: t('pricing.plans.pro.price'),
      period: t('pricing.plans.pro.period'),
      description: t('pricing.plans.pro.description'),
      color: 'bg-blue-600 border-blue-600',
      badge: t('pricing.plans.pro.badge'),
      badgeColor: 'bg-white/20 text-white',
      cta: t('pricing.plans.pro.cta'),
      ctaHref: '/contact?plan=pro',
      ctaStyle: 'bg-white text-blue-600 hover:bg-blue-50',
      features: [
        { text: t('pricing.plans.pro.features.businesses') },
        { text: t('pricing.plans.pro.features.resources') },
        { text: t('pricing.plans.pro.features.bookings') },
        { text: t('pricing.plans.pro.features.emailNotifications'), soon: true },
        { text: t('pricing.plans.pro.features.onlinePayment'), soon: true },
        { text: t('pricing.plans.pro.features.advancedAnalytics') },
        { text: t('pricing.plans.pro.features.staffManagement') },
        { text: t('pricing.plans.pro.features.prioritySupport') },
      ],
      missing: [t('pricing.plans.pro.missing.customDomain')],
    },
    {
      key: 'business',
      name: t('pricing.plans.business.name'),
      price: t('pricing.plans.business.price'),
      period: t('pricing.plans.business.period'),
      description: t('pricing.plans.business.description'),
      color: 'bg-white border-gray-200',
      badge: '',
      badgeColor: '',
      cta: t('pricing.plans.business.cta'),
      ctaHref: '/contact?plan=business',
      ctaStyle: 'bg-gray-900 text-white hover:bg-gray-800',
      features: [
        { text: t('pricing.plans.business.features.businesses') },
        { text: t('pricing.plans.business.features.resources') },
        { text: t('pricing.plans.business.features.bookings') },
        { text: t('pricing.plans.business.features.emailNotifications'), soon: true },
        { text: t('pricing.plans.business.features.onlinePayment'), soon: true },
        { text: t('pricing.plans.business.features.fullAnalytics'), soon: true },
        { text: t('pricing.plans.business.features.staffManagement') },
        { text: t('pricing.plans.business.features.customDomain'), soon: true },
        { text: t('pricing.plans.business.features.dedicatedSupport') },
        { text: t('pricing.plans.business.features.apiAccess'), soon: true },
      ],
      missing: [] as string[],
    },
  ]

  const faq = [
    { q: t('pricing.faq.q1.q'), a: t('pricing.faq.q1.a') },
    { q: t('pricing.faq.q2.q'), a: t('pricing.faq.q2.a') },
    { q: t('pricing.faq.q3.q'), a: t('pricing.faq.q3.a') },
    { q: t('pricing.faq.q4.q'), a: t('pricing.faq.q4.a') },
  ]

  return (
    <div className="min-h-screen bg-white">
      <SmartNav />

      {/* Hero */}
      <section className="bg-gray-50 pt-16 pb-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{t('pricing.hero.title')}</h1>
          <p className="text-gray-400 text-lg">{t('pricing.hero.subtitle')}</p>
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-5xl mx-auto px-4 -mt-6 pb-20">
        <div className="grid lg:grid-cols-3 gap-5">
          {plans.map(plan => (
            <div key={plan.key}
              className={`rounded-2xl border-2 p-8 flex flex-col ${plan.color}`}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className={`text-lg font-bold mb-1 ${plan.color.includes('blue-600') ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </div>
                  <div className={`text-sm ${plan.color.includes('blue-600') ? 'text-blue-100' : 'text-gray-400'}`}>
                    {plan.description}
                  </div>
                </div>
                {plan.badge && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${plan.badgeColor}`}>
                    {plan.badge}
                  </span>
                )}
              </div>

              <div className="mb-6">
                <span className={`text-4xl font-bold ${plan.color.includes('blue-600') ? 'text-white' : 'text-gray-900'}`}>
                  {plan.price}
                </span>
                <span className={`text-sm ml-1 ${plan.color.includes('blue-600') ? 'text-blue-200' : 'text-gray-400'}`}>
                  {plan.period}
                </span>
              </div>

              <Link href={plan.ctaHref}
                className={`block text-center py-3 rounded-xl font-semibold text-sm mb-6 transition-colors ${plan.ctaStyle}`}>
                {plan.cta}
              </Link>

              <ul className="space-y-2.5 flex-1">
                {plan.features.map(f => (
                  <li key={f.text} className={`flex items-center gap-2 text-sm ${plan.color.includes('blue-600') ? 'text-white' : 'text-gray-600'}`}>
                    <span className={`shrink-0 ${plan.color.includes('blue-600') ? 'text-blue-200' : 'text-green-500'}`}>✓</span>
                    {f.text}
                    {f.soon && (
                      <span className={`ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${plan.color.includes('blue-600') ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>
                        {t('pricing.plans.soonBadge')}
                      </span>
                    )}
                  </li>
                ))}
                {plan.missing.map(f => (
                  <li key={f} className={`flex items-center gap-2 text-sm ${plan.color.includes('blue-600') ? 'text-blue-300' : 'text-gray-300'}`}>
                    <span className="shrink-0">✕</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">{t('pricing.faq.title')}</h2>
          <div className="space-y-4">
            {faq.map(item => (
              <div key={item.q} className="bg-white rounded-2xl p-6">
                <div className="font-semibold text-gray-900 mb-2">{item.q}</div>
                <div className="text-sm text-gray-500 leading-relaxed">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('pricing.bottomCta.title')}</h2>
        <p className="text-gray-400 mb-6">{t('pricing.bottomCta.subtitle')}</p>
        <Link href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
          {t('pricing.bottomCta.button')}
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <Link href="/" className="font-semibold text-blue-600">{t('pricing.footer.brand')}</Link>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-gray-600">{t('pricing.footer.terms')}</Link>
            <Link href="/privacy" className="hover:text-gray-600">{t('pricing.footer.privacy')}</Link>
            <Link href="/contact" className="hover:text-gray-600">{t('pricing.footer.contact')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
