import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 База данных готова к работе!')
  console.log('✅ Системные шаблоны документов встроены в приложение')
  console.log('📄 Доступные шаблоны:')
  console.log('   - Договор подряда (строительно-монтажные работы)')
  console.log('   - [Дополнительные шаблоны будут добавлены]')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
