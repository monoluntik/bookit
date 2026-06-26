'use client'

import { useState } from 'react'
import Link from 'next/link'
import SmartNav from '@/components/SmartNav'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // In production, send to API — for now just simulate
    await new Promise(r => setTimeout(r, 800))
    setSent(true)
    setLoading(false)
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const contacts = [
    { icon: '📧', label: 'Email', value: 'support@booking.app', href: 'mailto:support@booking.app' },
    { icon: '💬', label: 'Telegram', value: '@booking_support', href: 'https://t.me/booking_support' },
    { icon: '📍', label: 'Адрес', value: 'Бишкек, Кыргызстан', href: null },
    { icon: '🕐', label: 'Рабочие часы', value: 'Пн–Пт, 9:00–18:00', href: null },
  ]

  return (
    <div className="min-h-screen bg-white">
      <SmartNav />

      <section className="bg-gray-50 pt-16 pb-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Контакты</h1>
          <p className="text-gray-400">Ответим в течение часа в рабочее время</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Contact info */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Свяжитесь с нами</h2>
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
              <div className="font-semibold text-gray-900 mb-1 text-sm">Хотите подключить бизнес?</div>
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                Расскажем о возможностях, поможем настроить и ответим на все вопросы.
              </p>
              <Link href="/register"
                className="inline-flex text-xs font-semibold text-blue-600 hover:underline">
                Попробовать бесплатно →
              </Link>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {sent ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✉️</div>
                <h3 className="font-semibold text-gray-900 mb-2">Сообщение отправлено!</h3>
                <p className="text-sm text-gray-400">Мы ответим вам на {form.email} в течение часа.</p>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-5">Написать нам</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input required placeholder="Ваше имя" value={form.name} onChange={set('name')}
                      className="col-span-2 sm:col-span-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    <input type="email" required placeholder="Email" value={form.email} onChange={set('email')}
                      className="col-span-2 sm:col-span-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  </div>
                  <select value={form.subject} onChange={set('subject')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700">
                    <option value="">Тема обращения</option>
                    <option value="sales">Подключить бизнес</option>
                    <option value="support">Техническая поддержка</option>
                    <option value="billing">Вопрос по оплате</option>
                    <option value="other">Другое</option>
                  </select>
                  <textarea required rows={4} placeholder="Ваше сообщение..." value={form.message} onChange={set('message')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
                  <button type="submit" disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                    {loading ? 'Отправляем...' : 'Отправить'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-gray-400">
          <Link href="/" className="text-blue-600 font-medium">← Booking</Link>
        </div>
      </footer>
    </div>
  )
}
