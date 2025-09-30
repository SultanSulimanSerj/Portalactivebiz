'use client'

import { SessionProvider } from 'next-auth/react'
import { PermissionsProvider } from '@/components/permission-guard'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PermissionsProvider>
        {children}
      </PermissionsProvider>
    </SessionProvider>
  )
}
