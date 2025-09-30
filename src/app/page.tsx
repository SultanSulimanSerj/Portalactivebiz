'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Dashboard from '@/components/dashboard'
import Layout from '@/components/layout'

export default function Home() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Проверяем токен в localStorage
    const token = localStorage.getItem('auth-token')
    if (!token) {
      router.push('/auth/signin')
    } else {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-sm text-gray-500">Загрузка...</div>
      </div>
    )
  }

  return <Dashboard />
}
