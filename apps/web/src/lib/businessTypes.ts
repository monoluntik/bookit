export const BUSINESS_TYPE_META: Record<string, {
  label: string
  icon: string
  color: string
  resourceLabel: string
  resourceIcon: string
  bookingVerb: string
  features: string[]
}> = {
  HOTEL: {
    label: 'Отель', icon: '🏨', color: 'blue',
    resourceLabel: 'Номер', resourceIcon: '🛏️',
    bookingVerb: 'Забронировать номер',
    features: ['dateRange', 'guestCount'],
  },
  RESTAURANT: {
    label: 'Ресторан', icon: '🍽️', color: 'orange',
    resourceLabel: 'Стол', resourceIcon: '🪑',
    bookingVerb: 'Забронировать стол',
    features: ['guestCount', 'timeSlot'],
  },
  SALON: {
    label: 'Салон красоты', icon: '💇', color: 'pink',
    resourceLabel: 'Мастер', resourceIcon: '✂️',
    bookingVerb: 'Записаться',
    features: ['serviceFirst', 'timeSlot'],
  },
  COWORKING: {
    label: 'Коворкинг', icon: '💼', color: 'purple',
    resourceLabel: 'Рабочее место', resourceIcon: '🖥️',
    bookingVerb: 'Забронировать место',
    features: ['guestCount', 'timeSlot'],
  },
  SPORT: {
    label: 'Спорт', icon: '⚽', color: 'green',
    resourceLabel: 'Корт / Зал', resourceIcon: '🏟️',
    bookingVerb: 'Забронировать',
    features: ['timeSlot'],
  },
  MEDICAL: {
    label: 'Медицина', icon: '🏥', color: 'teal',
    resourceLabel: 'Врач', resourceIcon: '👨‍⚕️',
    bookingVerb: 'Записаться на приём',
    features: ['serviceFirst', 'timeSlot'],
  },
  CUSTOM: {
    label: 'Другое', icon: '🏢', color: 'gray',
    resourceLabel: 'Ресурс', resourceIcon: '📋',
    bookingVerb: 'Забронировать',
    features: ['timeSlot'],
  },
}

export function getMeta(type: string) {
  return BUSINESS_TYPE_META[type] ?? BUSINESS_TYPE_META.CUSTOM
}

export const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Ожидает', CONFIRMED: 'Подтверждена', CANCELLED: 'Отменена',
  COMPLETED: 'Завершена', NO_SHOW: 'Неявка',
}
// Canonical status color mapping — kept in sync with STATUS_COLOR_MAP in
// BookingCard.tsx, STATUS_COLORS in dashboard/bookings/page.tsx, and the
// dashboard Overview/Stats charts: CONFIRMED is blue, COMPLETED is green.
export const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  CANCELLED: 'bg-red-50 text-red-600',
  COMPLETED: 'bg-green-50 text-green-700',
  NO_SHOW: 'bg-gray-100 text-gray-500',
}

// The app's locale codes match BCP-47 except Kyrgyz, whose real code is "ky"
// (the app uses "kg" — the country code — for its routing segment instead).
const INTL_LOCALE: Record<string, string> = { kg: 'ky' }
export function toIntlLocale(locale: string) {
  return INTL_LOCALE[locale] ?? locale
}

export function formatDate(iso: string, locale = 'ru') {
  return new Date(iso).toLocaleDateString(toIntlLocale(locale), { day: 'numeric', month: 'long', year: 'numeric' })
}
export function formatTime(iso: string, locale = 'ru') {
  return new Date(iso).toLocaleTimeString(toIntlLocale(locale), { hour: '2-digit', minute: '2-digit' })
}
export function formatDateTime(iso: string, locale = 'ru') {
  return new Date(iso).toLocaleString(toIntlLocale(locale), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
