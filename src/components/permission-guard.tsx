'use client'

import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { UserRole, hasPermission, hasAllPermissions, hasAnyPermission } from '@/lib/permissions'

interface PermissionGuardProps {
  children: ReactNode
  permission?: keyof import('@/lib/permissions').Permissions
  permissions?: (keyof import('@/lib/permissions').Permissions)[]
  requireAll?: boolean // true = все права, false = хотя бы одно
  roles?: UserRole[]
  projectRole?: string
  fallback?: ReactNode
  showTooltip?: boolean
}

// Context для управления правами
interface PermissionsContextType {
  userRole: UserRole | null
  hasPermission: (permission: keyof import('@/lib/permissions').Permissions) => boolean
  loading: boolean
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true)
    } else if (session?.user?.role) {
      setUserRole(session.user.role as UserRole)
      setLoading(false)
    } else {
      setUserRole(null)
      setLoading(false)
    }
  }, [session, status])

  const checkPermission = (permission: keyof import('@/lib/permissions').Permissions) => {
    if (!userRole) return false
    return hasPermission(userRole, permission)
  }

  return (
    <PermissionsContext.Provider value={{ userRole, hasPermission: checkPermission, loading }}>
      {children}
    </PermissionsContext.Provider>
  )
}

export const usePermissions = () => {
  const context = useContext(PermissionsContext)
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider')
  }
  return context
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions,
  requireAll = true,
  roles,
  projectRole,
  fallback = null,
  showTooltip = false
}) => {
  const { userRole, hasPermission: checkPermission, loading } = usePermissions()
  
  if (loading) {
    return null
  }

  if (!userRole) {
    return <>{fallback}</>
  }

  // Проверка роли
  if (roles && !roles.includes(userRole)) {
    return <>{fallback}</>
  }

  // Проверка одного права
  if (permission) {
    const hasAccess = checkPermission(permission)
    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  // Проверка множественных прав
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(userRole, permissions, projectRole as any)
      : hasAnyPermission(userRole, permissions, projectRole as any)
    
    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

// Компонент для кнопок с проверкой прав
interface PermissionButtonProps extends PermissionGuardProps {
  onClick?: () => void
  disabled?: boolean
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  tooltip?: string
}

export function PermissionButton({
  children,
  permission,
  permissions,
  requireAll = true,
  roles,
  projectRole,
  fallback,
  onClick,
  disabled,
  className,
  variant = 'default',
  size = 'default',
  tooltip
}: PermissionButtonProps) {
  const { userRole, hasPermission: checkPermission, loading } = usePermissions()
  
  if (loading) {
    return null
  }

  if (!userRole) {
    return <>{fallback}</>
  }

  // Проверка роли
  if (roles && !roles.includes(userRole)) {
    return <>{fallback}</>
  }

  // Проверка одного права
  if (permission) {
    const hasAccess = checkPermission(permission)
    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  // Проверка множественных прав
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(userRole, permissions, projectRole as any)
      : hasAnyPermission(userRole, permissions, projectRole as any)
    
    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      title={tooltip}
    >
      {children}
    </button>
  )
}

// Компонент для условного отображения разделов
interface PermissionSectionProps extends PermissionGuardProps {
  section: string
}

export function PermissionSection({
  children,
  section,
  permission,
  permissions,
  requireAll = true,
  roles,
  projectRole,
  fallback = null
}: PermissionSectionProps) {
  const { userRole, hasPermission: checkPermission, loading } = usePermissions()
  
  if (loading) {
    return null
  }

  if (!userRole) {
    return <>{fallback}</>
  }

  // Проверка роли
  if (roles && !roles.includes(userRole)) {
    return <>{fallback}</>
  }

  // Проверка одного права
  if (permission) {
    const hasAccess = checkPermission(permission)
    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  // Проверка множественных прав
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(userRole, permissions, projectRole as any)
      : hasAnyPermission(userRole, permissions, projectRole as any)
    
    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

