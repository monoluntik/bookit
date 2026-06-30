export const CONTENT_LOCALES = ['en', 'kg', 'uz', 'kk'] as const
export type ContentLocale = (typeof CONTENT_LOCALES)[number]

const DEFAULT_LOCALE = 'ru'

/** Original content (Russian) needs no translation lookup. */
export function resolveContentLocale(raw: unknown): ContentLocale | typeof DEFAULT_LOCALE {
  return typeof raw === 'string' && (CONTENT_LOCALES as readonly string[]).includes(raw)
    ? (raw as ContentLocale)
    : DEFAULT_LOCALE
}

interface Translatable {
  name: string
  description: string | null
}

interface TranslationRow {
  name: string | null
  description: string | null
}

/** Overlays a single translation row (if present) onto the original entity, falling back per-field. */
export function withTranslation<T extends Translatable>(entity: T, translation: TranslationRow | undefined): T {
  if (!translation) return entity
  return {
    ...entity,
    name: translation.name ?? entity.name,
    description: translation.description ?? entity.description,
  }
}
