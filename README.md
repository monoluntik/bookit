# Bronly — Универсальная SaaS-платформа бронирования

Монорепо с бэкендом (Fastify + PostgreSQL) и фронтендом (Next.js 16).  
Работает как маркетплейс (клиент ищет заведение) и как white-label инструмент (бизнес встраивает на сайт).

---

## Содержание

- [Стек технологий](#стек-технологий)
- [Архитектура](#архитектура)
- [Типы бизнесов](#типы-бизнесов)
- [Функциональность](#функциональность)
- [API эндпоинты](#api-эндпоинты)
- [Установка и запуск](#установка-и-запуск)
- [Переменные окружения](#переменные-окружения)
- [Деплой](#деплой)

---

## Стек технологий

| Слой | Технология |
|------|-----------|
| Бэкенд | Node.js, TypeScript, **Fastify v4** |
| ORM | **Prisma v5**, PostgreSQL |
| Аутентификация | **@fastify/jwt** (JWT, 7-дневный срок, auto-refresh) |
| Валидация | **Zod** |
| Фронтенд | **Next.js 16** App Router, React |
| Стили | **Tailwind CSS v4** |
| Email | **Resend SDK** (graceful fallback без API-ключа) |
| Платежи | **Bakai Open Banking PayLink** (dev-моккинг) |
| Монорепо | **pnpm workspaces** |

---

## Архитектура

```
booking_system/
├── apps/
│   ├── api/          # Fastify REST API
│   │   ├── src/
│   │   │   ├── routes/      # auth, businesses, bookings, resources,
│   │   │   │                # services, staff, stats, payment
│   │   │   ├── lib/         # prisma, email, bakai
│   │   │   └── plugins/     # authenticate decorator
│   │   └── prisma/
│   │       └── schema.prisma
│   └── web/          # Next.js фронтенд
│       └── src/
│           ├── app/         # страницы (App Router)
│           ├── components/  # UI компоненты
│           ├── context/     # AuthContext
│           └── lib/         # api.ts (HTTP клиент), businessTypes.ts
└── packages/         # shared types (будущее)
```

**Мультитенантность:** каждый `Business` — это тенант. Все `Resource`, `Booking`, `Service`, `StaffMember` привязаны к `businessId`.

---

## Типы бизнесов

| Тип | Иконка | Особенности бронирования |
|-----|--------|--------------------------|
| `HOTEL` | 🏨 | Выбор номера → диапазон дат → гости → форма |
| `RESTAURANT` | 🍽️ | Дата → слот → количество гостей → форма |
| `SALON` | 💇 | Услуга → мастер → дата → слот → форма |
| `MEDICAL` | 🏥 | Врач → услуга → дата → слот → форма |
| `COWORKING` | 💼 | Ресурс → дата → слот → форма |
| `SPORT` | ⚽ | Ресурс → дата → слот → форма |
| `CUSTOM` | 🏢 | Ресурс → дата → слот → форма |

Каждый тип имеет адаптивный booking flow с разными шагами через `BookingFlowAdaptive.tsx`.

---

## Функциональность

### Для клиентов (покупателей)

- **Маркетплейс** — поиск заведений по названию, адресу, типу бизнеса; пагинация; дебаунс поиска
- **Страница заведения** — описание, расписание мастеров/номеров, список услуг
- **Бронирование** — адаптивный мастер под тип бизнеса; inline-авторизация если не залогинен
- **Оплата** — через Bakai PayLink (в dev-режиме — мок с кнопками Успех/Отказ)
- **Профиль** — история бронирований, отмена брони, изменение имени/телефона/пароля
- **Email-уведомления** — подтверждение и отмена бронирования

### Для владельцев бизнеса

- **Дашборд** — статистика за день/месяц, доход, ближайшие бронирования
- **Управление бронями** — таблица с фильтрами по статусу и дате, смена статуса
- **Ресурсы** — CRUD номеров/мастеров/столиков, настройка расписания с слотами
- **Услуги** — CRUD услуг с ценой и продолжительностью
- **Персонал** — добавление сотрудников по email, назначение должностей
- **Настройки** — создание новых бизнесов, ссылка на страницу бронирования

### Безопасность

- JWT с истечением 7 дней, авто-логаут при 401
- Rate limiting: 20 рег/мин, 10 логинов/мин на IP
- Проверка владения ресурсами во всех защищённых маршрутах
- Цена берётся из БД — клиент не может передать свою сумму
- txId платежа сверяется с сохранённым — нельзя подделать callback
- Бронировать прошедшие даты нельзя

---

## API эндпоинты

> `[AUTH]` — требует `Authorization: Bearer <token>`

### Auth — `/api/auth`

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/register` | Регистрация (email, password, name, phone?) |
| POST | `/login` | Логин → {user, token} |
| GET | `/me` | `[AUTH]` Профиль текущего пользователя |
| PATCH | `/me` | `[AUTH]` Обновление имени, телефона, пароля |

### Businesses — `/api/businesses`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Список активных бизнесов (query, type, page, limit) |
| GET | `/my` | `[AUTH]` Мои бизнесы |
| GET | `/:slug` | Публичная страница бизнеса |
| POST | `/` | `[AUTH]` Создать бизнес |
| PATCH | `/:id` | `[AUTH]` Обновить (только владелец) |

### Resources — `/api/resources`

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/` | `[AUTH]` Создать ресурс |
| POST | `/:id/schedules` | `[AUTH]` Добавить расписание |
| GET | `/:id/slots?date=YYYY-MM-DD` | Доступные слоты (duration?) |

### Services — `/api/services`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/business/:businessId` | Публичный список услуг |
| POST | `/` | `[AUTH]` Создать услугу |
| PATCH | `/:id` | `[AUTH]` Обновить |
| DELETE | `/:id` | `[AUTH]` Удалить |

### Bookings — `/api/bookings`

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/` | `[AUTH]` Создать бронь |
| GET | `/my` | `[AUTH]` Мои брони |
| GET | `/:id` | `[AUTH]` Деталь (клиент или владелец) |
| PATCH | `/:id/status` | `[AUTH]` Смена статуса |
| GET | `/business/:businessId` | `[AUTH]` Брони бизнеса (только владелец) |

### Payments — `/api/payments`

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/initiate` | `[AUTH]` Инициировать PayLink |
| GET | `/result` | Callback от Bakai (redirect) |
| GET | `/status/:bookingId` | `[AUTH]` Статус платежа |

### Staff — `/api/staff`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/business/:businessId` | `[AUTH]` Список персонала |
| POST | `/` | `[AUTH]` Добавить по email |
| PATCH | `/:id` | `[AUTH]` Обновить должность |
| DELETE | `/:id` | `[AUTH]` Удалить |

### Stats — `/api/stats`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/business/:businessId` | `[AUTH]` today/month/total/pending/revenueMonth/upcomingBookings |

---

## Установка и запуск

### Требования

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+

### Шаги

```bash
# 1. Клонировать и установить зависимости
git clone <repo>
cd booking_system
pnpm install

# 2. Настроить env
cp apps/api/.env.example apps/api/.env
# Заполнить DATABASE_URL, JWT_SECRET, FRONTEND_URL

cp apps/web/.env.example apps/web/.env.local
# Заполнить NEXT_PUBLIC_API_URL

# 3. Применить миграции БД
cd apps/api
pnpm db:migrate     # Применить миграции
pnpm db:generate    # Сгенерировать Prisma Client

# 4. Запуск в dev-режиме (оба приложения параллельно)
cd ../..
pnpm dev
```

После запуска:
- API: http://localhost:4000
- Web: http://localhost:3000
- Prisma Studio: `cd apps/api && pnpm db:studio` → http://localhost:5555

---

## Переменные окружения

### `apps/api/.env`

| Переменная | Обязательная | Описание |
|-----------|-------------|----------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ prod | Секрет для подписи JWT (мин. 32 символа) |
| `FRONTEND_URL` | ✅ prod | URL фронтенда (CORS whitelist) |
| `PORT` | ❌ | Порт API (по умолчанию 4000) |
| `RESEND_API_KEY` | ❌ | API ключ Resend для email. Без него email пишутся только в лог |
| `BAKAI_USERNAME` | ❌ | Логин Bakai Open Banking. Без него — dev-мок платежей |
| `BAKAI_PASSWORD` | ❌ | Пароль Bakai |
| `BAKAI_MERCHANT_ID` | ❌ | ID мерчанта |
| `BAKAI_API_URL` | ❌ | URL Bakai API |

### `apps/web/.env.local`

| Переменная | Описание |
|-----------|----------|
| `NEXT_PUBLIC_API_URL` | URL бэкенда (доступен в браузере) |

---

## Деплой

### Рекомендуемый стек

- **API**: Railway / Render / VPS (pm2 + node)
- **Web**: Vercel / Netlify
- **БД**: Railway PostgreSQL / Supabase / Neon

### Продакшн-чеклист

- [ ] `NODE_ENV=production` в обоих сервисах
- [ ] `JWT_SECRET` — случайная строка 64 символа (`openssl rand -hex 64`)
- [ ] `FRONTEND_URL` — реальный домен фронтенда
- [ ] `DATABASE_URL` — продакшн БД (SSL)
- [ ] `RESEND_API_KEY` — API ключ для email
- [ ] Настроить Bakai credentials для приёма платежей
- [ ] Запустить `pnpm db:migrate` на продакшн БД
- [ ] HTTPS на обоих доменах

---

## Структура БД (ключевые модели)

```
User ──────────────────────── owns ──► Business
                                          │
                              has ──────► Resource
                                          │
                              has ──────► Schedule (дни, время, длина слота)
                                          │
                              has ──────► ScheduleException (закрыт, изменённое время)

User ──── creates ──────────────────────► Booking ◄── uses ── Resource
                                          │                    Service
                                          │
                                          └──── has ──────────► Payment

Business ──── has ──────────────────────► Service
Business ──── has ──────────────────────► StaffMember ◄── is ── User
```

---

## Тесты

80 API тест-кейсов покрывают весь флоу:

```bash
# Запустить тесты (API должен быть запущен)
bash tests/run_tests.sh
```

Покрытие: Auth, Business CRUD, Services, Resources + слоты, Bookings (конфликты, прошлое, guestCount, авторизация), Staff, Stats, Payment (txId, server-side price), Rate limiting, 404 pages.
