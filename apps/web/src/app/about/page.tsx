import Link from 'next/link'
import SmartNav from '@/components/SmartNav'

export const metadata = { title: 'О нас — Booking' }

const team = [
  { name: 'Команда продукта', icon: '🛠️', desc: 'Строим удобный инструмент для бизнеса на основе реальных потребностей наших клиентов.' },
  { name: 'Поддержка', icon: '💬', desc: 'Помогаем настроить систему и решаем вопросы в течение часа в рабочее время.' },
  { name: 'Безопасность', icon: '🔒', desc: 'Данные клиентов защищены шифрованием. Платёжные данные не хранятся на наших серверах.' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <SmartNav />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 to-white pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">О платформе Booking</h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Мы создаём инструмент, который помогает малому и среднему бизнесу в Кыргызстане
            переводить запись клиентов онлайн — без звонков, мессенджеров и бумажных журналов.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="grid sm:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Наша миссия</h2>
            <p className="text-gray-500 leading-relaxed mb-4">
              Большинство небольших бизнесов в стране до сих пор ведут запись через WhatsApp или по телефону.
              Это неудобно для клиентов и отнимает время у владельцев.
            </p>
            <p className="text-gray-500 leading-relaxed">
              Мы сделали простую систему, которую можно настроить за один день и сразу начать принимать брони онлайн —
              без разработчиков и технических знаний.
            </p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-3">🚀</div>
            <div className="text-3xl font-bold text-blue-600 mb-1">2024</div>
            <div className="text-gray-400 text-sm">Год основания</div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Как мы работаем</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {team.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-6 text-center">
                <div className="text-4xl mb-3">{t.icon}</div>
                <div className="font-semibold text-gray-900 mb-2">{t.name}</div>
                <p className="text-sm text-gray-400 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Хотите с нами поговорить?</h2>
        <p className="text-gray-400 mb-6">Расскажем подробнее о возможностях платформы для вашего бизнеса.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/contact"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
            Написать нам
          </Link>
          <Link href="/pricing"
            className="px-6 py-3 bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-50 border border-gray-200 transition-colors">
            Посмотреть тарифы
          </Link>
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
