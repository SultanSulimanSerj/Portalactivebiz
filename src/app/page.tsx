'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Dashboard from '@/components/dashboard'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true)
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      setLoading(false)
    }
  }, [status, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <div className="text-sm text-gray-500 mt-2">Загрузка...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return <Dashboard />
}