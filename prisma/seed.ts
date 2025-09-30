import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Создаем компанию
  const company = await prisma.company.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      name: 'ООО Строительная компания',
      description: 'Ведущая строительная компания',
      website: 'https://company.com',
      phone: '+7 (495) 123-45-67',
      address: 'Москва, ул. Строительная, д. 1'
    }
  })

  // Создаем пользователей
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      id: '1',
      name: 'Администратор',
      email: 'admin@company.com',
      password: hashedPassword,
      role: 'ADMIN',
      position: 'Директор',
      companyId: company.id
    }
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@company.com' },
    update: {},
    create: {
      id: '2',
      name: 'Менеджер',
      email: 'manager@company.com',
      password: hashedPassword,
      role: 'MANAGER',
      position: 'Менеджер проекта',
      companyId: company.id
    }
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@company.com' },
    update: {},
    create: {
      id: '3',
      name: 'Пользователь',
      email: 'user@company.com',
      password: hashedPassword,
      role: 'USER',
      position: 'Технический специалист',
      companyId: company.id
    }
  })

  // Создаем проекты
  const project1 = await prisma.project.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      name: 'Жилой комплекс "Солнечный"',
      description: 'Строительство жилого комплекса на 200 квартир',
      status: 'ACTIVE',
      priority: 'HIGH',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      budget: 50000000,
      actualCost: 25000000,
      companyId: company.id,
      creatorId: admin.id
    }
  })

  const project2 = await prisma.project.upsert({
    where: { id: '2' },
    update: {},
    create: {
      id: '2',
      name: 'Офисное здание "Бизнес-центр"',
      description: 'Строительство офисного здания',
      status: 'PLANNING',
      priority: 'MEDIUM',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2025-06-01'),
      budget: 30000000,
      companyId: company.id,
      creatorId: manager.id
    }
  })

  // Добавляем пользователей к проектам
  await prisma.projectUser.upsert({
    where: { projectId_userId: { projectId: project1.id, userId: admin.id } },
    update: {},
    create: {
      projectId: project1.id,
      userId: admin.id,
      role: 'OWNER'
    }
  })

  await prisma.projectUser.upsert({
    where: { projectId_userId: { projectId: project1.id, userId: manager.id } },
    update: {},
    create: {
      projectId: project1.id,
      userId: manager.id,
      role: 'MANAGER'
    }
  })

  await prisma.projectUser.upsert({
    where: { projectId_userId: { projectId: project2.id, userId: manager.id } },
    update: {},
    create: {
      projectId: project2.id,
      userId: manager.id,
      role: 'OWNER'
    }
  })

  // Создаем задачи
  await prisma.task.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      title: 'Подготовка фундамента',
      description: 'Земляные работы и заливка фундамента',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      startDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      projectId: project1.id,
      creatorId: admin.id
    }
  })

  await prisma.task.upsert({
    where: { id: '2' },
    update: {},
    create: {
      id: '2',
      title: 'Возведение стен',
      description: 'Кладка стен и перекрытий',
      status: 'TODO',
      priority: 'MEDIUM',
      startDate: new Date('2024-02-16'),
      dueDate: new Date('2024-04-15'),
      projectId: project1.id,
      creatorId: admin.id
    }
  })

  // Создаем финансовые записи
  await prisma.finance.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      type: 'INCOME',
      category: 'Аванс от заказчика',
      description: 'Получен аванс 30% от стоимости проекта',
      amount: 15000000,
      date: new Date('2024-01-01'),
      project: {
        connect: { id: project1.id }
      },
      creator: {
        connect: { id: admin.id }
      }
    }
  })

  await prisma.finance.upsert({
    where: { id: '2' },
    update: {},
    create: {
      id: '2',
      type: 'EXPENSE',
      category: 'Материалы',
      description: 'Закупка бетона и арматуры',
      amount: 5000000,
      date: new Date('2024-01-15'),
      project: {
        connect: { id: project1.id }
      },
      creator: {
        connect: { id: admin.id }
      }
    }
  })

  // Создаем шаблоны документов
  await prisma.documentTemplate.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      name: 'Договор подряда',
      description: 'Шаблон договора подряда на строительные работы',
      content: 'ДОГОВОР ПОДРЯДА №{number} от {date}\n\nЗаказчик: {client_name}\nПодрядчик: {contractor_name}\n\nПредмет договора: {work_description}\nСтоимость работ: {amount} рублей\nСрок выполнения: {deadline}',
      variables: {
        number: 'string',
        date: 'date',
        client_name: 'string',
        contractor_name: 'string',
        work_description: 'text',
        amount: 'number',
        deadline: 'date'
      },
      companyId: company.id
    }
  })

  // Создаем правила нумерации
  await prisma.numberingRule.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      name: 'Договоры',
      pattern: 'ДОГ-{year}-{counter}',
      counter: 0,
      companyId: company.id
    }
  })

  console.log('База данных успешно инициализирована!')
  console.log('Демо аккаунты:')
  console.log('- admin@company.com / admin123')
  console.log('- manager@company.com / admin123')
  console.log('- user@company.com / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })