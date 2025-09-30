import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { filename } = params
    
    // В реальном приложении здесь была бы генерация и возврат файла
    // Пока возвращаем заглушку
    const reportContent = `
      ОТЧЕТ ПО ПРОЕКТАМ
      =================
      
      Компания: ${user.companyId}
      Пользователь: ${user.name}
      Дата: ${new Date().toLocaleDateString('ru-RU')}
      
      Данные отчета будут здесь...
    `

    return new NextResponse(reportContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Error downloading report:', error)
    return NextResponse.json(
      { error: 'Failed to download report' },
      { status: 500 }
    )
  }
}
