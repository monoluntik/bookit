import Link from 'next/link'
import SmartNav from '@/components/SmartNav'

export const metadata = { title: 'Политика конфиденциальности — Booking' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <SmartNav />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Политика конфиденциальности</h1>
        <p className="text-gray-400 text-sm mb-10">Последнее обновление: 25 июня 2026</p>

        <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Какие данные мы собираем</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><b>Данные аккаунта:</b> email, имя, номер телефона.</li>
              <li><b>Данные бронирований:</b> выбранные услуги, время, количество гостей, примечания.</li>
              <li><b>Данные платежей:</b> статус транзакции и сумма (данные карты не хранятся на наших серверах).</li>
              <li><b>Технические данные:</b> IP-адрес, тип браузера, время посещения.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Как мы используем данные</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Для обеспечения работы Сервиса и обработки бронирований.</li>
              <li>Для отправки подтверждений и уведомлений о бронированиях.</li>
              <li>Для улучшения качества Сервиса и технической поддержки.</li>
              <li>Для предотвращения мошенничества и обеспечения безопасности.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Передача данных третьим лицам</h2>
            <p>Мы не продаём и не передаём ваши персональные данные третьим лицам, за исключением:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Платёжного провайдера Bakai PayLink для обработки платежей.</li>
              <li>Email-сервиса Resend для отправки уведомлений.</li>
              <li>Случаев, предусмотренных законодательством Кыргызской Республики.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Хранение и защита данных</h2>
            <p>Данные хранятся на защищённых серверах. Пароли хранятся в зашифрованном виде (bcrypt). Мы принимаем технические и организационные меры для защиты ваших данных от несанкционированного доступа.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Ваши права</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><b>Доступ:</b> вы можете запросить копию ваших данных.</li>
              <li><b>Исправление:</b> вы можете обновить данные в настройках профиля.</li>
              <li><b>Удаление:</b> вы можете запросить удаление аккаунта и данных через поддержку.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Cookie</h2>
            <p>Мы используем технические cookie для обеспечения работы Сервиса (сессия, авторизация). Аналитические cookie не используются без вашего согласия.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Контакты</h2>
            <p>По вопросам обработки персональных данных: <Link href="/contact" className="text-blue-600 hover:underline">страница контактов</Link>.</p>
          </section>
        </div>
      </div>

      <footer className="border-t border-gray-100 py-6 mt-10">
        <div className="max-w-5xl mx-auto px-4 flex justify-between text-xs text-gray-400">
          <Link href="/" className="text-blue-600 font-medium">← Главная</Link>
          <Link href="/terms" className="hover:text-gray-600">Условия использования</Link>
        </div>
      </footer>
    </div>
  )
}
