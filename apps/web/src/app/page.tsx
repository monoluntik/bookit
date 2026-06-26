import Link from 'next/link'
import SmartNav from '@/components/SmartNav'

const TYPE_LABELS: Record<string, string> = {
  HOTEL: 'Отели', RESTAURANT: 'Рестораны', SALON: 'Салоны красоты',
  COWORKING: 'Коворкинг', SPORT: 'Спорт', MEDICAL: 'Медицина',
}
const TYPE_ICONS: Record<string, string> = {
  HOTEL: '🏨', RESTAURANT: '🍽️', SALON: '💇', COWORKING: '💼', SPORT: '⚽', MEDICAL: '🏥',
}

const features = [
  { icon: '⚡', title: 'Мгновенное бронирование', desc: 'Клиент выбирает время и бронирует за 30 секунд без звонков и ожидания.' },
  { icon: '📱', title: 'Работает на любом устройстве', desc: 'Адаптивный интерфейс для телефона, планшета и компьютера.' },
  { icon: '💳', title: 'Онлайн-оплата', desc: 'Принимайте предоплату через Bakai PayLink. Деньги приходят сразу.' },
  { icon: '🔔', title: 'Email-уведомления', desc: 'Клиенты получают подтверждение сразу после бронирования.' },
  { icon: '📊', title: 'Аналитика и статистика', desc: 'Отслеживайте загрузку, доход и популярные услуги в реальном времени.' },
  { icon: '👥', title: 'Управление персоналом', desc: 'Добавляйте сотрудников, назначайте роли, ведите расписание.' },
]

const steps = [
  { num: '1', title: 'Зарегистрируйте бизнес', desc: 'Создайте аккаунт и заполните профиль компании за 5 минут.' },
  { num: '2', title: 'Добавьте ресурсы и расписание', desc: 'Укажите мастеров, столы или номера и задайте рабочие часы.' },
  { num: '3', title: 'Поделитесь ссылкой', desc: 'Отправьте клиентам ссылку на страницу бронирования.' },
  { num: '4', title: 'Принимайте брони', desc: 'Управляйте бронированиями в удобном дашборде.' },
]

const testimonials = [
  { name: 'Айгуль М.', role: 'Владелица салона красоты', text: 'Раньше вела запись в блокноте. Теперь всё онлайн — клиенты сами выбирают удобное время, а я вижу все брони в одном месте.' },
  { name: 'Данияр К.', role: 'Управляющий коворкинга', text: 'Настроили за один день. Онлайн-оплата особенно понравилась — больше не нужно напоминать клиентам об оплате.' },
  { name: 'Нуржан А.', role: 'Директор фитнес-клуба', text: 'Система адаптируется под наш формат работы. Тренеры сами видят своё расписание через дашборд.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <SmartNav />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 pb-24">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            ✨ Бесплатно для малого бизнеса
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-5 leading-tight">
            Онлайн-бронирование<br />
            <span className="text-blue-600">для любого бизнеса</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            Салоны, рестораны, отели, коворкинги, спортзалы и клиники —
            принимайте брони 24/7 без звонков и мессенджеров.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-semibold text-base hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              Подключить бизнес бесплатно →
            </Link>
            <Link href="/explore"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-2xl font-semibold text-base hover:bg-gray-50 transition-colors border border-gray-200">
              Найти заведение
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">Нет скрытых платежей · Настройка за 5 минут</p>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">Популярные категории</h2>
        <p className="text-gray-400 text-center mb-8 text-sm">Найдите нужное заведение рядом с вами</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <Link key={type} href={`/explore?type=${type}`}
              className="flex flex-col items-center gap-2.5 p-5 bg-gray-50 rounded-2xl hover:bg-blue-50 hover:text-blue-700 transition-all hover:-translate-y-0.5 text-gray-600 group">
              <span className="text-3xl group-hover:scale-110 transition-transform">{TYPE_ICONS[type]}</span>
              <span className="text-xs font-semibold text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3">
            Всё необходимое для работы
          </h2>
          <p className="text-gray-400 text-center mb-12 text-sm">Без лишнего — только то, что реально нужно бизнесу</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3">
          Запустите за один день
        </h2>
        <p className="text-gray-400 text-center mb-12 text-sm">Без технических знаний и разработчиков</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(s => (
            <div key={s.num} className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {s.num}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">
            Нам доверяют
          </h2>
          <p className="text-blue-200 text-center mb-12 text-sm">Отзывы владельцев бизнеса</p>
          <div className="grid sm:grid-cols-3 gap-5">
            {testimonials.map(t => (
              <div key={t.name} className="bg-white/10 backdrop-blur rounded-2xl p-6">
                <p className="text-white/90 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-white text-sm">{t.name}</div>
                  <div className="text-blue-200 text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview CTA */}
      <section className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Начните бесплатно прямо сейчас
        </h2>
        <p className="text-gray-400 mb-8">
          Бесплатный план навсегда. Upgrade когда понадобится больше возможностей.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register"
            className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">
            Создать аккаунт бесплатно
          </Link>
          <Link href="/pricing"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-colors border border-gray-200">
            Посмотреть тарифы
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid sm:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-lg font-bold text-blue-600 mb-3">Booking</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Платформа онлайн-бронирования для малого и среднего бизнеса.
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Продукт</div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/explore" className="hover:text-gray-600">Найти заведение</Link></li>
                <li><Link href="/guide" className="hover:text-gray-600">Гайд по платформе</Link></li>
                <li><Link href="/pricing" className="hover:text-gray-600">Тарифы</Link></li>
                <li><Link href="/register" className="hover:text-gray-600">Для бизнеса</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Компания</div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-gray-600">О нас</Link></li>
                <li><Link href="/contact" className="hover:text-gray-600">Контакты</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Правовые</div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/terms" className="hover:text-gray-600">Условия использования</Link></li>
                <li><Link href="/privacy" className="hover:text-gray-600">Политика конфиденциальности</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
            <span>© 2026 Booking. Все права защищены.</span>
            <span>Бишкек, Кыргызстан</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
