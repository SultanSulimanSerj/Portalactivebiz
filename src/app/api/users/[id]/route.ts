import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/permissions'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canEditUsers')
    
    if (!allowed) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, role, position, password } = body

    // Проверяем права на изменение роли
    if (role && role !== user.role) {
      if (role === UserRole.OWNER && user.role !== UserRole.OWNER) {
        return NextResponse.json({ error: 'Недостаточно прав для изменения роли на владельца' }, { status: 403 })
      }
      
      // Нельзя изменить роль OWNER
      const targetUser = await prisma.user.findUnique({ where: { id: params.id } })
      if (targetUser?.role === UserRole.OWNER && user.role !== UserRole.OWNER) {
        return NextResponse.json({ error: 'Недостаточно прав для изменения роли владельца' }, { status: 403 })
      }
    }

    // Prepare update data
    const updateData: any = {
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
      ...(position !== undefined && { position })
    }

    // Only update password if provided
    if (password && password.trim() !== '') {
      const bcrypt = require('bcryptjs')
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        position: true,
        createdAt: true,
        _count: {
          select: {
            createdProjects: true,
            createdTasks: true
          }
        }
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canDeleteUsers')
    
    if (!allowed) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    // Don't allow deleting yourself
    if (params.id === user.id) {
      return NextResponse.json({ error: 'Нельзя удалить самого себя' }, { status: 400 })
    }

    // Проверяем, что нельзя удалить владельца
    const targetUser = await prisma.user.findUnique({ where: { id: params.id } })
    if (targetUser?.role === UserRole.OWNER) {
      return NextResponse.json({ error: 'Нельзя удалить владельца компании' }, { status: 403 })
    }

    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
