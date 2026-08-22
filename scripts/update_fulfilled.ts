import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'

config({ path: '.env.local' })
config({ path: '.env' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Updating FULFILLED orders to DELIVERED...')
  
  try {
    const result = await prisma.$executeRaw`UPDATE "Order" SET status = 'DELIVERED' WHERE status = 'FULFILLED'::"OrderStatus"`;
    console.log(`Updated ${result} orders.`);
  } catch (err) {
    console.error("Error executing raw query:", err);
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
