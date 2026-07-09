/**
 * Grants SUPERADMIN to a phone number, creating the user if it doesn't exist yet.
 * Auth is phone + Telegram/SMS only (no email/password) — this account logs in
 * through the normal /auth flow like any other user, just with an elevated role.
 * Run: pnpm tsx prisma/seed-admin.ts +996700000000
 */
import { PrismaClient } from '@prisma/client'
import { normalizePhone } from '../src/lib/phone'

const prisma = new PrismaClient()

async function main() {
  const raw = process.argv[2]
  if (!raw) {
    console.error('Usage: pnpm tsx prisma/seed-admin.ts <phone>')
    process.exit(1)
  }
  const phone = normalizePhone(raw)
  if (!phone) {
    console.error(`Invalid phone number: ${raw}`)
    process.exit(1)
  }

  const user = await prisma.user.upsert({
    where: { phone },
    update: { role: 'SUPERADMIN' },
    create: { phone, name: 'Super Admin', role: 'SUPERADMIN' },
  })

  console.log('✅ SUPERADMIN ready:')
  console.log('   Phone: ', user.phone)
  console.log('   Role:  ', user.role)
  console.log('   Log in as usual at /auth — Telegram or SMS code, whichever is set up for this number.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
