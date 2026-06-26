/**
 * Seeds 50 realistic businesses for Kyrgyzstan marketplace demo.
 * Run: npx ts-node prisma/seed-businesses.ts
 */
import { PrismaClient, BusinessType } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const HASH = bcrypt.hashSync('password123', 10)

const BUSINESSES: Array<{
  name: string; type: BusinessType; desc: string; address: string
  resources: Array<{ name: string; desc?: string; duration: number; price: number; serviceName: string }>
}> = [
  // SALON ×15
  { name: 'Студия красоты Sofiya',   type: 'SALON', desc: 'Модные стрижки, окрашивание, уход за волосами', address: 'ул. Токтогула 78, Бишкек',
    resources: [{ name: 'Мастер Айгерим', desc: 'Парикмахер-колорист', duration: 60, price: 900, serviceName: 'Стрижка и укладка' }] },
  { name: 'Beauty Lounge Bishkek',   type: 'SALON', desc: 'Европейский стиль, лучшие мастера города',    address: 'пр. Манаса 20, Бишкек',
    resources: [{ name: 'Мастер Зарина', duration: 45, price: 800, serviceName: 'Женская стрижка' }] },
  { name: 'Барбершоп "Дядя Джон"',  type: 'SALON', desc: 'Мужские стрижки и бритьё по-старому',        address: 'ул. Московская 110, Бишкек',
    resources: [{ name: 'Барбер Алтай', duration: 40, price: 600, serviceName: 'Стрижка + борода' }] },
  { name: 'Nail Art Studio',         type: 'SALON', desc: 'Маникюр, педикюр, гель-лак',                  address: 'ул. Ахунбаева 5, Бишкек',
    resources: [{ name: 'Мастер Асель', duration: 90, price: 700, serviceName: 'Маникюр гель' }] },
  { name: 'Lashes & Brows Bar',      type: 'SALON', desc: 'Наращивание ресниц, коррекция бровей',        address: 'ул. Байтик Баатыра 15, Бишкек',
    resources: [{ name: 'Мастер Нурия', duration: 120, price: 1500, serviceName: 'Наращивание ресниц' }] },
  { name: 'Студия "Гламур"',         type: 'SALON', desc: 'Полный комплекс услуг красоты',               address: 'ул. Горького 32, Ош',
    resources: [{ name: 'Мастер Гульзат', duration: 60, price: 700, serviceName: 'Стрижка' }] },
  { name: 'Top Cut Barber',          type: 'SALON', desc: 'Мужской уход и стайлинг',                     address: 'ул. Ленина 55, Ош',
    resources: [{ name: 'Барбер Таалай', duration: 30, price: 500, serviceName: 'Стрижка' }] },
  { name: 'Cosmetic Lab',            type: 'SALON', desc: 'Аппаратная косметология',                     address: 'пр. Чуй 200, Бишкек',
    resources: [{ name: 'Косметолог Дина', duration: 60, price: 2000, serviceName: 'Чистка лица' }] },
  { name: 'SPA Serenity',            type: 'SALON', desc: 'Массаж, обёртывания, релакс',                  address: 'ул. Орозбекова 1, Бишкек',
    resources: [{ name: 'Массажист Берик', duration: 60, price: 1200, serviceName: 'Классический массаж' }] },
  { name: 'Студия тату "Узор"',      type: 'SALON', desc: 'Тату и перманентный макияж',                   address: 'ул. Юнусалиева 65, Бишкек',
    resources: [{ name: 'Мастер Кайрат', duration: 120, price: 3000, serviceName: 'Тату (до 5 см)' }] },
  { name: 'Balayage Studio KG',      type: 'SALON', desc: 'Специализируемся на балаяже и окрашивании',    address: 'ул. Фрунзе 100, Бишкек',
    resources: [{ name: 'Колорист Мира', duration: 180, price: 3500, serviceName: 'Балаяж полный' }] },
  { name: 'Студия "Silk"',           type: 'SALON', desc: 'Кератин, ламинирование, уход',                 address: 'ул. Исанова 44, Бишкек',
    resources: [{ name: 'Мастер Салтанат', duration: 120, price: 2500, serviceName: 'Кератин' }] },
  { name: 'Brow Design KG',          type: 'SALON', desc: 'Архитектура бровей, перманент',                address: 'ул. Гагарина 77, Бишкек',
    resources: [{ name: 'Мастер Жамиля', duration: 90, price: 1800, serviceName: 'Перм бровей' }] },
  { name: 'Детская парикмахерская',  type: 'SALON', desc: 'Стрижки для детей в игровой обстановке',      address: 'ул. Малдыбаева 12, Бишкек',
    resources: [{ name: 'Мастер Гульнара', duration: 30, price: 400, serviceName: 'Детская стрижка' }] },
  { name: 'Студия загара "Sunlight"',type: 'SALON', desc: 'Горизонтальный и вертикальный солярий',       address: 'ул. Ибраимова 3, Бишкек',
    resources: [{ name: 'Кабина Premium', duration: 10, price: 100, serviceName: 'Загар 10 мин' }] },

  // MEDICAL ×10
  { name: 'Клиника "Здоровье"',      type: 'MEDICAL', desc: 'Терапия, педиатрия, диагностика',          address: 'ул. Боконбаева 24, Бишкек',
    resources: [{ name: 'Терапевт Асанов А.', duration: 30, price: 800, serviceName: 'Приём терапевта' }] },
  { name: 'Стоматология Smile Plus', type: 'MEDICAL', desc: 'Лечение, протезирование, отбеливание',     address: 'ул. Шопокова 15, Бишкек',
    resources: [{ name: 'Стоматолог Кенже', duration: 60, price: 1500, serviceName: 'Лечение кариеса' }] },
  { name: 'Офтальмология "Свет"',    type: 'MEDICAL', desc: 'Диагностика зрения, лечение глаз',         address: 'пр. Жибек Жолу 50, Бишкек',
    resources: [{ name: 'Офтальмолог Бейшекеев', duration: 30, price: 700, serviceName: 'Проверка зрения' }] },
  { name: 'Детская клиника "Малыш"', type: 'MEDICAL', desc: 'Педиатрия, вакцинация, развитие',          address: 'ул. Токтоналиева 8, Бишкек',
    resources: [{ name: 'Педиатр Нурова', duration: 30, price: 900, serviceName: 'Осмотр ребёнка' }] },
  { name: 'Психологический центр',   type: 'MEDICAL', desc: 'Индивидуальные и семейные консультации',   address: 'ул. Алма-Атинская 90, Бишкек',
    resources: [{ name: 'Психолог Сыдыкова', duration: 60, price: 2000, serviceName: 'Сессия' }] },
  { name: 'УЗИ Диагностика',         type: 'MEDICAL', desc: 'Все виды ультразвуковой диагностики',      address: 'ул. Джантошева 2, Бишкек',
    resources: [{ name: 'УЗИ-специалист Омуров', duration: 20, price: 600, serviceName: 'УЗИ органов' }] },
  { name: 'Лаборатория "BioLab"',    type: 'MEDICAL', desc: 'Анализы крови, мочи, ПЦР тесты',           address: 'ул. Советская 88, Бишкек',
    resources: [{ name: 'Кабинет забора', duration: 10, price: 200, serviceName: 'Забор крови' }] },
  { name: 'Кардиология "Пульс"',     type: 'MEDICAL', desc: 'ЭКГ, консультации кардиолога',             address: 'ул. Тыналиева 19, Бишкек',
    resources: [{ name: 'Кардиолог Алиев', duration: 40, price: 1200, serviceName: 'Консультация' }] },
  { name: 'Физиотерапия "Движение"', type: 'MEDICAL', desc: 'Реабилитация, массаж, физиопроцедуры',    address: 'ул. Логвиненко 4, Бишкек',
    resources: [{ name: 'Физиотерапевт Токторов', duration: 45, price: 800, serviceName: 'Процедура' }] },
  { name: 'Ортопедия "Позвоночник"', type: 'MEDICAL', desc: 'Лечение спины, суставов, хирургия',       address: 'ул. Панфилова 33, Ош',
    resources: [{ name: 'Ортопед Жакыпов', duration: 30, price: 1000, serviceName: 'Приём' }] },

  // COWORKING ×7
  { name: 'Hub Central Bishkek',     type: 'COWORKING', desc: 'Коворкинг в центре, скоростной WiFi',   address: 'ул. Токтогула 150, Бишкек',
    resources: [{ name: 'Рабочее место А-1', duration: 60, price: 150, serviceName: 'Час в коворкинге' }] },
  { name: 'Startup Space KG',        type: 'COWORKING', desc: 'Для IT-стартапов и фрилансеров',        address: 'пр. Манаса 45, Бишкек',
    resources: [{ name: 'Переговорная "Синяя"', duration: 60, price: 500, serviceName: 'Переговорная час' }] },
  { name: 'Creative Hub',            type: 'COWORKING', desc: 'Открытое пространство для творчества',  address: 'ул. Исанова 12, Бишкек',
    resources: [{ name: 'Студия 1', duration: 60, price: 300, serviceName: 'Час' }] },
  { name: 'TechSpace Bishkek',       type: 'COWORKING', desc: 'Технологический коворкинг 24/7',        address: 'ул. Гоголя 40, Бишкек',
    resources: [{ name: 'Dedicated desk 5', duration: 480, price: 1000, serviceName: 'День' }] },
  { name: 'Nomad Office',            type: 'COWORKING', desc: 'Для цифровых номадов, хорошая связь',   address: 'ул. Льва Толстого 8, Бишкек',
    resources: [{ name: 'Место у окна', duration: 60, price: 200, serviceName: 'Час' }] },
  { name: 'BizCenter Plus',          type: 'COWORKING', desc: 'Бизнес-центр с конференц-залами',       address: 'ул. Шевченко 90, Бишкек',
    resources: [{ name: 'Конференц-зал', duration: 60, price: 1500, serviceName: 'Час' }] },
  { name: 'Co.Work Osh',             type: 'COWORKING', desc: 'Первый коворкинг в Оше',                address: 'ул. Курманжан Датки 22, Ош',
    resources: [{ name: 'Стол у стены', duration: 60, price: 100, serviceName: 'Час' }] },

  // SPORT ×8
  { name: 'Фитнес-клуб "Олимп"',    type: 'SPORT', desc: 'Тренажёры, групповые занятия, бассейн',    address: 'ул. Анкара 3, Бишкек',
    resources: [{ name: 'Персональный тренер Максат', duration: 60, price: 1200, serviceName: 'Персональная тренировка' }] },
  { name: 'Yoga Studio Harmony',     type: 'SPORT', desc: 'Хатха, аштанга, медитация',                address: 'ул. Раимбека 56, Бишкек',
    resources: [{ name: 'Инструктор Зухра', duration: 60, price: 600, serviceName: 'Класс йоги' }] },
  { name: 'Бокс Академия Манаса',    type: 'SPORT', desc: 'Любительский и профессиональный бокс',    address: 'ул. Уметалиева 33, Бишкек',
    resources: [{ name: 'Тренер Алибек', duration: 60, price: 800, serviceName: 'Тренировка' }] },
  { name: 'Бассейн "Акватика"',      type: 'SPORT', desc: 'Дорожки, обучение плаванию',               address: 'ул. Асаналиева 7, Бишкек',
    resources: [{ name: 'Дорожка 2', duration: 60, price: 400, serviceName: 'Дорожка 1 час' }] },
  { name: 'CrossFit Box Bishkek',    type: 'SPORT', desc: 'Функциональный фитнес, WOD каждый день',  address: 'ул. Шабдан Баатыра 11, Бишкек',
    resources: [{ name: 'Зона CrossFit', duration: 60, price: 500, serviceName: 'Класс' }] },
  { name: 'Теннисный клуб "Ace"',   type: 'SPORT', desc: 'Корты, тренеры, прокат ракеток',           address: 'ул. Ботаническая 3, Бишкек',
    resources: [{ name: 'Корт №1', duration: 60, price: 700, serviceName: 'Аренда корта' }] },
  { name: 'Академия танца "Ритм"',   type: 'SPORT', desc: 'Бальные, стрит-дэнс, детские',            address: 'ул. Горького 10, Бишкек',
    resources: [{ name: 'Инструктор Айдана', duration: 60, price: 500, serviceName: 'Индивидуальный урок' }] },
  { name: 'MMA Gym Fighter',         type: 'SPORT', desc: 'Смешанные единоборства, борьба',           address: 'ул. Советская 102, Ош',
    resources: [{ name: 'Тренер Мурат', duration: 90, price: 700, serviceName: 'Тренировка' }] },

  // HOTEL ×5
  { name: 'Гостиница "Алатоо"',      type: 'HOTEL', desc: 'Уютные номера в центре Бишкека',          address: 'ул. Киевская 5, Бишкек',
    resources: [{ name: 'Стандартный номер', duration: 1440, price: 3500, serviceName: 'Ночь' }] },
  { name: 'Hotel Silk Road',         type: 'HOTEL', desc: 'Бутик-отель на Великом шёлковом пути',    address: 'ул. Токтогула 85, Бишкек',
    resources: [{ name: 'Делюкс номер', duration: 1440, price: 5000, serviceName: 'Ночь' }] },
  { name: 'Hostel "Nomad Inn"',      type: 'HOTEL', desc: 'Бюджетное жильё для путешественников',   address: 'ул. Жибек Жолу 11, Бишкек',
    resources: [{ name: 'Кровать в дортуаре', duration: 1440, price: 800, serviceName: 'Ночь' }] },
  { name: 'Sanatorium Issyk-Kul',    type: 'HOTEL', desc: 'Оздоровление на берегу Иссык-Куля',      address: 'пос. Чолпон-Ата, Иссык-Куль',
    resources: [{ name: 'Номер "Стандарт"', duration: 1440, price: 4000, serviceName: 'Ночь с питанием' }] },
  { name: 'Apartment Dreams',        type: 'HOTEL', desc: 'Апартаменты посуточно в центре',          address: 'ул. Московская 168, Бишкек',
    resources: [{ name: 'Квартира-студия', duration: 1440, price: 2500, serviceName: 'Сутки' }] },

  // RESTAURANT ×5
  { name: 'Ресторан "Манас"',        type: 'RESTAURANT', desc: 'Кыргызская национальная кухня',      address: 'ул. Ахунбаева 99, Бишкек',
    resources: [{ name: 'VIP-зал (8 чел.)', duration: 120, price: 2000, serviceName: 'Бронь стола 2ч' }] },
  { name: 'Craft Beer House',        type: 'RESTAURANT', desc: 'Крафтовое пиво и бургеры',           address: 'ул. Фрунзе 344, Бишкек',
    resources: [{ name: 'Терраса (4 чел.)', duration: 90, price: 0, serviceName: 'Бронь места' }] },
  { name: 'Суши-бар "Fuji"',         type: 'RESTAURANT', desc: 'Японская кухня, роллы, сашими',      address: 'пр. Чуй 117, Бишкек',
    resources: [{ name: 'Стол на 2 (у окна)', duration: 90, price: 0, serviceName: 'Бронь' }] },
  { name: 'Кофейня "Ararat"',        type: 'RESTAURANT', desc: 'Specialty кофе и выпечка',           address: 'ул. Киевская 66, Бишкек',
    resources: [{ name: 'Диванная зона', duration: 60, price: 0, serviceName: 'Место за столом' }] },
  { name: 'Pizza Street',            type: 'RESTAURANT', desc: 'Итальянская пицца и паста',          address: 'ул. Байтик Баатыра 44, Бишкек',
    resources: [{ name: 'Стол на 6', duration: 90, price: 0, serviceName: 'Бронь' }] },
]

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/["'«»"]/g, '')
    .replace(/[а-яёА-ЯЁ]/g, (c) => {
      const map: Record<string,string> = {
        а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',
        к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
        х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sh',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
      }
      return map[c.toLowerCase()] ?? ''
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

async function main() {
  // Create a shared demo owner for all seeded businesses
  const ownerEmail = 'demo-owner@booking.kg'
  let owner = await prisma.user.findUnique({ where: { email: ownerEmail } })
  if (!owner) {
    owner = await prisma.user.create({
      data: {
        email: ownerEmail,
        passwordHash: HASH,
        name: 'Demo Owner',
        role: 'BUSINESS_OWNER',
      },
    })
    console.log('Created demo owner:', owner.id)
  }

  let created = 0
  let skipped = 0

  for (const biz of BUSINESSES) {
    let slug = toSlug(biz.name)
    // Ensure unique slug
    const existing = await prisma.business.findUnique({ where: { slug } })
    if (existing) { skipped++; console.log(`  [skip] ${biz.name} (slug exists)`); continue }

    const business = await prisma.business.create({
      data: {
        slug,
        name:        biz.name,
        description: biz.desc,
        type:        biz.type,
        address:     biz.address,
        ownerId:     owner.id,
      },
    })

    for (const r of biz.resources) {
      const resource = await prisma.resource.create({
        data: {
          businessId:  business.id,
          name:        r.name,
          description: r.desc,
          capacity:    1,
        },
      })

      // Add Mon–Sat schedule
      const schedule = await prisma.schedule.create({
        data: {
          resourceId:          resource.id,
          dayOfWeek:           [1,2,3,4,5,6],
          startTime:           '09:00',
          endTime:             '19:00',
          slotDurationMinutes: Math.max(30, r.duration),
        },
      })

      // Add service
      await prisma.service.create({
        data: {
          businessId:     business.id,
          resourceId:     resource.id,
          name:           r.serviceName,
          durationMinutes: r.duration,
          price:          r.price,
        },
      })
    }

    created++
    console.log(`  [OK] ${biz.name} → ${slug}`)
  }

  console.log(`\n✓ Created ${created} businesses, skipped ${skipped}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
