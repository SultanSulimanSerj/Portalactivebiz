'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  FolderOpen, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  MessageSquare, 
  File,
  Flag,
  BarChart3,
  Users,
  Settings,
  Menu,
  X
} from 'lucide-react'
import { UserRole, getAvailableNavigationSections } from '@/lib/permissions'

interface NavigationItem {
  name: string
  href: string
  icon: any
  permission?: string
  roles?: UserRole[]
}

const navigation: NavigationItem[] = [
  { name: 'Главная', href: '/', icon: Home },
  { name: 'Проекты', href: '/projects', icon: FolderOpen },
  { name: 'Задачи', href: '/tasks', icon: Flag },
  { name: 'Документы', href: '/documents', icon: FileText },
  { name: 'Финансы', href: '/finance', icon: DollarSign },
  { name: 'Согласования', href: '/approvals', icon: CheckCircle },
  { name: 'Чат', href: '/chat', icon: MessageSquare },
  { name: 'Шаблоны', href: '/templates', icon: File },
  { 
    name: 'Отчеты', 
    href: '/reports', 
    icon: BarChart3,
    permission: 'canViewReports'
  },
  { 
    name: 'Пользователи', 
    href: '/users', 
    icon: Users,
    permission: 'canManageUsers'
  },
  { 
    name: 'Настройки', 
    href: '/settings', 
    icon: Settings,
    permission: 'canViewSystemSettings'
  },
]

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>(UserRole.USER)
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null)
  const pathname = usePathname()

  // Получаем информацию о пользователе
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const session = await response.json()
          if (session?.user) {
            setUserRole(session.user.role as UserRole)
            setUserInfo({
              name: session.user.name || 'Пользователь',
              email: session.user.email || 'user@example.com'
            })
          }
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
      }
    }

    fetchUserInfo()
  }, [])

  // Фильтруем навигацию по правам доступа
  const availableSections = getAvailableNavigationSections(userRole)
  const filteredNavigation = navigation.filter(item => {
    // Если нет ограничений по правам, показываем всем
    if (!item.permission) return true
    
    // Проверяем доступность раздела
    const sectionName = item.href.replace('/', '') || 'dashboard'
    return availableSections.includes(sectionName)
  })

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white/80 backdrop-blur-sm"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation */}
      <nav className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-xl font-bold text-gray-900">Project Portal</h1>
            <p className="text-sm text-gray-600">Управление проектами</p>
          </div>

          <div className="space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-primary text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {userInfo?.name || 'Пользователь'}
                </p>
                <p className="text-xs text-gray-500">
                  {userInfo?.email || 'user@example.com'}
                </p>
                <p className="text-xs text-gray-400">
                  {userRole === UserRole.OWNER && 'Владелец'}
                  {userRole === UserRole.ADMIN && 'Администратор'}
                  {userRole === UserRole.MANAGER && 'Менеджер'}
                  {userRole === UserRole.USER && 'Пользователь'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
