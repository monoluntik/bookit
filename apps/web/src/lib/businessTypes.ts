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
export const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  CONFIRMED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-600',
  COMPLETED: 'bg-blue-50 text-blue-700',
  NO_SHOW: 'bg-gray-100 text-gray-500',
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })
}
export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
}
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
