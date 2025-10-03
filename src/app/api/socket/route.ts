import { NextRequest, NextResponse } from 'next/server'
import { Server as HTTPServer } from 'http'
import { initSocket } from '@/lib/socket'

export async function GET(req: NextRequest) {
  try {
    // В Next.js 14 App Router нужен другой подход для WebSocket
    // Возвращаем информацию о доступности Socket.IO
    return NextResponse.json({ 
      message: 'Socket.IO server will be initialized on server start',
      path: '/api/socket'
    })
  } catch (error) {
    console.error('Socket initialization error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

