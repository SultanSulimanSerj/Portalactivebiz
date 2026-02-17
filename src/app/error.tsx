'use client'

import { useEffect } from 'react'
import Layout from '@/components/layout'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Что-то пошло не так
          </h2>
          <p className="text-gray-600 mb-6">
            {error.message || 'Произошла непредвиденная ошибка'}
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    </Layout>
  )
}
