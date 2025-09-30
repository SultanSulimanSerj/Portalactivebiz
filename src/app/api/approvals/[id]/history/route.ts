import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'

// GET /api/approvals/[id]/history - Получить историю изменений согласования
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const history = await prisma.approvalHistory.findMany({
      where: {
        approvalId: params.id
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Error fetching approval history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
