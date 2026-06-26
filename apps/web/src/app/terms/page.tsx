import Link from 'next/link'
import SmartNav from '@/components/SmartNav'

export const metadata = { title: 'Условия использования — Booking' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SmartNav />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Условия использования</h1>
        <p className="text-gray-400 text-sm mb-10">Последнее обновление: 25 июня 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Общие положения</h2>
            <p>Настоящие Условия использования регулируют отношения между платформой Booking (далее — «Сервис», «Мы») и пользователями сервиса (далее — «Пользователь», «Вы»). Используя Сервис, вы соглашаетесь с данными Условиями.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Описание Сервиса</h2>
            <p>Booking — платформа для онлайн-бронирования, которая позволяет владельцам бизнеса принимать бронирования через интернет, а клиентам — бронировать услуги в режиме реального времени.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Регистрация и аккаунт</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Для использования Сервиса необходима регистрация с указанием действующего email.</li>
              <li>Вы несёте ответственность за сохранность данных своего аккаунта.</li>
              <li>Передача доступа к аккаунту третьим лицам запрещена.</li>
              <li>Мы вправе заблокировать аккаунт при нарушении данных Условий.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Бронирования и оплата</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Бронирование считается подтверждённым после получения уведомления на email.</li>
              <li>Условия отмены устанавливаются каждым бизнесом самостоятельно.</li>
              <li>Платёжные операции обрабатываются через Bakai PayLink согласно условиям платёжного провайдера.</li>
              <li>Сервис не несёт ответственности за качество оказываемых через платформу услуг.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Для владельцев бизнеса</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Вы гарантируете достоверность информации о вашем бизнесе.</li>
              <li>Запрещается размещать незаконный или вводящий в заблуждение контент.</li>
              <li>Вы обязуетесь выполнять подтверждённые бронирования.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Ограничение ответственности</h2>
            <p>Сервис предоставляется «как есть». Мы не несём ответственности за убытки, возникшие в результате использования или невозможности использования Сервиса, за исключением случаев, предусмотренных законодательством Кыргызской Республики.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Изменения условий</h2>
            <p>Мы вправе изменять данные Условия. Продолжение использования Сервиса после публикации изменений означает ваше согласие с новыми Условиями.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Контакты</h2>
            <p>По вопросам, связанным с настоящими Условиями: <Link href="/contact" className="text-blue-600 hover:underline">страница контактов</Link>.</p>
          </section>
        </div>
      </div>

      <footer className="border-t border-gray-100 py-6 mt-10">
        <div className="max-w-5xl mx-auto px-4 flex justify-between text-xs text-gray-400">
          <Link href="/" className="text-blue-600 font-medium">← Главная</Link>
          <Link href="/privacy" className="hover:text-gray-600">Политика конфиденциальности</Link>
        </div>
      </footer>
    </div>
  )
}
