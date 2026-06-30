import { defineRouting } from 'next-intl/routing'

export const locales = ['ru', 'en', 'kg', 'uz', 'kk'] as const
export type Locale = (typeof locales)[number]

export const LOCALE_LABELS: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
  kg: 'Кыргызча',
  uz: "O'zbekcha",
  kk: 'Қазақша',
}

export const routing = defineRouting({
  locales,
  defaultLocale: 'ru',
  localePrefix: 'always',
})
