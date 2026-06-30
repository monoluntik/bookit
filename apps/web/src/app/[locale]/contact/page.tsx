'use client'

import { useState, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import SmartNav from '@/components/SmartNav'

function ContactForm() {
  const t = useTranslations('Static')
  const params = useSearchParams()
  const planParam = params.get('plan') ?? ''

  const PLAN_LABELS: Record<string, string> = {
    pro: t('contact.planLabels.pro'),
    business: t('contact.planLabels.business'),
  }

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: planParam ? 'upgrade' : '',
    message: planParam ? t('contact.messageTemplate', { plan: PLAN_LABELS[planParam] ?? planParam }) : '',
  })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setSent(true)
    setLoading(false)
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const contacts = [
    { icon: '📧', label: t('contact.contactsList.email'), value: 'support@booking.app', href: 'mailto:support@booking.app' },
    { icon: '💬', label: t('contact.contactsList.telegram'), value: '@booking_support', href: 'https://t.me/booking_support' },
    { icon: '📍', label: t('contact.contactsList.address.label'), value: t('contact.contactsList.address.value'), href: null },
    { icon: '🕐', label: t('contact.contactsList.hours.label'), value: t('contact.contactsList.hours.value'), href: null },
  ]

  return (
    <div className="min-h-screen bg-white">
      <SmartNav />

      <section className="bg-gray-50 pt-16 pb-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          {planParam ? (
            <>
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                {t('contact.hero.planBadge', { plan: PLAN_LABELS[planParam] ?? planParam })}
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{t('contact.hero.planTitle')}</h1>
              <p className="text-gray-400">{t('contact.hero.planSubtitle')}</p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{t('contact.hero.title')}</h1>
              <p className="text-gray-400">{t('contact.hero.subtitle')}</p>
            </>
          )}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t('contact.left.title')}</h2>
            <div className="space-y-4 mb-8">
              {contacts.map(c => (
                <div key={c.label} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl shrink-0">
                    {c.icon}
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium">{c.label}</div>
                    {c.href ? (
                      <a href={c.href} className="text-sm font-medium text-blue-600 hover:underline">{c.value}</a>
                    ) : (
                      <div className="text-sm font-medium text-gray-700">{c.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-2xl p-5">
              <div className="font-semibold text-gray-900 mb-1 text-sm">{t('contact.left.freeBoxTitle')}</div>
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                {t('contact.left.freeBoxText')}
              </p>
              <Link href="/register"
                className="inline-flex text-xs font-semibold text-blue-600 hover:underline">
                {t('contact.left.freeBoxCta')}
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {sent ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✉️</div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('contact.sent.title')}</h3>
                <p className="text-sm text-gray-400 mb-4">{t('contact.sent.text', { email: form.email })}</p>
                {planParam && (
                  <p className="text-xs text-blue-600 bg-blue-50 rounded-xl p-3">
                    {t('contact.sent.planNote')}
                  </p>
                )}
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-5">
                  {planParam ? t('contact.form.titlePlan', { plan: planParam.charAt(0).toUpperCase() + planParam.slice(1) }) : t('contact.form.titleDefault')}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input required placeholder={t('contact.form.namePlaceholder')} value={form.name} onChange={set('name')} autoComplete="name"
                      className="col-span-2 sm:col-span-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    <input type="email" required placeholder={t('contact.form.emailPlaceholder')} value={form.email} onChange={set('email')} autoComplete="email"
                      className="col-span-2 sm:col-span-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  </div>
                  <input type="tel" placeholder={t('contact.form.phonePlaceholder')} value={form.phone} onChange={set('phone')} autoComplete="tel"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  {!planParam && (
                    <select value={form.subject} onChange={set('subject')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700">
                      <option value="">{t('contact.form.subjectDefault')}</option>
                      <option value="upgrade">{t('contact.form.subjectUpgrade')}</option>
                      <option value="support">{t('contact.form.subjectSupport')}</option>
                      <option value="billing">{t('contact.form.subjectBilling')}</option>
                      <option value="other">{t('contact.form.subjectOther')}</option>
                    </select>
                  )}
                  <textarea required rows={4} placeholder={t('contact.form.messagePlaceholder')} value={form.message} onChange={set('message')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
                  <button type="submit" disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                    {loading ? t('contact.form.submitSending') : planParam ? t('contact.form.submitPlan') : t('contact.form.submitDefault')}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-gray-400">
          <Link href="/" className="text-blue-600 font-medium">{t('contact.footer.brand')}</Link>
        </div>
      </footer>
    </div>
  )
}

export default function ContactPage() {
  return <Suspense><ContactForm /></Suspense>
}
