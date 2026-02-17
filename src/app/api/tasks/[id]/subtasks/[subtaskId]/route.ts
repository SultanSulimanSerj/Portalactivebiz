import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; subtaskId: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, isCompleted, orderIndex } = body

    // Проверяем, что подзадача существует и принадлежит задаче
    const subtask = await prisma.taskSubtask.findFirst({
      where: {
        id: params.subtaskId,
        taskId: params.id
      }
    })

    if (!subtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 })
    }

    const updated = await prisma.taskSubtask.update({
      where: { id: params.subtaskId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(isCompleted !== undefined && { isCompleted }),
        ...(orderIndex !== undefined && { orderIndex })
      }
    })

    return NextResponse.json({ subtask: updated })
  } catch (error) {
    console.error('Error updating subtask:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; subtaskId: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем, что подзадача существует и принадлежит задаче
    const subtask = await prisma.taskSubtask.findFirst({
      where: {
        id: params.subtaskId,
        taskId: params.id
      }
    })

    if (!subtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 })
    }

    await prisma.taskSubtask.delete({
      where: { id: params.subtaskId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subtask:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
