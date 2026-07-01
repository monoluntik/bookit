// QA/testing bypass: these numbers always accept TEST_CODE instead of the real
// generated code, so testers don't need to read SMS/Telegram delivery logs.
// Gated behind an explicit opt-in env var — must be deliberately set to 'true',
// never on by default, so it can't silently end up active in production.
export const TEST_CODE = '999999'

export const TEST_PHONE_NUMBERS: string[] = Array.from(
  { length: 20 },
  (_, i) => `+9967000000${String(i + 1).padStart(2, '0')}`,
)

export function isTestPhone(phone: string): boolean {
  return process.env.ALLOW_TEST_PHONES === 'true' && TEST_PHONE_NUMBERS.includes(phone)
}
