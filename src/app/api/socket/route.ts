import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { isDebugRouteAllowed } from '@/lib/prod-guard'

export async function GET(req: NextRequest) {
  if (!isDebugRouteAllowed()) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.json({
    message: 'Socket.IO is initialized by server.js on startup',
    path: '/api/socket',
  })
}
