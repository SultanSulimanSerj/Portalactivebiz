'use client'

import { useState } from 'react'
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
  Code,
  Menu,
  X
} from 'lucide-react'

const navigation = [
  { name: 'Главная', href: '/', icon: Home },
  { name: 'Проекты', href: '/projects', icon: FolderOpen },
  { name: 'Задачи', href: '/tasks', icon: Flag },
  { name: 'Документы', href: '/documents', icon: FileText },
  { name: 'Финансы', href: '/finance', icon: DollarSign },
  { name: 'Согласования', href: '/approvals', icon: CheckCircle },
  { name: 'Чат', href: '/chat', icon: MessageSquare },
  { name: 'Шаблоны', href: '/templates', icon: File },
  { name: 'Отчеты', href: '/reports', icon: BarChart3 },
  { name: 'Пользователи', href: '/users', icon: Users },
  { name: 'Настройки', href: '/settings', icon: Settings },
  { name: 'API Docs', href: '/api-docs', icon: Code },
]

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

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
            {navigation.map((item) => {
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
                <span className="text-white text-sm font-medium">U</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Пользователь</p>
                <p className="text-xs text-gray-500">admin@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
