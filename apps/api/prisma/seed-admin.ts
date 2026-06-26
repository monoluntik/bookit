/**
 * Creates or updates a SUPERADMIN user.
 * Run: pnpm tsx prisma/seed-admin.ts
 */
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@booking.local'
  const password = 'Admin1234!'
  const hash = bcrypt.hashSync(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'SUPERADMIN', passwordHash: hash },
    create: {
      email,
      name: 'Super Admin',
      passwordHash: hash,
      role: 'SUPERADMIN',
    },
  })

  console.log('✅ SUPERADMIN created/updated:')
  console.log('   Email:    ', user.email)
  console.log('   Password: ', password)
  console.log('   Role:     ', user.role)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
