export const BusinessTypeValues = ['HOTEL', 'RESTAURANT', 'SALON', 'COWORKING', 'SPORT', 'MEDICAL', 'CUSTOM'] as const
export type BusinessType = (typeof BusinessTypeValues)[number]

export const BookingStatusValues = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'] as const
export type BookingStatus = (typeof BookingStatusValues)[number]
