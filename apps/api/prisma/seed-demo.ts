/**
 * Full demo seed across Bishkek, Almaty, and Tashkent — wipes all businesses,
 * resources, bookings, reviews, and non-admin users (any user with role
 * SUPERADMIN is protected), then seeds a rich, diverse dataset meant to show
 * off the platform's full feature set: all 7 business types, all 3 cities'
 * own timezones, both booking modes, overnight schedules, deposits, schedule
 * exceptions (holidays), staff + custom roles, cancellation policies,
 * reminder rules, content translations, and varied booking sources/statuses.
 *
 * Run: pnpm tsx prisma/seed-demo.ts
 */
import { PrismaClient, BusinessType, BookingStatus, BookingMode } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Unsplash image helper ────────────────────────────────────────────────────
const U = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`

type ScheduleDef = { days: number[]; start: string; end: string; slot: number }
type ExceptionDef = { date: Date; isClosed: boolean; reason: string }
type ResourceDef = {
  name: string; description: string; capacity: number; price: number; images: string[]
  schedule: ScheduleDef; bookingMode?: BookingMode; depositAmount?: number; exceptions?: ExceptionDef[]
}
type ServiceDef = { name: string; durationMinutes: number; price: number; resourceIdx: number; depositAmount?: number }
type StaffDef = { phone: string; name: string; position: string; roleName?: string }
type BizDef = {
  slug: string; name: string; type: BusinessType; description: string
  city: 'Бишкек' | 'Алматы' | 'Ташкент'; timezone: string
  address: string; phone: string; email: string
  ownerPhone: string; ownerName: string
  logoUrl: string; images: string[]
  resources: ResourceDef[]
  services: ServiceDef[]
  staff?: StaffDef[]
  customRoles?: { name: string; permissions: string[] }[]
  cancellationPolicy?: { freeCancellationHours: number; penaltyPercent: number; noRefundHours: number }
  reminderRules?: { offsetMinutes: number; label: string }[]
  translations?: Partial<Record<'en' | 'uz' | 'kk' | 'kg', { name?: string; description?: string }>>
}

function inDays(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(0, 0, 0, 0)
  return d
}

// ─── Business definitions ─────────────────────────────────────────────────────
const BUSINESSES: BizDef[] = [
  // ════════════════════════════ БИШКЕК (Asia/Bishkek, +996) ═══════════════════
  {
    slug: 'hotel-ak-keme', name: 'Отель Ак-Кеме', type: 'HOTEL',
    description: 'Пятизвёздочный отель в центре Бишкека. Панорамные виды на горы Ала-Тоо, бассейн, спа, три ресторана.',
    city: 'Бишкек', timezone: 'Asia/Bishkek',
    address: 'пр. Манаса 40, Бишкек', phone: '+996 312 660 100', email: 'info@akkeme.kg',
    ownerPhone: '+996700111001', ownerName: 'Данияр Молдобаев',
    logoUrl: U('1566073771259-5f92f595f60b'),
    images: [U('1564501049412-61d2d62591c2'), U('1520250497591-112533000c31'), U('1571896349842-33c89424de2d'), U('1578683010236-d371ab37c23d')],
    resources: [
      { name: 'Стандартный номер', description: 'Уютный номер 28 м² с видом на город, кинг-кровать, мини-бар', capacity: 2, price: 4500, images: [U('1631049307264-da0ec9d70304')], schedule: { days: [0,1,2,3,4,5,6], start: '14:00', end: '12:00', slot: 1440 }, depositAmount: 1500 },
      { name: 'Делюкс с видом на горы', description: 'Номер 40 м² с панорамным видом на горы, джакузи, кофемашина', capacity: 2, price: 7200, images: [U('1631049307264-da0ec9d70304')], schedule: { days: [0,1,2,3,4,5,6], start: '14:00', end: '12:00', slot: 1440 }, depositAmount: 2500 },
      { name: 'Люкс семейный', description: 'Двухкомнатный люкс 65 м², гостиная, спальня, две ванные', capacity: 4, price: 12000, images: [U('1631049307264-da0ec9d70304')], schedule: { days: [0,1,2,3,4,5,6], start: '14:00', end: '12:00', slot: 1440 } },
    ],
    services: [],
    cancellationPolicy: { freeCancellationHours: 48, penaltyPercent: 50, noRefundHours: 12 },
    reminderRules: [{ offsetMinutes: 1440, label: 'За день' }, { offsetMinutes: 180, label: 'За 3 часа' }],
    translations: { en: { name: 'Ak-Keme Hotel', description: 'A five-star hotel in central Bishkek with panoramic Ala-Too mountain views, pool, spa, and three restaurants.' } },
  },
  {
    slug: 'supara-restaurant', name: 'Ресторан Супара', type: 'RESTAURANT',
    description: 'Легендарный кыргызский ресторан под открытым небом. Юрты, национальная кухня, живая музыка.',
    city: 'Бишкек', timezone: 'Asia/Bishkek',
    address: 'Чуйское шоссе 24, Бишкек', phone: '+996 312 905 050', email: 'booking@supara.kg',
    ownerPhone: '+996700111002', ownerName: 'Нурлан Асанов',
    logoUrl: U('1555396273-38ea89aeae0c'),
    images: [U('1414235077428-338989a2e8c0'), U('1517248135467-4c7edcad34c4'), U('1424847651672-bf20a4b0982b'), U('1466978913421-dad2ebd01d17')],
    resources: [
      { name: 'Летняя беседка «Манас»', description: 'Просторная беседка на 12 гостей с национальной отделкой', capacity: 12, price: 0, images: [U('1517248135467-4c7edcad34c4')], schedule: { days: [1,2,3,4,5,6,0], start: '12:00', end: '23:00', slot: 120 } },
      { name: 'Юрта «Эпос»', description: 'Традиционная юрта на 8 человек для особых мероприятий', capacity: 8, price: 500, images: [U('1517248135467-4c7edcad34c4')], schedule: { days: [1,2,3,4,5,6,0], start: '12:00', end: '23:00', slot: 120 } },
      { name: 'Банкетный зал «Ала-Тоо»', description: 'VIP-зал для торжеств на 30–50 человек', capacity: 50, price: 2000, images: [U('1414235077428-338989a2e8c0')], schedule: { days: [5,6,0], start: '14:00', end: '23:00', slot: 180 }, depositAmount: 5000 },
    ],
    services: [],
  },
  {
    slug: 'salon-elegance', name: 'Студия красоты Elegance', type: 'SALON',
    description: 'Топ-салон Бишкека. Стрижки, окрашивание, уход за ногтями. Используем профессиональную косметику Wella, L\'Oréal.',
    city: 'Бишкек', timezone: 'Asia/Bishkek',
    address: 'ул. Токтогула 111, Бишкек', phone: '+996 700 222 333', email: 'elegance.bishkek@gmail.com',
    ownerPhone: '+996700111003', ownerName: 'Гульнара Токтогулова',
    logoUrl: U('1560066984-138dadbbc9d5'),
    images: [U('1562322140-8bcd3a9e95d0'), U('1522337360788-8b13dee7a37e'), U('1487412912498-0447578fcca8'), U('1634449571010-02389ed0f9b4')],
    resources: [
      { name: 'Мастер Айгерим', description: 'Парикмахер-колорист, стаж 8 лет. Балаяж, омбре, кератин', capacity: 1, price: 0, images: [U('1522337360788-8b13dee7a37e')], schedule: { days: [1,2,3,4,5,6], start: '09:00', end: '20:00', slot: 60 } },
      { name: 'Мастер Зарина', description: 'Топ-стилист, международные сертификаты Wella', capacity: 1, price: 0, images: [U('1487412912498-0447578fcca8')], schedule: { days: [1,2,3,4,5,6], start: '10:00', end: '19:00', slot: 60 },
        exceptions: [{ date: inDays(20), isClosed: true, reason: 'Отпуск мастера' }] },
      { name: 'Мастер Асель — маникюр', description: 'Маникюр, педикюр, наращивание, гель-лак', capacity: 1, price: 0, images: [U('1634449571010-02389ed0f9b4')], schedule: { days: [2,3,4,5,6,0], start: '09:00', end: '18:00', slot: 90 } },
    ],
    services: [
      { name: 'Женская стрижка', durationMinutes: 60, price: 1200, resourceIdx: 0 },
      { name: 'Мужская стрижка', durationMinutes: 30, price: 700, resourceIdx: 0 },
      { name: 'Балаяж / омбре', durationMinutes: 180, price: 4500, resourceIdx: 0, depositAmount: 1000 },
      { name: 'Укладка', durationMinutes: 45, price: 800, resourceIdx: 1 },
      { name: 'Кератиновое выпрямление', durationMinutes: 180, price: 5500, resourceIdx: 1, depositAmount: 1500 },
      { name: 'Маникюр гель-лак', durationMinutes: 90, price: 900, resourceIdx: 2 },
      { name: 'Педикюр SPA', durationMinutes: 90, price: 1100, resourceIdx: 2 },
    ],
    staff: [
      { phone: '+996700111103', name: 'Айгерим Сагынбаева', position: 'Парикмахер-колорист', roleName: 'Мастер' },
      { phone: '+996700111104', name: 'Динара Молдалиева', position: 'Администратор', roleName: 'Администратор' },
    ],
    customRoles: [
      { name: 'Мастер', permissions: ['view_own_bookings', 'manage_own_schedule'] },
      { name: 'Администратор', permissions: ['manage_bookings', 'manage_schedule', 'manage_clients'] },
    ],
  },
  {
    slug: 'clinic-medstar', name: 'Клиника MedStar', type: 'MEDICAL',
    description: 'Многопрофильная частная клиника в Бишкеке. Диагностика, терапия, хирургия. Более 15 000 пациентов ежегодно.',
    city: 'Бишкек', timezone: 'Asia/Bishkek',
    address: 'ул. Ахунбаева 92, Бишкек', phone: '+996 312 393 939', email: 'appointment@medstar.kg',
    ownerPhone: '+996700111004', ownerName: 'Бакыт Жумабеков',
    logoUrl: U('1519494026892-bd820a60e54e'),
    images: [U('1551190822-a9333d879b1f'), U('1579154204601-02d80b2e02c5'), U('1532938911079-1346d177d49b'), U('1586991359119-a65bb4a2d68f')],
    resources: [
      { name: 'Терапевт Иванова А.В.', description: 'Кандидат медицинских наук, 15 лет практики', capacity: 1, price: 0, images: [U('1551190822-a9333d879b1f')], schedule: { days: [1,2,3,4,5], start: '08:00', end: '17:00', slot: 30 } },
      { name: 'Кардиолог Асанов Б.М.', description: 'Врач высшей категории, эхокардиография, ЭКГ, холтер', capacity: 1, price: 0, images: [U('1579154204601-02d80b2e02c5')], schedule: { days: [1,2,3,4,5], start: '09:00', end: '16:00', slot: 30 } },
      { name: 'Стоматолог Нурматова Д.К.', description: 'Терапевтическая и эстетическая стоматология, имплантация', capacity: 1, price: 0, images: [U('1532938911079-1346d177d49b')], schedule: { days: [1,2,3,4,5,6], start: '09:00', end: '18:00', slot: 60 } },
    ],
    services: [
      { name: 'Первичный приём терапевта', durationMinutes: 30, price: 800, resourceIdx: 0 },
      { name: 'Повторный приём', durationMinutes: 20, price: 500, resourceIdx: 0 },
      { name: 'Приём кардиолога', durationMinutes: 30, price: 1200, resourceIdx: 1 },
      { name: 'ЭКГ с расшифровкой', durationMinutes: 20, price: 600, resourceIdx: 1 },
      { name: 'Консультация стоматолога', durationMinutes: 30, price: 500, resourceIdx: 2 },
      { name: 'Лечение кариеса (1 зуб)', durationMinutes: 60, price: 3500, resourceIdx: 2, depositAmount: 500 },
    ],
    reminderRules: [{ offsetMinutes: 1440, label: 'За день' }, { offsetMinutes: 60, label: 'За час' }],
  },
  {
    slug: 'cowork-hub-bishkek', name: 'Hub Coworking', type: 'COWORKING',
    description: 'Лучший коворкинг Бишкека для фрилансеров, стартапов и команд. 24/7, высокоскоростной интернет, переговорные.',
    city: 'Бишкек', timezone: 'Asia/Bishkek',
    address: 'ул. Логвиненко 55, Бишкек', phone: '+996 555 100 200', email: 'hello@hubcowork.kg',
    ownerPhone: '+996700111005', ownerName: 'Эрмек Сыдыков',
    logoUrl: U('1497366216548-37526070297c'),
    images: [U('1497366811353-6870744d04b2'), U('1524758631624-e2822b8cf57d'), U('1541746972996-4e0143b4aa72'), U('1568992687947-868a62a9f521')],
    resources: [
      { name: 'Open Space — рабочее место', description: 'Фиксированное место в открытом зале, Wi-Fi до 500 Мбит/с', capacity: 1, price: 250, images: [U('1497366811353-6870744d04b2')], schedule: { days: [1,2,3,4,5,6,0], start: '07:00', end: '23:00', slot: 60 } },
      { name: 'Переговорная «Алатоо»', description: 'Переговорная на 6–8 человек, проектор, флипчарт, ТВ — свободное бронирование по часам', capacity: 8, price: 800, images: [U('1524758631624-e2822b8cf57d')], schedule: { days: [1,2,3,4,5], start: '08:00', end: '20:00', slot: 30 }, bookingMode: 'FREE_START' },
      { name: 'Приватный офис на 4 человека', description: 'Закрытый офис со стеклянными стенами, кондиционер, 4 стола', capacity: 4, price: 1500, images: [U('1541746972996-4e0143b4aa72')], schedule: { days: [1,2,3,4,5,6,0], start: '07:00', end: '23:00', slot: 240 } },
    ],
    services: [
      { name: 'Аренда переговорной (1 час)', durationMinutes: 60, price: 800, resourceIdx: 1 },
      { name: 'Аренда переговорной (2 часа)', durationMinutes: 120, price: 1400, resourceIdx: 1 },
      { name: 'Аренда переговорной (полдня)', durationMinutes: 240, price: 2500, resourceIdx: 1 },
    ],
  },
  {
    slug: 'sport-flex-gym', name: 'Flex Fitness Club', type: 'SPORT',
    description: 'Премиум фитнес-клуб в центре Бишкека. Тренажёрный зал, бассейн 25м, сауна, йога, пилатес, TRX.',
    city: 'Бишкек', timezone: 'Asia/Bishkek',
    address: 'пр. Чуй 155, Бишкек', phone: '+996 312 450 450', email: 'flex@fitclub.kg',
    ownerPhone: '+996700111006', ownerName: 'Максат Орозов',
    logoUrl: U('1534438327776-9ead3634e659'),
    images: [U('1571019613454-1cb2f99b2d8b'), U('1599058918144-5d39b59a3b6d'), U('1576678927484-cc907957088c'), U('1526506118085-60ce8714f8c5')],
    resources: [
      { name: 'Тренажёрный зал', description: 'Оборудование Technogym, кардиозона, свободные веса', capacity: 30, price: 400, images: [U('1571019613454-1cb2f99b2d8b')], schedule: { days: [1,2,3,4,5,6,0], start: '06:00', end: '23:00', slot: 60 } },
      { name: 'Бассейн 25м', description: 'Олимпийский бассейн 6 дорожек, 27°C, детская зона', capacity: 12, price: 500, images: [U('1576678927484-cc907957088c')], schedule: { days: [1,2,3,4,5,6,0], start: '07:00', end: '22:00', slot: 60 } },
      { name: 'Зал групповых занятий', description: 'Йога, пилатес, стретчинг, TRX — до 15 участников', capacity: 15, price: 600, images: [U('1526506118085-60ce8714f8c5')], schedule: { days: [1,2,3,4,5,6], start: '08:00', end: '21:00', slot: 60 } },
    ],
    services: [
      { name: 'Персональная тренировка', durationMinutes: 60, price: 2000, resourceIdx: 0 },
      { name: 'Аквааэробика', durationMinutes: 60, price: 700, resourceIdx: 1 },
      { name: 'Йога утренняя', durationMinutes: 60, price: 600, resourceIdx: 2 },
      { name: 'Пилатес', durationMinutes: 60, price: 650, resourceIdx: 2 },
    ],
  },
  {
    slug: 'barber-bro', name: 'Барбершоп BRO', type: 'SALON',
    description: 'Мужской барбершоп в стиле loft. Стрижки, оформление бород, горячее бритьё опасной бритвой.',
    city: 'Бишкек', timezone: 'Asia/Bishkek',
    address: 'ул. Исанова 80, Бишкек', phone: '+996 700 800 900', email: 'bro.barber@gmail.com',
    ownerPhone: '+996700111007', ownerName: 'Тимур Абдыкадыров',
    logoUrl: U('1503951914875-452162b0f3f1'),
    images: [U('1621605815971-b3d6db1fe8f7'), U('1599351431613-2d8a08a86c17'), U('1548249809-8f2a2b2a3e9b'), U('1622296572-99efeb7dbf2d')],
    resources: [
      { name: 'Барбер Алтай', description: 'Главный барбер, чемпион кыргызских конкурсов 2022–2023', capacity: 1, price: 0, images: [U('1621605815971-b3d6db1fe8f7')], schedule: { days: [1,2,3,4,5,6], start: '10:00', end: '21:00', slot: 45 } },
      { name: 'Барбер Мирлан', description: 'Специалист по фейдам и скинфейдам', capacity: 1, price: 0, images: [U('1599351431613-2d8a08a86c17')], schedule: { days: [2,3,4,5,6,0], start: '11:00', end: '20:00', slot: 45 } },
    ],
    services: [
      { name: 'Стрижка классика', durationMinutes: 30, price: 800, resourceIdx: 0 },
      { name: 'Стрижка + борода', durationMinutes: 45, price: 1100, resourceIdx: 0 },
      { name: 'Горячее бритьё', durationMinutes: 30, price: 700, resourceIdx: 0 },
      { name: 'Скинфейд', durationMinutes: 45, price: 900, resourceIdx: 1 },
    ],
  },
  {
    slug: 'cafe-arzu', name: 'Кафе Арзу', type: 'RESTAURANT',
    description: 'Уютное кафе кыргызской и восточной кухни. Домашние манты, бешбармак, лагман. Семейная атмосфера.',
    city: 'Бишкек', timezone: 'Asia/Bishkek',
    address: 'ул. Боконбаева 120, Бишкек', phone: '+996 312 555 444', email: 'cafe.arzu@gmail.com',
    ownerPhone: '+996700111008', ownerName: 'Венера Исаева',
    logoUrl: U('1555396273-38ea89aeae0c'),
    images: [U('1555396273-38ea89aeae0c'), U('1414235077428-338989a2e8c0'), U('1517248135467-4c7edcad34c4')],
    resources: [
      { name: 'Стол на 2', description: 'Столик для двоих у окна', capacity: 2, price: 0, images: [], schedule: { days: [1,2,3,4,5,6,0], start: '10:00', end: '22:00', slot: 90 } },
      { name: 'Стол на 4', description: 'Стол для небольшой компании', capacity: 4, price: 0, images: [], schedule: { days: [1,2,3,4,5,6,0], start: '10:00', end: '22:00', slot: 90 } },
      { name: 'Банкетный стол на 10', description: 'Большой стол для семейных ужинов', capacity: 10, price: 0, images: [], schedule: { days: [5,6,0], start: '12:00', end: '22:00', slot: 120 } },
    ],
    services: [],
  },
  {
    slug: 'photostudio-kadr', name: 'Фотостудия Kadr', type: 'CUSTOM',
    description: 'Фотостудия в аренду почасово. Циклорама, профессиональный свет, реквизит и фоны на выбор.',
    city: 'Бишкек', timezone: 'Asia/Bishkek',
    address: 'ул. Раззакова 15, Бишкек', phone: '+996 700 111 999', email: 'kadr.studio@gmail.com',
    ownerPhone: '+996700111009', ownerName: 'Айбек Дуйшеев',
    logoUrl: U('1554048612-b6a482bc67e5'),
    images: [U('1554048612-b6a482bc67e5'), U('1493863641943-9b68992a8d9b'), U('1516035069371-29a1b244cc32')],
    resources: [
      { name: 'Зал с циклорамой', description: 'Белая циклорама 6×4м, студийный свет Godox, фон на выбор', capacity: 15, price: 1000, images: [U('1554048612-b6a482bc67e5')], schedule: { days: [1,2,3,4,5,6,0], start: '09:00', end: '22:00', slot: 30 }, bookingMode: 'FREE_START', depositAmount: 1000 },
      { name: 'Лофт-локация', description: 'Кирпичные стены, винтажная мебель, естественный свет из окон', capacity: 10, price: 900, images: [U('1493863641943-9b68992a8d9b')], schedule: { days: [1,2,3,4,5,6,0], start: '09:00', end: '21:00', slot: 30 }, bookingMode: 'FREE_START' },
    ],
    services: [
      { name: 'Аренда на 1 час', durationMinutes: 60, price: 1000, resourceIdx: 0 },
      { name: 'Аренда на 2 часа', durationMinutes: 120, price: 1800, resourceIdx: 0 },
      { name: 'Полдня (4 часа) + ассистент', durationMinutes: 240, price: 3500, resourceIdx: 0, depositAmount: 1500 },
    ],
  },

  // ════════════════════════════ АЛМАТЫ (Asia/Almaty, +7) ═══════════════════════
  {
    slug: 'hotel-kazyna-almaty', name: 'Отель Kazyna', type: 'HOTEL',
    description: 'Бутик-отель у подножия Заилийского Алатау. Вид на горы, ресторан казахской кухни, спа-центр.',
    city: 'Алматы', timezone: 'Asia/Almaty',
    address: 'ул. Достык 105, Алматы', phone: '+7 727 250 10 10', email: 'info@kazynahotel.kz',
    ownerPhone: '+77071112001', ownerName: 'Ерлан Сатыбалдин',
    logoUrl: U('1551882547-ff40c63fe5fa'),
    images: [U('1566073771259-5f92f595f60b'), U('1445019980597-93fa8acb246c'), U('1611892440504-42a792e24d32'), U('1445991842772-097fea258e7b')],
    resources: [
      { name: 'Стандарт', description: 'Номер 26 м², вид во двор, рабочая зона', capacity: 2, price: 15000, images: [U('1611892440504-42a792e24d32')], schedule: { days: [0,1,2,3,4,5,6], start: '14:00', end: '12:00', slot: 1440 }, depositAmount: 5000 },
      { name: 'Делюкс с видом на горы', description: 'Номер 35 м², панорама Заилийского Алатау, балкон', capacity: 2, price: 24000, images: [U('1611892440504-42a792e24d32')], schedule: { days: [0,1,2,3,4,5,6], start: '14:00', end: '12:00', slot: 1440 }, depositAmount: 8000 },
    ],
    services: [],
    cancellationPolicy: { freeCancellationHours: 24, penaltyPercent: 30, noRefundHours: 6 },
    reminderRules: [{ offsetMinutes: 1440, label: 'За день' }],
    translations: { en: { name: 'Kazyna Hotel', description: 'A boutique hotel at the foot of the Trans-Ili Alatau with mountain views, a Kazakh restaurant, and a spa center.' } },
  },
  {
    slug: 'restaurant-dastarkhan', name: 'Ресторан Дастархан', type: 'RESTAURANT',
    description: 'Казахская кухня и традиции гостеприимства. Бешбармак, казы, баурсаки. Банкетные залы для тоев.',
    city: 'Алматы', timezone: 'Asia/Almaty',
    address: 'мкр. Самал-2, 33, Алматы', phone: '+7 727 258 40 40', email: 'zakaz@dastarkhan.kz',
    ownerPhone: '+77071112002', ownerName: 'Асем Нурланқызы',
    logoUrl: U('1414235077428-338989a2e8c0'),
    images: [U('1414235077428-338989a2e8c0'), U('1424847651672-bf20a4b0982b'), U('1466978913421-dad2ebd01d17')],
    resources: [
      { name: 'Основной зал — стол на 4', description: 'Стол у панорамного окна', capacity: 4, price: 0, images: [], schedule: { days: [1,2,3,4,5,6,0], start: '11:00', end: '23:00', slot: 90 } },
      { name: 'Банкетный зал «Той»', description: 'Зал для торжеств на 60–100 человек', capacity: 100, price: 3000, images: [U('1414235077428-338989a2e8c0')], schedule: { days: [5,6,0], start: '13:00', end: '23:59', slot: 240 }, depositAmount: 10000 },
    ],
    services: [],
  },
  {
    slug: 'aiya-beauty-almaty', name: 'Beauty Studio Aiya', type: 'SALON',
    description: 'Премиальная студия красоты в Алматы. Окрашивание, укладки, ногтевой сервис, брови и ресницы.',
    city: 'Алматы', timezone: 'Asia/Almaty',
    address: 'ул. Абая 52, Алматы', phone: '+7 707 111 22 33', email: 'aiya.beauty@gmail.com',
    ownerPhone: '+77071112003', ownerName: 'Динара Ахметова',
    logoUrl: U('1560066984-138dadbbc9d5'),
    images: [U('1562322140-8bcd3a9e95d0'), U('1522337360788-8b13dee7a37e'), U('1487412912498-0447578fcca8')],
    resources: [
      { name: 'Мастер Жанна', description: 'Колорист, стаж 10 лет. Сложное окрашивание, уход', capacity: 1, price: 0, images: [U('1522337360788-8b13dee7a37e')], schedule: { days: [1,2,3,4,5,6], start: '09:00', end: '19:00', slot: 60 } },
      { name: 'Мастер по бровям Алия', description: 'Архитектура бровей, ламинирование ресниц', capacity: 1, price: 0, images: [U('1487412912498-0447578fcca8')], schedule: { days: [2,3,4,5,6,0], start: '10:00', end: '19:00', slot: 45 } },
    ],
    services: [
      { name: 'Окрашивание в один тон', durationMinutes: 90, price: 8000, resourceIdx: 0 },
      { name: 'Сложное окрашивание', durationMinutes: 180, price: 18000, resourceIdx: 0, depositAmount: 3000 },
      { name: 'Коррекция + окрашивание бровей', durationMinutes: 45, price: 4000, resourceIdx: 1 },
      { name: 'Ламинирование ресниц', durationMinutes: 60, price: 7000, resourceIdx: 1 },
    ],
  },
  {
    slug: 'almaty-health-clinic', name: 'Медцентр Almaty Health', type: 'MEDICAL',
    description: 'Современный медицинский центр. Терапия, УЗИ-диагностика, лабораторные анализы, вакцинация.',
    city: 'Алматы', timezone: 'Asia/Almaty',
    address: 'ул. Розыбакиева 247, Алматы', phone: '+7 727 300 20 20', email: 'reception@almatyhealth.kz',
    ownerPhone: '+77071112004', ownerName: 'Тимур Байжанов',
    logoUrl: U('1519494026892-bd820a60e54e'),
    images: [U('1551190822-a9333d879b1f'), U('1579154204601-02d80b2e02c5'), U('1586991359119-a65bb4a2d68f')],
    resources: [
      { name: 'Терапевт Сарсенова Г.К.', description: 'Врач общей практики, 12 лет стажа', capacity: 1, price: 0, images: [U('1551190822-a9333d879b1f')], schedule: { days: [1,2,3,4,5], start: '08:00', end: '17:00', slot: 30 } },
      { name: 'УЗИ-диагност Ким Е.С.', description: 'УЗИ брюшной полости, щитовидной железы, суставов', capacity: 1, price: 0, images: [U('1579154204601-02d80b2e02c5')], schedule: { days: [1,2,3,4,5,6], start: '09:00', end: '18:00', slot: 30 } },
    ],
    services: [
      { name: 'Приём терапевта', durationMinutes: 30, price: 6000, resourceIdx: 0 },
      { name: 'УЗИ брюшной полости', durationMinutes: 30, price: 9000, resourceIdx: 1 },
      { name: 'УЗИ щитовидной железы', durationMinutes: 20, price: 7000, resourceIdx: 1 },
    ],
    reminderRules: [{ offsetMinutes: 1440, label: 'За день' }, { offsetMinutes: 120, label: 'За 2 часа' }],
  },
  {
    slug: 'fitzone24-almaty', name: 'FitZone 24', type: 'SPORT',
    description: 'Круглосуточный фитнес-клуб в Алматы. Тренажёрный зал работает 24/7 — тренируйтесь когда удобно.',
    city: 'Алматы', timezone: 'Asia/Almaty',
    address: 'пр. Достык 91, Алматы', phone: '+7 727 355 24 24', email: 'hello@fitzone24.kz',
    ownerPhone: '+77071112005', ownerName: 'Санжар Куанышев',
    logoUrl: U('1534438327776-9ead3634e659'),
    images: [U('1571019613454-1cb2f99b2d8b'), U('1599058918144-5d39b59a3b6d'), U('1526506118085-60ce8714f8c5')],
    resources: [
      // Overnight schedule: opens 00:00 and stays open until 23:59 the same slot-cycle — demoed via a genuine wrap (22:00 → 06:00 late-night access window on top of daytime hours would need 2 schedules; simplest true overnight demo: 20:00–08:00 access window)
      { name: 'Тренажёрный зал (24 часа)', description: 'Полный доступ к залу круглосуточно, включая ночные часы', capacity: 40, price: 300, images: [U('1571019613454-1cb2f99b2d8b')], schedule: { days: [1,2,3,4,5,6,0], start: '00:00', end: '23:59', slot: 60 } },
      { name: 'Ночная смена (20:00–08:00)', description: 'Отдельный слот для ночных тренировок с персональным тренером', capacity: 5, price: 1500, images: [U('1599058918144-5d39b59a3b6d')], schedule: { days: [1,2,3,4,5,6,0], start: '20:00', end: '08:00', slot: 60 } },
      { name: 'Групповые занятия', description: 'Кроссфит, функциональный тренинг, стретчинг', capacity: 12, price: 800, images: [U('1526506118085-60ce8714f8c5')], schedule: { days: [1,2,3,4,5,6], start: '07:00', end: '21:00', slot: 60 } },
    ],
    services: [
      { name: 'Персональная тренировка (ночь)', durationMinutes: 60, price: 3000, resourceIdx: 1 },
      { name: 'Кроссфит', durationMinutes: 60, price: 900, resourceIdx: 2 },
    ],
  },
  {
    slug: 'techauto-almaty', name: 'Автосервис TechAuto', type: 'CUSTOM',
    description: 'Техцентр полного цикла: диагностика, ТО, кузовной ремонт. Запись на подъёмник онлайн — экономьте время.',
    city: 'Алматы', timezone: 'Asia/Almaty',
    address: 'ул. Толе би 220, Алматы', phone: '+7 727 279 90 90', email: 'zapis@techauto.kz',
    ownerPhone: '+77071112006', ownerName: 'Руслан Ибрагимов',
    logoUrl: U('1487754180451-c456f719a1fc'),
    images: [U('1487754180451-c456f719a1fc'), U('1530046339160-ce3e530c7d2f'), U('1632823469850-1b7b1e8b7d0f')],
    resources: [
      { name: 'Подъёмник №1 — легковые', description: 'ТО, замена масла, диагностика подвески', capacity: 1, price: 0, images: [U('1487754180451-c456f719a1fc')], schedule: { days: [1,2,3,4,5,6], start: '09:00', end: '19:00', slot: 30 }, bookingMode: 'FREE_START' },
      { name: 'Подъёмник №2 — кузовной ремонт', description: 'Малярно-кузовные работы, полировка', capacity: 1, price: 0, images: [U('1530046339160-ce3e530c7d2f')], schedule: { days: [1,2,3,4,5,6], start: '09:00', end: '18:00', slot: 60 }, bookingMode: 'FREE_START', depositAmount: 5000 },
    ],
    services: [
      { name: 'Диагностика ходовой', durationMinutes: 60, price: 5000, resourceIdx: 0 },
      { name: 'Замена масла и фильтров', durationMinutes: 30, price: 8000, resourceIdx: 0 },
      { name: 'Полировка кузова', durationMinutes: 180, price: 25000, resourceIdx: 1, depositAmount: 5000 },
    ],
  },
  {
    slug: 'most-space-almaty', name: 'MOST Space', type: 'COWORKING',
    description: 'Коворкинг для команд и стартапов в деловом центре Алматы. Переговорные, event-зона, кофе-поинт.',
    city: 'Алматы', timezone: 'Asia/Almaty',
    address: 'пр. Аль-Фараби 17, Алматы', phone: '+7 727 244 55 66', email: 'team@mostspace.kz',
    ownerPhone: '+77071112007', ownerName: 'Айгерим Серікқызы',
    logoUrl: U('1497366216548-37526070297c'),
    images: [U('1497366811353-6870744d04b2'), U('1524758631624-e2822b8cf57d'), U('1568992687947-868a62a9f521')],
    resources: [
      { name: 'Open Space', description: 'Рабочее место в общем зале', capacity: 1, price: 3000, images: [U('1497366811353-6870744d04b2')], schedule: { days: [1,2,3,4,5], start: '08:00', end: '22:00', slot: 1440 } },
      { name: 'Переговорная «Медео»', description: 'До 10 человек, видеосвязь, флипчарт', capacity: 10, price: 4000, images: [U('1524758631624-e2822b8cf57d')], schedule: { days: [1,2,3,4,5], start: '08:00', end: '20:00', slot: 60 } },
    ],
    services: [],
    staff: [
      { phone: '+77071112107', name: 'Мадина Сериккызы', position: 'Community-менеджер', roleName: 'Менеджер' },
    ],
    customRoles: [{ name: 'Менеджер', permissions: ['manage_bookings', 'manage_clients'] }],
  },

  // ════════════════════════════ ТАШКЕНТ (Asia/Tashkent, +998) ══════════════════
  {
    slug: 'hotel-silk-road-tashkent', name: 'Отель Шёлковый путь', type: 'HOTEL',
    description: 'Отель в историческом центре Ташкента. Восточный колорит, современный комфорт, ресторан узбекской кухни.',
    city: 'Ташкент', timezone: 'Asia/Tashkent',
    address: 'ул. Шахрисабз 8, Ташкент', phone: '+998 71 233 44 55', email: 'info@silkroad-hotel.uz',
    ownerPhone: '+998901113001', ownerName: 'Шерзод Каримов',
    logoUrl: U('1445991842772-097fea258e7b'),
    images: [U('1564501049412-61d2d62591c2'), U('1445019980597-93fa8acb246c'), U('1611892440504-42a792e24d32')],
    resources: [
      { name: 'Стандартный номер', description: 'Номер 24 м², традиционный узбекский декор', capacity: 2, price: 550000, images: [U('1611892440504-42a792e24d32')], schedule: { days: [0,1,2,3,4,5,6], start: '14:00', end: '12:00', slot: 1440 }, depositAmount: 200000 },
      { name: 'Люкс «Регистан»', description: 'Просторный люкс с элементами восточной архитектуры, 45 м²', capacity: 3, price: 950000, images: [U('1611892440504-42a792e24d32')], schedule: { days: [0,1,2,3,4,5,6], start: '14:00', end: '12:00', slot: 1440 }, depositAmount: 300000 },
    ],
    services: [],
    cancellationPolicy: { freeCancellationHours: 24, penaltyPercent: 40, noRefundHours: 6 },
    translations: {
      en: { name: 'Silk Road Hotel', description: 'A hotel in the historic center of Tashkent — Eastern character, modern comfort, and an Uzbek restaurant.' },
      uz: { name: 'Ipak Yoʻli mehmonxonasi', description: 'Toshkent tarixiy markazidagi mehmonxona — sharqona koʻrinish, zamonaviy qulaylik va oʻzbek restorani.' },
    },
  },
  {
    slug: 'plov-markazi-tashkent', name: 'Plov Markazi', type: 'RESTAURANT',
    description: 'Легендарная плов-центр Ташкента. Настоящий узбекский плов из казана, самса, шашлык. Всегда многолюдно — бронируйте стол заранее.',
    city: 'Ташкент', timezone: 'Asia/Tashkent',
    address: 'массив Чиланзар, Ташкент', phone: '+998 71 277 88 99', email: 'stol@plovmarkazi.uz',
    ownerPhone: '+998901113002', ownerName: 'Аброр Юсупов',
    logoUrl: U('1414235077428-338989a2e8c0'),
    images: [U('1414235077428-338989a2e8c0'), U('1424847651672-bf20a4b0982b'), U('1466978913421-dad2ebd01d17')],
    resources: [
      { name: 'Зал — стол на 4', description: 'Классический зал, живая очередь казанов на виду', capacity: 4, price: 0, images: [], schedule: { days: [1,2,3,4,5,6,0], start: '08:00', end: '22:00', slot: 60 } },
      { name: 'Тарас (веранда) — стол на 6', description: 'Открытая веранда, вид на улицу', capacity: 6, price: 0, images: [U('1414235077428-338989a2e8c0')], schedule: { days: [1,2,3,4,5,6,0], start: '08:00', end: '22:00', slot: 60 } },
    ],
    services: [],
    translations: { uz: { name: 'Plov Markazi', description: 'Toshkentning afsonaviy osh markazi. Qozondan haqiqiy oʻzbek oshi, somsa, shashlik.' } },
  },
  {
    slug: 'beauty-lab-tashkent', name: 'Beauty Lab Tashkent', type: 'SALON',
    description: 'Современная студия красоты в Ташкенте. Стрижки, окрашивание, перманентный макияж, ногтевой сервис.',
    city: 'Ташкент', timezone: 'Asia/Tashkent',
    address: 'ул. Амира Темура 45, Ташкент', phone: '+998 90 111 22 33', email: 'beautylab.tash@gmail.com',
    ownerPhone: '+998901113003', ownerName: 'Нилуфар Азимова',
    logoUrl: U('1560066984-138dadbbc9d5'),
    images: [U('1562322140-8bcd3a9e95d0'), U('1522337360788-8b13dee7a37e'), U('1634449571010-02389ed0f9b4')],
    resources: [
      { name: 'Мастер Шахноза', description: 'Стилист-парикмахер, стрижки и укладки', capacity: 1, price: 0, images: [U('1522337360788-8b13dee7a37e')], schedule: { days: [1,2,3,4,5,6], start: '09:00', end: '19:00', slot: 60 } },
      { name: 'Мастер маникюра Гулноза', description: 'Маникюр, педикюр, дизайн ногтей', capacity: 1, price: 0, images: [U('1634449571010-02389ed0f9b4')], schedule: { days: [1,2,3,4,5,6,0], start: '09:00', end: '18:00', slot: 90 } },
    ],
    services: [
      { name: 'Женская стрижка', durationMinutes: 60, price: 100000, resourceIdx: 0 },
      { name: 'Окрашивание', durationMinutes: 120, price: 300000, resourceIdx: 0, depositAmount: 50000 },
      { name: 'Маникюр гель-лак', durationMinutes: 90, price: 90000, resourceIdx: 1 },
    ],
  },
  {
    slug: 'tashkent-med-clinic', name: 'Tashkent Med Clinic', type: 'MEDICAL',
    description: 'Частная клиника семейной медицины. Приём терапевта, педиатра, лабораторная диагностика.',
    city: 'Ташкент', timezone: 'Asia/Tashkent',
    address: 'Мирзо-Улугбекский район, Ташкент', phone: '+998 71 200 10 10', email: 'info@tashmedclinic.uz',
    ownerPhone: '+998901113004', ownerName: 'Фаррух Расулов',
    logoUrl: U('1519494026892-bd820a60e54e'),
    images: [U('1551190822-a9333d879b1f'), U('1532938911079-1346d177d49b')],
    resources: [
      { name: 'Терапевт Юлдашева М.А.', description: 'Врач общей практики, 10 лет стажа', capacity: 1, price: 0, images: [U('1551190822-a9333d879b1f')], schedule: { days: [1,2,3,4,5,6], start: '08:00', end: '18:00', slot: 30 } },
      { name: 'Педиатр Азимов Ш.Р.', description: 'Приём детей от 0 до 18 лет', capacity: 1, price: 0, images: [U('1532938911079-1346d177d49b')], schedule: { days: [1,2,3,4,5], start: '09:00', end: '17:00', slot: 30 } },
    ],
    services: [
      { name: 'Приём терапевта', durationMinutes: 30, price: 150000, resourceIdx: 0 },
      { name: 'Приём педиатра', durationMinutes: 30, price: 150000, resourceIdx: 1 },
    ],
    reminderRules: [{ offsetMinutes: 1440, label: 'За день' }],
  },
  {
    slug: 'anhor-fitness-tashkent', name: 'Anhor Fitness', type: 'SPORT',
    description: 'Фитнес-клуб у канала Анхор. Тренажёрный зал, групповые программы, бассейн.',
    city: 'Ташкент', timezone: 'Asia/Tashkent',
    address: 'массив Анхор, Ташкент', phone: '+998 71 244 66 77', email: 'info@anhorfit.uz',
    ownerPhone: '+998901113005', ownerName: 'Жасур Тошматов',
    logoUrl: U('1534438327776-9ead3634e659'),
    images: [U('1571019613454-1cb2f99b2d8b'), U('1576678927484-cc907957088c')],
    resources: [
      { name: 'Тренажёрный зал', description: 'Полный набор оборудования, зона кроссфита', capacity: 25, price: 40000, images: [U('1571019613454-1cb2f99b2d8b')], schedule: { days: [1,2,3,4,5,6,0], start: '06:00', end: '23:00', slot: 60 } },
      { name: 'Бассейн', description: 'Крытый бассейн 4 дорожки, подогрев', capacity: 10, price: 60000, images: [U('1576678927484-cc907957088c')], schedule: { days: [1,2,3,4,5,6,0], start: '07:00', end: '21:00', slot: 60 } },
    ],
    services: [
      { name: 'Персональная тренировка', durationMinutes: 60, price: 200000, resourceIdx: 0 },
    ],
    reminderRules: [{ offsetMinutes: 180, label: 'За 3 часа' }],
  },
  {
    slug: 'sirli-xona-tashkent', name: 'Sirli Xona', type: 'CUSTOM',
    description: 'Квест-румы в самом центре Ташкента. 5 уникальных сюжетов, актёры, спецэффекты. Отличный вариант для дня рождения и корпоратива.',
    city: 'Ташкент', timezone: 'Asia/Tashkent',
    address: 'ул. Бабура 12, Ташкент', phone: '+998 90 555 44 33', email: 'booking@sirlixona.uz',
    ownerPhone: '+998901113006', ownerName: 'Диёр Хамидов',
    logoUrl: U('1518709268805-4e9042af2176'),
    images: [U('1518709268805-4e9042af2176'), U('1509228468518-180dd4864904'), U('1528642474498-1af0c17fd8c3')],
    resources: [
      { name: 'Квест «Побег из тюрьмы»', description: '60 минут, 2–6 игроков, средняя сложность', capacity: 6, price: 400000, images: [U('1518709268805-4e9042af2176')], schedule: { days: [1,2,3,4,5,6,0], start: '10:00', end: '23:00', slot: 75 } },
      { name: 'Квест «Тайна фараона»', description: '60 минут, 2–5 игроков, для новичков', capacity: 5, price: 350000, images: [U('1509228468518-180dd4864904')], schedule: { days: [1,2,3,4,5,6,0], start: '10:00', end: '23:00', slot: 75 } },
    ],
    services: [],
  },
]

// ─── Review texts by business type ───────────────────────────────────────────
const REVIEWS: Record<string, string[]> = {
  HOTEL: [
    'Отличный отель, персонал очень внимателен. Виды на горы — незабываемые. Обязательно вернёмся!',
    'Чисто, уютно, завтрак отличный. Единственный минус — парковка небольшая.',
    'Лучший отель в городе. Кровать удобная, тихо даже в центре.',
    'Приехали на деловую встречу — всё организовано на высшем уровне.',
  ],
  RESTAURANT: [
    'Манты просто таяли во рту! Обязательно приедем ещё с семьёй.',
    'Атмосфера потрясающая, живая музыка, еда вкусная.',
    'Давно искали место с настоящей национальной кухней — нашли!',
    'Плов/бешбармак лучший в городе, без преувеличения. Порции огромные.',
  ],
  SALON: [
    'Мастер сделала потрясающую работу! Все подруги спрашивают, где я это делала.',
    'Быстро, аккуратно, профессионально. Держится уже три недели.',
    'Лучший мастер в городе — работа выполнена идеально.',
    'Пришла с фото, получила именно то, что хотела. Записалась ещё раз.',
    'Чистота, комфорт, мастера знают своё дело. Рекомендую всем!',
  ],
  MEDICAL: [
    'Врач очень внимательный, всё объяснил подробно, не торопил.',
    'Современное оборудование, никакой очереди — запись строго по времени.',
    'Сдала анализы, результаты пришли быстро. Удобно!',
    'Наконец-то нашла врача, к которому не страшно приходить.',
  ],
  COWORKING: [
    'Лучший коворкинг в городе. Интернет мощный, кофе вкусный, тихо.',
    'Провёл здесь три недели во время командировки. Всё отлично.',
    'Переговорная удобная, оборудование работает, цена адекватная.',
    'Наконец-то место, где можно нормально поработать без отвлечений.',
  ],
  SPORT: [
    'Оборудование на европейском уровне. Тренеры знают дело.',
    'Хожу полгода — результат заметен. Атмосфера мотивирующая.',
    'Ночные тренировки — отличная опция для моего графика.',
    'Единственный минус — в час пик бывает очередь на некоторые тренажёры.',
  ],
  CUSTOM: [
    'Отличное место, всё прошло на высшем уровне, обязательно вернёмся.',
    'Удобная онлайн-запись, никаких проблем с бронированием.',
    'Персонал очень помог, объяснили всё по телефону заранее.',
    'Рекомендую — цена полностью соответствует качеству.',
  ],
}
const OWNER_REPLIES = [
  'Спасибо большое за отзыв! Будем рады видеть вас снова 🙏',
  'Благодарим за тёплые слова! Стараемся для вас.',
  'Спасибо! Обязательно передадим мастеру ваши слова.',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}
function slotAt(base: Date, hour: number, minute = 0) {
  const d = new Date(base)
  d.setHours(hour, minute, 0, 0)
  return d
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🧹 Cleaning database (keeping SUPERADMIN accounts)...')

  await prisma.review.deleteMany()
  await prisma.reminderLog.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.recurringRule.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.reminderRule.deleteMany()
  await prisma.service.deleteMany()
  await prisma.scheduleException.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.resource.deleteMany()
  await prisma.cancellationPolicy.deleteMany()
  await prisma.staffMember.deleteMany()
  await prisma.customRole.deleteMany()
  await prisma.businessTranslation.deleteMany()
  await prisma.business.deleteMany()
  await prisma.user.deleteMany({ where: { role: { not: 'SUPERADMIN' } } })

  console.log('✅ Database cleaned')

  // ── Customers (spread across all 3 cities) ──────────────────────────────────
  const customerDefs = [
    { phone: '+996700111222', name: 'Айзат Кулова' },
    { phone: '+996555333444', name: 'Руслан Бейшеев' },
    { phone: '+77071119001', name: 'Алия Жаксыбекова' },
    { phone: '+77071119002', name: 'Данияр Сулейменов' },
    { phone: '+998901119001', name: 'Мадина Юлдашева' },
    { phone: '+998901119002', name: 'Botir Ergashev' },
  ]
  const customers = []
  for (const c of customerDefs) {
    customers.push(await prisma.user.upsert({
      where: { phone: c.phone },
      update: { name: c.name },
      create: { phone: c.phone, name: c.name, role: 'CUSTOMER' },
    }))
  }
  console.log(`👤 ${customers.length} customers ready`)

  console.log('🏢 Seeding businesses...')

  let bizCount = 0, resCount = 0, svcCount = 0, bookingCount = 0, reviewCount = 0

  for (const [bizIdx, biz] of BUSINESSES.entries()) {
    const owner = await prisma.user.upsert({
      where: { phone: biz.ownerPhone },
      update: { name: biz.ownerName, role: 'BUSINESS_OWNER' },
      create: { phone: biz.ownerPhone, name: biz.ownerName, role: 'BUSINESS_OWNER' },
    })

    const created = await prisma.business.create({
      data: {
        slug: biz.slug, name: biz.name, type: biz.type, description: biz.description,
        address: biz.address, phone: biz.phone, email: biz.email,
        timezone: biz.timezone,
        logoUrl: biz.logoUrl, images: biz.images,
        ownerId: owner.id,
        subscriptionPlan: 'PRO',
        isActive: true,
      },
    })
    bizCount++
    console.log(`  ✓ [${biz.city}] ${created.name}`)

    // Translations
    if (biz.translations) {
      for (const [locale, tr] of Object.entries(biz.translations)) {
        await prisma.businessTranslation.create({
          data: { businessId: created.id, locale, name: tr?.name, description: tr?.description },
        })
      }
    }

    // Cancellation policy
    if (biz.cancellationPolicy) {
      await prisma.cancellationPolicy.create({ data: { businessId: created.id, ...biz.cancellationPolicy } })
    }
    // Reminder rules
    for (const rule of biz.reminderRules ?? []) {
      await prisma.reminderRule.create({ data: { businessId: created.id, ...rule } })
    }

    // Custom roles (create first so staff can reference them)
    const roleByName: Record<string, string> = {}
    for (const role of biz.customRoles ?? []) {
      const r = await prisma.customRole.create({ data: { businessId: created.id, name: role.name, permissions: role.permissions } })
      roleByName[role.name] = r.id
    }
    // Staff
    for (const s of biz.staff ?? []) {
      const staffUser = await prisma.user.upsert({
        where: { phone: s.phone },
        update: { name: s.name },
        create: { phone: s.phone, name: s.name, role: 'STAFF' },
      })
      await prisma.staffMember.create({
        data: {
          userId: staffUser.id, businessId: created.id,
          position: s.position, bio: null,
          roleId: s.roleName ? roleByName[s.roleName] : undefined,
        },
      })
    }

    // Resources + schedules + exceptions
    const createdResources: { resource: { id: string }; price: number }[] = []
    for (const res of biz.resources) {
      const { schedule, images: resImages, price, exceptions, bookingMode, depositAmount, ...resData } = res
      const resource = await prisma.resource.create({
        data: {
          ...resData,
          images: resImages,
          businessId: created.id,
          isActive: true,
          bookingMode: bookingMode ?? 'FIXED',
          depositAmount: depositAmount ?? null,
        },
      })
      createdResources.push({ resource, price })
      resCount++

      const createdSchedule = await prisma.schedule.create({
        data: {
          resourceId: resource.id,
          dayOfWeek: schedule.days,
          startTime: schedule.start,
          endTime: schedule.end,
          slotDurationMinutes: schedule.slot,
          isActive: true,
        },
      })

      for (const ex of exceptions ?? []) {
        await prisma.scheduleException.create({
          data: { scheduleId: createdSchedule.id, date: ex.date, isClosed: ex.isClosed, reason: ex.reason },
        })
      }
    }

    // Services
    for (const svc of biz.services) {
      const { resourceIdx, depositAmount, ...svcData } = svc
      await prisma.service.create({
        data: {
          ...svcData,
          depositAmount: depositAmount ?? null,
          businessId: created.id,
          resourceId: createdResources[resourceIdx]?.resource.id,
          isActive: true,
        },
      })
      svcCount++
    }

    // Bookings — mix of statuses and sources across past/upcoming
    const firstResource = createdResources[0]?.resource
    if (!firstResource) continue

    const isHotel = biz.type === 'HOTEL'
    const c = (i: number) => customers[(bizIdx + i) % customers.length]

    type BookingPlan = { startAt: Date; endAt: Date; status: BookingStatus; customerId: string; source?: string; guestName?: string; guestPhone?: string; notes?: string }
    const plan: BookingPlan[] = [
      // Past — completed (eligible for reviews) + one no-show + one cancelled
      { startAt: slotAt(daysFromNow(-14), 11), endAt: slotAt(daysFromNow(-14), 12), status: 'COMPLETED', customerId: c(0).id },
      { startAt: slotAt(daysFromNow(-10), 14), endAt: slotAt(daysFromNow(-10), 15), status: 'COMPLETED', customerId: c(1).id },
      { startAt: slotAt(daysFromNow(-7), 10), endAt: slotAt(daysFromNow(-7), 11), status: 'COMPLETED', customerId: c(0).id },
      { startAt: slotAt(daysFromNow(-5), 16), endAt: slotAt(daysFromNow(-5), 17), status: 'NO_SHOW', customerId: c(2).id },
      { startAt: slotAt(daysFromNow(-4), 9), endAt: slotAt(daysFromNow(-4), 10), status: 'CANCELLED', customerId: c(3).id },
      // A manual walk-in and an owner-blocked slot, entered by the business itself
      { startAt: slotAt(daysFromNow(-2), 13), endAt: slotAt(daysFromNow(-2), 14), status: 'COMPLETED', customerId: owner.id, source: 'MANUAL', guestName: 'Клиент без аккаунта', guestPhone: '+996700000777' },
      { startAt: slotAt(daysFromNow(3), 8), endAt: slotAt(daysFromNow(3), 9), status: 'CONFIRMED', customerId: owner.id, source: 'BLOCK', notes: 'Тех. перерыв' },
      // Upcoming — pending + confirmed
      { startAt: slotAt(daysFromNow(1), 10), endAt: slotAt(daysFromNow(1), 11), status: 'PENDING', customerId: c(0).id, notes: 'Пожалуйста, подтвердите' },
      { startAt: slotAt(daysFromNow(2), 15), endAt: slotAt(daysFromNow(2), 16), status: 'CONFIRMED', customerId: c(1).id },
      { startAt: slotAt(daysFromNow(4), 12), endAt: slotAt(daysFromNow(4), 13), status: 'PENDING', customerId: c(2).id },
      { startAt: slotAt(daysFromNow(7), 11), endAt: slotAt(daysFromNow(7), 12), status: 'CONFIRMED', customerId: c(3).id },
    ]

    const adjusted = isHotel ? plan.map(b => {
      const start = new Date(b.startAt); start.setHours(14, 0, 0, 0)
      const end = new Date(start); end.setDate(end.getDate() + 1); end.setHours(12, 0, 0, 0)
      return { ...b, startAt: start, endAt: end }
    }) : plan

    const createdBookings = []
    for (const b of adjusted) {
      const booking = await prisma.booking.create({
        data: {
          startAt: b.startAt, endAt: b.endAt, status: b.status, customerId: b.customerId,
          source: b.source ?? 'ONLINE',
          guestName: b.guestName, guestPhone: b.guestPhone, notes: b.notes,
          resourceId: firstResource.id,
          businessId: created.id,
          guestCount: biz.type === 'RESTAURANT' ? Math.floor(Math.random() * 3) + 2 : 1,
        },
      })
      createdBookings.push(booking)
      bookingCount++
    }

    // Reviews for completed bookings made by real customers (not the owner placeholder)
    const completed = createdBookings.filter(b => b.status === 'COMPLETED' && b.customerId !== owner.id)
    const texts = REVIEWS[biz.type] ?? REVIEWS['CUSTOM']

    for (let i = 0; i < completed.length; i++) {
      const booking = completed[i]
      const rating = Math.random() > 0.2 ? 5 : 4
      try {
        await prisma.review.create({
          data: {
            rating,
            comment: texts[i % texts.length],
            reply: i % 2 === 0 ? OWNER_REPLIES[i % OWNER_REPLIES.length] : undefined,
            customerId: booking.customerId,
            businessId: created.id,
            bookingId: booking.id,
          },
        })
        reviewCount++
      } catch {
        // unique (customerId, businessId)? no such constraint — but bookingId is unique 1:1, safe to ignore rare dupes
      }
    }
  }

  const [userCount] = await Promise.all([prisma.user.count()])

  console.log('\n✅ Seed complete!')
  console.log(`   Города:      Бишкек, Алматы, Ташкент`)
  console.log(`   Бизнесы:     ${bizCount}`)
  console.log(`   Ресурсы:     ${resCount}`)
  console.log(`   Услуги:      ${svcCount}`)
  console.log(`   Брони:       ${bookingCount}`)
  console.log(`   Отзывы:      ${reviewCount}`)
  console.log(`   Пользователи: ${userCount}`)
  console.log('\nВладельцы и клиенты входят по номеру телефона через /auth (SMS/Telegram-код).')
}

main().catch(console.error).finally(() => prisma.$disconnect())
