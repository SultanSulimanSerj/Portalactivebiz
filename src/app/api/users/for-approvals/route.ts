import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canCreateApprovals')
    
    if (!allowed) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    // Получаем всех пользователей компании для выбора в согласованиях
    const users = await prisma.user.findMany({
      where: {
        companyId: user.companyId
      },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        role: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users for approvals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
