import Link from 'next/link'
import SmartNav from '@/components/SmartNav'

const plans = [
  {
    name: 'Free',
    price: '0',
    period: 'навсегда',
    description: 'Для старта. Всё необходимое без ограничений по времени.',
    color: 'bg-white border-gray-200',
    badgeColor: '',
    badge: '',
    cta: 'Начать бесплатно',
    ctaHref: '/register',
    ctaStyle: 'bg-gray-900 text-white hover:bg-gray-800',
    features: [
      { text: '1 бизнес' },
      { text: 'До 3 ресурсов' },
      { text: 'До 50 броней в месяц' },
      { text: 'Страница бронирования' },
      { text: 'Базовая аналитика' },
      { text: 'Email-уведомления', soon: true },
    ],
    missing: ['Онлайн-оплата', 'Кастомный домен', 'API доступ'],
  },
  {
    name: 'Pro',
    price: '1 490',
    period: 'сом / мес',
    description: 'Для растущего бизнеса с высоким потоком клиентов.',
    color: 'bg-blue-600 border-blue-600',
    badge: 'Популярный',
    badgeColor: 'bg-white/20 text-white',
    cta: 'Оставить заявку',
    ctaHref: '/contact?plan=pro',
    ctaStyle: 'bg-white text-blue-600 hover:bg-blue-50',
    features: [
      { text: '5 бизнесов' },
      { text: 'Неограниченно ресурсов' },
      { text: 'Неограниченно броней' },
      { text: 'Email-уведомления', soon: true },
      { text: 'Онлайн-оплата (Bakai)', soon: true },
      { text: 'Расширенная аналитика' },
      { text: 'Управление персоналом' },
      { text: 'Приоритетная поддержка' },
    ],
    missing: ['Кастомный домен'],
  },
  {
    name: 'Business',
    price: '4 990',
    period: 'сом / мес',
    description: 'Для сетей и крупных компаний с несколькими филиалами.',
    color: 'bg-white border-gray-200',
    badge: '',
    badgeColor: '',
    cta: 'Оставить заявку',
    ctaHref: '/contact?plan=business',
    ctaStyle: 'bg-gray-900 text-white hover:bg-gray-800',
    features: [
      { text: 'Неограниченно бизнесов' },
      { text: 'Неограниченно ресурсов' },
      { text: 'Неограниченно броней' },
      { text: 'Email-уведомления', soon: true },
      { text: 'Онлайн-оплата (Bakai)', soon: true },
      { text: 'Полная аналитика + экспорт', soon: true },
      { text: 'Управление персоналом' },
      { text: 'Кастомный домен', soon: true },
      { text: 'Выделенная поддержка' },
      { text: 'API доступ', soon: true },
    ],
    missing: [],
  },
]

const faq = [
  {
    q: 'Как перейти на платный тариф?',
    a: 'Оставьте заявку через кнопку на нужном тарифе — мы свяжемся в течение рабочего дня и поможем с подключением.',
  },
  {
    q: 'Есть ли скидки при оплате за год?',
    a: 'Да — при оплате на год скидка 20%. Уточните при оформлении заявки.',
  },
  {
    q: 'Что происходит с данными при смене тарифа?',
    a: 'Все данные — брони, клиенты, история — сохраняются при любом изменении тарифа.',
  },
  {
    q: 'Можно ли попробовать бесплатно?',
    a: 'Free-тариф доступен без ограничений по времени. Регистрация занимает 2 минуты, карта не нужна.',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <SmartNav />

      {/* Hero */}
      <section className="bg-gray-50 pt-16 pb-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Прозрачные тарифы</h1>
          <p className="text-gray-400 text-lg">Никаких скрытых комиссий. Платите только за то, что нужно.</p>
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-5xl mx-auto px-4 -mt-6 pb-20">
        <div className="grid lg:grid-cols-3 gap-5">
          {plans.map(plan => (
            <div key={plan.name}
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
                        Скоро
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
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Часто задаваемые вопросы</h2>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Всё ещё есть вопросы?</h2>
        <p className="text-gray-400 mb-6">Напишите нам — ответим в течение часа в рабочее время.</p>
        <Link href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
          Связаться с нами
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <Link href="/" className="font-semibold text-blue-600">← Booking</Link>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-gray-600">Условия</Link>
            <Link href="/privacy" className="hover:text-gray-600">Конфиденциальность</Link>
            <Link href="/contact" className="hover:text-gray-600">Контакты</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
