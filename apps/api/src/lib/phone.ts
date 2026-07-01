import { parsePhoneNumberFromString } from 'libphonenumber-js'

export function normalizePhone(input: string): string | null {
  const parsed = parsePhoneNumberFromString(input, 'KG')
  if (!parsed || !parsed.isValid()) return null
  return parsed.number
}
