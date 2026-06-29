/**
 * Full demo seed: wipes all data except protected users, then seeds
 * realistic Bishkek businesses with images, schedules, services, bookings, reviews.
 *
 * Run: pnpm tsx prisma/seed-demo.ts
 */
import { PrismaClient, BusinessType, BookingStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ─── Protected user emails (never deleted) ────────────────────────────────────
const KEEP_EMAILS = ['admin@booking.local', 'narbkv07@gmail.com']

// ─── Unsplash image helpers ───────────────────────────────────────────────────
const U = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`

// ─── Business definitions ─────────────────────────────────────────────────────
const BUSINESSES = [
  // ── HOTEL ───────────────────────────────────────────────────────────────────
  {
    slug: 'hotel-ak-keme',
    name: 'Отель Ак-Кеме',
    type: 'HOTEL' as BusinessType,
    description: 'Пятизвёздочный отель в центре Бишкека. Панорамные виды на горы Ала-Тоо, бассейн, спа, три ресторана.',
    address: 'пр. Манаса 40, Бишкек',
    phone: '+996 312 660 100',
    email: 'info@akkeme.kg',
    logoUrl: U('1566073771259-5f92f595f60b'),
    images: [
      U('1564501049412-61d2d62591c2'),
      U('1520250497591-112533000c31'),
      U('1571896349842-33c89424de2d'),
      U('1578683010236-d371ab37c23d'),
    ],
    resources: [
      {
        name: 'Стандартный номер',
        description: 'Уютный номер 28 м² с видом на город, кинг-кровать, мини-бар',
        capacity: 2,
        price: 4500,
        images: [U('1631049307264-da0ec9d70304')],
        schedule: { days: [0,1,2,3,4,5,6], start: '14:00', end: '12:00', slot: 1440 },
      },
      {
        name: 'Делюкс с видом на горы',
        description: 'Номер 40 м² с панорамным видом на горы, джакузи, кофемашина',
        capacity: 2,
        price: 7200,
        images: [U('1631049307264-da0ec9d70304')],
        schedule: { days: [0,1,2,3,4,5,6], start: '14:00', end: '12:00', slot: 1440 },
      },
      {
        name: 'Люкс семейный',
        description: 'Двухкомнатный люкс 65 м², гостиная, спальня, две ванные',
        capacity: 4,
        price: 12000,
        images: [U('1631049307264-da0ec9d70304')],
        schedule: { days: [0,1,2,3,4,5,6], start: '14:00', end: '12:00', slot: 1440 },
      },
    ],
    services: [],
  },

  // ── RESTAURANT ──────────────────────────────────────────────────────────────
  {
    slug: 'supara-restaurant',
    name: 'Ресторан Супара',
    type: 'RESTAURANT' as BusinessType,
    description: 'Легендарный кыргызский ресторан под открытым небом. Юрты, национальная кухня, живая музыка. Работает сезонно апрель–октябрь.',
    address: 'Чуйское шоссе 24, Бишкек',
    phone: '+996 312 905 050',
    email: 'booking@supara.kg',
    logoUrl: U('1555396273-38ea89aeae0c'),
    images: [
      U('1414235077428-338989a2e8c0'),
      U('1517248135467-4c7edcad34c4'),
      U('1424847651672-bf20a4b0982b'),
      U('1466978913421-dad2ebd01d17'),
    ],
    resources: [
      {
        name: 'Летняя беседка "Манас"',
        description: 'Просторная беседка на 12 гостей с национальной отделкой',
        capacity: 12,
        price: 0,
        images: [U('1517248135467-4c7edcad34c4')],
        schedule: { days: [1,2,3,4,5,6,0], start: '12:00', end: '23:00', slot: 120 },
      },
      {
        name: 'Юрта "Эпос"',
        description: 'Традиционная юрта на 8 человек для особых мероприятий',
        capacity: 8,
        price: 500,
        images: [U('1517248135467-4c7edcad34c4')],
        schedule: { days: [1,2,3,4,5,6,0], start: '12:00', end: '23:00', slot: 120 },
      },
      {
        name: 'Большой зал — стол у фонтана',
        description: 'Романтичный столик на 2–4 гостей с видом на фонтан',
        capacity: 4,
        price: 0,
        images: [U('1414235077428-338989a2e8c0')],
        schedule: { days: [1,2,3,4,5,6,0], start: '12:00', end: '23:00', slot: 120 },
      },
      {
        name: 'Банкетный зал "Ала-Тоо"',
        description: 'VIP-зал для торжеств на 30–50 человек',
        capacity: 50,
        price: 2000,
        images: [U('1414235077428-338989a2e8c0')],
        schedule: { days: [5,6,0], start: '14:00', end: '23:00', slot: 180 },
      },
    ],
    services: [],
  },

  // ── SALON ───────────────────────────────────────────────────────────────────
  {
    slug: 'salon-elegance',
    name: 'Студия красоты Elegance',
    type: 'SALON' as BusinessType,
    description: 'Топ-салон Бишкека. Более 1000 клиентов ежемесячно. Стрижки, окрашивание, уход за ногтями, депиляция. Используем только профессиональную косметику Wella, L\'Oréal.',
    address: 'ул. Токтогула 111, Бишкек',
    phone: '+996 700 222 333',
    email: 'elegance.bishkek@gmail.com',
    logoUrl: U('1560066984-138dadbbc9d5'),
    images: [
      U('1562322140-8bcd3a9e95d0'),
      U('1522337360788-8b13dee7a37e'),
      U('1487412912498-0447578fcca8'),
      U('1634449571010-02389ed0f9b4'),
    ],
    resources: [
      {
        name: 'Мастер Айгерим',
        description: 'Парикмахер-колорист, стаж 8 лет. Специализация: балаяж, омбре, кератин',
        capacity: 1,
        price: 0,
        images: [U('1522337360788-8b13dee7a37e')],
        schedule: { days: [1,2,3,4,5,6], start: '09:00', end: '20:00', slot: 60 },
      },
      {
        name: 'Мастер Зарина',
        description: 'Топ-стилист, международные сертификаты Wella. Стрижки и укладки',
        capacity: 1,
        price: 0,
        images: [U('1487412912498-0447578fcca8')],
        schedule: { days: [1,2,3,4,5,6], start: '10:00', end: '19:00', slot: 60 },
      },
      {
        name: 'Мастер Асель — маникюр',
        description: 'Ногтевой сервис: маникюр, педикюр, наращивание, гель-лак',
        capacity: 1,
        price: 0,
        images: [U('1634449571010-02389ed0f9b4')],
        schedule: { days: [2,3,4,5,6,0], start: '09:00', end: '18:00', slot: 90 },
      },
    ],
    services: [
      { name: 'Женская стрижка', durationMinutes: 60, price: 1200, resourceIdx: 0 },
      { name: 'Мужская стрижка', durationMinutes: 30, price: 700, resourceIdx: 0 },
      { name: 'Балаяж / омбре', durationMinutes: 180, price: 4500, resourceIdx: 0 },
      { name: 'Укладка', durationMinutes: 45, price: 800, resourceIdx: 1 },
      { name: 'Кератиновое выпрямление', durationMinutes: 180, price: 5500, resourceIdx: 1 },
      { name: 'Маникюр гель-лак', durationMinutes: 90, price: 900, resourceIdx: 2 },
      { name: 'Педикюр SPA', durationMinutes: 90, price: 1100, resourceIdx: 2 },
    ],
  },

  // ── MEDICAL ─────────────────────────────────────────────────────────────────
  {
    slug: 'clinic-medstar',
    name: 'Клиника MedStar',
    type: 'MEDICAL' as BusinessType,
    description: 'Многопрофильная частная клиника в Бишкеке. Диагностика, терапия, хирургия. Современное оборудование, европейские стандарты. Более 15 000 пациентов ежегодно.',
    address: 'ул. Ахунбаева 92, Бишкек',
    phone: '+996 312 393 939',
    email: 'appointment@medstar.kg',
    logoUrl: U('1519494026892-bd820a60e54e'),
    images: [
      U('1551190822-a9333d879b1f'),
      U('1579154204601-02d80b2e02c5'),
      U('1532938911079-1346d177d49b'),
      U('1586991359119-a65bb4a2d68f'),
    ],
    resources: [
      {
        name: 'Терапевт Иванова А.В.',
        description: 'Кандидат медицинских наук, 15 лет практики. Первичный приём, диагностика',
        capacity: 1,
        price: 0,
        images: [U('1551190822-a9333d879b1f')],
        schedule: { days: [1,2,3,4,5], start: '08:00', end: '17:00', slot: 30 },
      },
      {
        name: 'Кардиолог Асанов Б.М.',
        description: 'Врач высшей категории, эхокардиография, ЭКГ, холтер',
        capacity: 1,
        price: 0,
        images: [U('1579154204601-02d80b2e02c5')],
        schedule: { days: [1,2,3,4,5], start: '09:00', end: '16:00', slot: 30 },
      },
      {
        name: 'Стоматолог Нурматова Д.К.',
        description: 'Терапевтическая и эстетическая стоматология, имплантация',
        capacity: 1,
        price: 0,
        images: [U('1532938911079-1346d177d49b')],
        schedule: { days: [1,2,3,4,5,6], start: '09:00', end: '18:00', slot: 60 },
      },
    ],
    services: [
      { name: 'Первичный приём терапевта', durationMinutes: 30, price: 800, resourceIdx: 0 },
      { name: 'Повторный приём', durationMinutes: 20, price: 500, resourceIdx: 0 },
      { name: 'Приём кардиолога', durationMinutes: 30, price: 1200, resourceIdx: 1 },
      { name: 'ЭКГ с расшифровкой', durationMinutes: 20, price: 600, resourceIdx: 1 },
      { name: 'Консультация стоматолога', durationMinutes: 30, price: 500, resourceIdx: 2 },
      { name: 'Лечение кариеса (1 зуб)', durationMinutes: 60, price: 3500, resourceIdx: 2 },
      { name: 'Профессиональная чистка', durationMinutes: 60, price: 2500, resourceIdx: 2 },
    ],
  },

  // ── COWORKING ────────────────────────────────────────────────────────────────
  {
    slug: 'cowork-hub-bishkek',
    name: 'Hub Coworking',
    type: 'COWORKING' as BusinessType,
    description: 'Лучший коворкинг Бишкека для фрилансеров, стартапов и команд. 24/7, высокоскоростной интернет, переговорные, кофе и снеки включены.',
    address: 'ул. Логвиненко 55, Бишкек',
    phone: '+996 555 100 200',
    email: 'hello@hubcowork.kg',
    logoUrl: U('1497366216548-37526070297c'),
    images: [
      U('1497366811353-6870744d04b2'),
      U('1524758631624-e2822b8cf57d'),
      U('1541746972996-4e0143b4aa72'),
      U('1568992687947-868a62a9f521'),
    ],
    resources: [
      {
        name: 'Open Space — рабочее место',
        description: 'Фиксированное место в открытом зале, высокоскоростной Wi-Fi до 500 Мбит/с',
        capacity: 1,
        price: 250,
        images: [U('1497366811353-6870744d04b2')],
        schedule: { days: [1,2,3,4,5,6,0], start: '07:00', end: '23:00', slot: 60 },
      },
      {
        name: 'Переговорная "Алатоо"',
        description: 'Переговорная на 6–8 человек, проектор, флипчарт, телевизор',
        capacity: 8,
        price: 800,
        images: [U('1524758631624-e2822b8cf57d')],
        schedule: { days: [1,2,3,4,5], start: '08:00', end: '20:00', slot: 60 },
      },
      {
        name: 'Приватный офис на 4 человека',
        description: 'Закрытый офис со стеклянными стенами, кондиционер, 4 стола',
        capacity: 4,
        price: 1500,
        images: [U('1541746972996-4e0143b4aa72')],
        schedule: { days: [1,2,3,4,5,6,0], start: '07:00', end: '23:00', slot: 240 },
      },
    ],
    services: [],
  },

  // ── SPORT ────────────────────────────────────────────────────────────────────
  {
    slug: 'sport-flex-gym',
    name: 'Flex Fitness Club',
    type: 'SPORT' as BusinessType,
    description: 'Премиум фитнес-клуб в центре Бишкека. Тренажёрный зал, бассейн 25м, сауна, групповые занятия йогой, пилатес, TRX. Опытные тренеры, персональные программы.',
    address: 'пр. Чуй 155, Бишкек',
    phone: '+996 312 450 450',
    email: 'flex@fitclub.kg',
    logoUrl: U('1534438327776-9ead3634e659'),
    images: [
      U('1571019613454-1cb2f99b2d8b'),
      U('1599058918144-5d39b59a3b6d'),
      U('1576678927484-cc907957088c'),
      U('1526506118085-60ce8714f8c5'),
    ],
    resources: [
      {
        name: 'Тренажёрный зал',
        description: 'Оборудование Technogym, кардиозона, свободные веса, зеркальный зал',
        capacity: 30,
        price: 400,
        images: [U('1571019613454-1cb2f99b2d8b')],
        schedule: { days: [1,2,3,4,5,6,0], start: '06:00', end: '23:00', slot: 60 },
      },
      {
        name: 'Бассейн 25м',
        description: 'Олимпийский бассейн 6 дорожек, температура 27°C, детская зона',
        capacity: 12,
        price: 500,
        images: [U('1576678927484-cc907957088c')],
        schedule: { days: [1,2,3,4,5,6,0], start: '07:00', end: '22:00', slot: 60 },
      },
      {
        name: 'Зал групповых занятий',
        description: 'Йога, пилатес, стретчинг, TRX — до 15 участников',
        capacity: 15,
        price: 600,
        images: [U('1526506118085-60ce8714f8c5')],
        schedule: { days: [1,2,3,4,5,6], start: '08:00', end: '21:00', slot: 60 },
      },
    ],
    services: [
      { name: 'Персональная тренировка', durationMinutes: 60, price: 2000, resourceIdx: 0 },
      { name: 'Вводный инструктаж (бесплатно)', durationMinutes: 30, price: 0, resourceIdx: 0 },
      { name: 'Аквааэробика', durationMinutes: 60, price: 700, resourceIdx: 1 },
      { name: 'Йога утренняя', durationMinutes: 60, price: 600, resourceIdx: 2 },
      { name: 'Пилатес', durationMinutes: 60, price: 650, resourceIdx: 2 },
    ],
  },

  // ── SALON 2 ─────────────────────────────────────────────────────────────────
  {
    slug: 'barber-bro',
    name: 'Барбершоп BRO',
    type: 'SALON' as BusinessType,
    description: 'Мужской барбершоп в стиле loft. Стрижки, оформление бород, горячее бритьё опасной бритвой. Виски в подарок каждому клиенту.',
    address: 'ул. Исанова 80, Бишкек',
    phone: '+996 700 800 900',
    email: 'bro.barber@gmail.com',
    logoUrl: U('1503951914875-452162b0f3f1'),
    images: [
      U('1621605815971-b3d6db1fe8f7'),
      U('1599351431613-2d8a08a86c17'),
      U('1548249809-8f2a2b2a3e9b'),
      U('1622296572-99efeb7dbf2d'),
    ],
    resources: [
      {
        name: 'Барбер Алтай',
        description: 'Главный барбер, чемпион кыргызских конкурсов 2022–2023',
        capacity: 1,
        price: 0,
        images: [U('1621605815971-b3d6db1fe8f7')],
        schedule: { days: [1,2,3,4,5,6], start: '10:00', end: '21:00', slot: 45 },
      },
      {
        name: 'Барбер Мирлан',
        description: 'Специалист по фейдам и скинфейдам',
        capacity: 1,
        price: 0,
        images: [U('1599351431613-2d8a08a86c17')],
        schedule: { days: [2,3,4,5,6,0], start: '11:00', end: '20:00', slot: 45 },
      },
    ],
    services: [
      { name: 'Стрижка классика', durationMinutes: 30, price: 800, resourceIdx: 0 },
      { name: 'Стрижка + борода', durationMinutes: 45, price: 1100, resourceIdx: 0 },
      { name: 'Горячее бритьё', durationMinutes: 30, price: 700, resourceIdx: 0 },
      { name: 'Скинфейд', durationMinutes: 45, price: 900, resourceIdx: 1 },
      { name: 'Камуфляж седины', durationMinutes: 30, price: 600, resourceIdx: 1 },
    ],
  },

  // ── RESTAURANT 2 ────────────────────────────────────────────────────────────
  {
    slug: 'cafe-arzu',
    name: 'Кафе Арзу',
    type: 'RESTAURANT' as BusinessType,
    description: 'Уютное кафе кыргызской и восточной кухни. Домашние манты, бешбармак, лагман. Семейная атмосфера, доступные цены, быстрое обслуживание.',
    address: 'ул. Боконбаева 120, Бишкек',
    phone: '+996 312 555 444',
    email: '',
    logoUrl: U('1555396273-38ea89aeae0c'),
    images: [
      U('1555396273-38ea89aeae0c'),
      U('1414235077428-338989a2e8c0'),
      U('1517248135467-4c7edcad34c4'),
    ],
    resources: [
      {
        name: 'Стол на 2',
        description: 'Столик для двоих у окна',
        capacity: 2,
        price: 0,
        images: [],
        schedule: { days: [1,2,3,4,5,6,0], start: '10:00', end: '22:00', slot: 90 },
      },
      {
        name: 'Стол на 4',
        description: 'Стол для небольшой компании',
        capacity: 4,
        price: 0,
        images: [],
        schedule: { days: [1,2,3,4,5,6,0], start: '10:00', end: '22:00', slot: 90 },
      },
      {
        name: 'Банкетный стол на 10',
        description: 'Большой стол для семейных ужинов',
        capacity: 10,
        price: 0,
        images: [],
        schedule: { days: [5,6,0], start: '12:00', end: '22:00', slot: 120 },
      },
    ],
    services: [],
  },
]

// ─── Review texts by business type ───────────────────────────────────────────
const REVIEWS: Record<string, string[]> = {
  HOTEL: [
    'Отличный отель, персонал очень внимателен. Виды на горы — незабываемые. Обязательно вернёмся!',
    'Чисто, уютно, завтрак отличный. Единственный минус — парковка небольшая.',
    'Лучший отель в Бишкеке. Кровать удобная, тихо даже в центре города.',
    'Приехали на деловую встречу — всё организовано на высшем уровне.',
  ],
  RESTAURANT: [
    'Манты просто таяли во рту! Обязательно приедем ещё с семьёй.',
    'Атмосфера юрт — это нечто особенное. Живая музыка, еда вкусная.',
    'Давно ищем ресторан с настоящей кыргызской кухней — нашли!',
    'Бешбармак лучший в городе, без преувеличения. Порции огромные.',
  ],
  SALON: [
    'Айгерим сделала мне потрясающий балаяж! Все подруги спрашивают, где делала.',
    'Быстро, аккуратно, профессионально. Маникюр держится уже три недели.',
    'Лучший барбер в городе — стрижка идеально ровная, борода как по учебнику.',
    'Пришла с фото, получила именно то, что хотела. Записалась ещё раз.',
    'Чистота, комфорт, мастера знают своё дело. Рекомендую всем!',
  ],
  MEDICAL: [
    'Врач очень внимательная, всё объяснила подробно, не торопила.',
    'Современное оборудование, никакой очереди — запись строго по времени.',
    'Сдала анализы, результаты пришли на следующий день. Удобно!',
    'Наконец-то нашла стоматолога, у которого не страшно лечить зубы.',
  ],
  COWORKING: [
    'Лучший коворкинг в Бишкеке. Интернет мощный, кофе вкусный, тихо.',
    'Провёл здесь три недели во время командировки. Всё отлично.',
    'Переговорная удобная, оборудование работает, цена адекватная.',
    'Наконец-то место, где можно нормально поработать без отвлечений.',
  ],
  SPORT: [
    'Оборудование как в Европе. Тренеры знают дело. Бассейн чистый.',
    'Хожу полгода — результат заметен. Атмосфера мотивирующая.',
    'Занятия йогой с утра — лучший старт дня. Тренер Айгуль — супер!',
    'Единственный минус — в час пик бывает очередь на некоторые тренажёры.',
  ],
}

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
  console.log('🧹 Cleaning database (keeping protected users)...')

  // Delete in dependency order
  await prisma.review.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.recurringRule.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.service.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.resource.deleteMany()
  await prisma.cancellationPolicy.deleteMany()
  await prisma.customRole.deleteMany()
  await prisma.staffMember.deleteMany()
  await prisma.business.deleteMany()
  // Delete non-protected users
  await prisma.user.deleteMany({ where: { email: { notIn: KEEP_EMAILS } } })

  console.log('✅ Database cleaned')

  // Ensure seed users exist
  const PASS = bcrypt.hashSync('Demo1234!', 10)
  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@booking.kg' },
    update: {},
    create: { email: 'owner@booking.kg', name: 'Айбек Усупов', passwordHash: PASS, role: 'BUSINESS_OWNER' },
  })
  const customer1 = await prisma.user.upsert({
    where: { email: 'aizat@gmail.com' },
    update: {},
    create: { email: 'aizat@gmail.com', name: 'Айзат Кулова', passwordHash: PASS, role: 'CUSTOMER', phone: '+996 700 111 222' },
  })
  const customer2 = await prisma.user.upsert({
    where: { email: 'ruslan@gmail.com' },
    update: {},
    create: { email: 'ruslan@gmail.com', name: 'Руслан Бейшеев', passwordHash: PASS, role: 'CUSTOMER', phone: '+996 555 333 444' },
  })

  // Also use the admin user as a customer for reviews
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@booking.local' } })
  const ownUser = await prisma.user.findUnique({ where: { email: 'narbkv07@gmail.com' } })
  const reviewers = [customer1, customer2, adminUser, ownUser].filter(Boolean) as typeof customer1[]

  console.log('👤 Users ready')
  console.log('🏢 Seeding businesses...')

  for (const biz of BUSINESSES) {
    const { resources, services, ...bizData } = biz

    const created = await prisma.business.create({
      data: {
        ...bizData,
        ownerId: ownerUser.id,
        subscriptionPlan: 'PRO',
        isActive: true,
      },
    })

    console.log(`  ✓ ${created.name}`)

    // Create resources + schedules
    const createdResources = []
    for (const res of resources) {
      const { schedule, images: resImages, price, ...resData } = res
      const resource = await prisma.resource.create({
        data: {
          ...resData,
          images: resImages,
          businessId: created.id,
          isActive: true,
        },
      })
      createdResources.push({ resource, price })

      await prisma.schedule.create({
        data: {
          resourceId: resource.id,
          dayOfWeek: schedule.days,
          startTime: schedule.start,
          endTime: schedule.end,
          slotDurationMinutes: schedule.slot,
          isActive: true,
        },
      })
    }

    // Create services
    for (const svc of services) {
      const { resourceIdx, ...svcData } = svc
      await prisma.service.create({
        data: {
          ...svcData,
          businessId: created.id,
          resourceId: createdResources[resourceIdx]?.resource.id,
          isActive: true,
        },
      })
    }

    // Create bookings — past confirmed + upcoming pending
    const firstResource = createdResources[0]?.resource
    if (!firstResource) continue

    const bookingData: Array<{
      startAt: Date; endAt: Date; status: BookingStatus; customerId: string; notes?: string
    }> = [
      // Past confirmed bookings
      { startAt: slotAt(daysFromNow(-14), 11), endAt: slotAt(daysFromNow(-14), 12), status: 'CONFIRMED', customerId: customer1.id },
      { startAt: slotAt(daysFromNow(-10), 14), endAt: slotAt(daysFromNow(-10), 15), status: 'CONFIRMED', customerId: customer2.id },
      { startAt: slotAt(daysFromNow(-7), 10), endAt: slotAt(daysFromNow(-7), 11), status: 'COMPLETED', customerId: customer1.id },
      { startAt: slotAt(daysFromNow(-3), 16), endAt: slotAt(daysFromNow(-3), 17), status: 'COMPLETED', customerId: customer2.id },
      // Upcoming bookings
      { startAt: slotAt(daysFromNow(1), 10), endAt: slotAt(daysFromNow(1), 11), status: 'PENDING', customerId: customer1.id, notes: 'Пожалуйста, подтвердите' },
      { startAt: slotAt(daysFromNow(2), 15), endAt: slotAt(daysFromNow(2), 16), status: 'CONFIRMED', customerId: customer2.id },
      { startAt: slotAt(daysFromNow(4), 12), endAt: slotAt(daysFromNow(4), 13), status: 'PENDING', customerId: customer1.id },
      { startAt: slotAt(daysFromNow(7), 11), endAt: slotAt(daysFromNow(7), 12), status: 'CONFIRMED', customerId: customer2.id },
    ]

    // For hotels use 24h slots
    const isHotel = biz.type === 'HOTEL'
    const adjustedBookings = isHotel ? bookingData.map(b => {
      const start = new Date(b.startAt); start.setHours(14, 0, 0, 0)
      const end = new Date(start); end.setDate(end.getDate() + 1); end.setHours(12, 0, 0, 0)
      return { ...b, startAt: start, endAt: end }
    }) : bookingData

    const createdBookings = []
    for (const b of adjustedBookings) {
      const booking = await prisma.booking.create({
        data: {
          ...b,
          resourceId: firstResource.id,
          businessId: created.id,
          guestCount: biz.type === 'RESTAURANT' ? Math.floor(Math.random() * 3) + 2 : 1,
        },
      })
      createdBookings.push(booking)
    }

    // Create reviews for completed bookings
    const completedBookings = createdBookings.filter(b => b.status === 'COMPLETED')
    const reviewTexts = REVIEWS[biz.type] ?? REVIEWS['SALON']

    for (let i = 0; i < completedBookings.length; i++) {
      const booking = completedBookings[i]
      const reviewer = reviewers[i % reviewers.length]
      const rating = Math.random() > 0.2 ? 5 : 4  // 80% пятёрок

      try {
        await prisma.review.create({
          data: {
            rating,
            comment: reviewTexts[i % reviewTexts.length],
            customerId: reviewer.id,
            businessId: created.id,
            bookingId: booking.id,
          },
        })
      } catch {
        // Skip if reviewer already reviewed this business (unique constraint)
      }
    }
  }

  // Stats
  const counts = await Promise.all([
    prisma.business.count(),
    prisma.resource.count(),
    prisma.schedule.count(),
    prisma.service.count(),
    prisma.booking.count(),
    prisma.review.count(),
    prisma.user.count(),
  ])

  console.log('\n✅ Seed complete!')
  console.log(`   Businesses: ${counts[0]}`)
  console.log(`   Resources:  ${counts[1]}`)
  console.log(`   Schedules:  ${counts[2]}`)
  console.log(`   Services:   ${counts[3]}`)
  console.log(`   Bookings:   ${counts[4]}`)
  console.log(`   Reviews:    ${counts[5]}`)
  console.log(`   Users:      ${counts[6]}`)
  console.log('\n🔑 Demo credentials:')
  console.log('   Owner:    owner@booking.kg / Demo1234!')
  console.log('   Customer: aizat@gmail.com / Demo1234!')
  console.log('   Admin:    admin@booking.local / Admin1234!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
