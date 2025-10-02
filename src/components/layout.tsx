'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  Home, 
  FolderOpen, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  MessageSquare,
  Flag,
  BarChart3,
  Users,
  Settings,
  Menu,
  X,
  Search,
  User
} from 'lucide-react'
import Notifications from '@/components/notifications'
import Navigation from '@/components/navigation'

const navigation = [
  { name: 'Главная', href: '/', icon: Home },
  { name: 'Проекты', href: '/projects', icon: FolderOpen },
  { name: 'Документы', href: '/documents', icon: FileText },
  { name: 'Финансы', href: '/finance', icon: DollarSign },
  { name: 'Согласования', href: '/approvals', icon: CheckCircle },
  { name: 'Чат', href: '/chat', icon: MessageSquare },
  { name: 'Задачи', href: '/tasks', icon: Flag },
  { name: 'Отчеты', href: '/reports', icon: BarChart3 },
  { name: 'Пользователи', href: '/users', icon: Users },
  { name: 'Настройки', href: '/settings', icon: Settings },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      {/* Main content */}
      <div className="lg:pl-64 pt-16">
        {/* Page content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}