'use client'

import { SessionProvider } from 'next-auth/react'
import { PermissionsProvider } from '@/components/permission-guard'
import { SocketProvider } from '@/contexts/SocketContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SocketProvider>
        <PermissionsProvider>
          {children}
        </PermissionsProvider>
      </SocketProvider>
    </SessionProvider>
  )
}
