'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function DebugAuth() {
  const { data: session, status } = useSession()
  const [apiTest, setApiTest] = useState<any>(null)

  useEffect(() => {
    const testApi = async () => {
      try {
        const response = await fetch('/api/test-auth')
        const data = await response.json()
        setApiTest(data)
      } catch (error) {
        setApiTest({ error: 'Failed to fetch' })
      }
    }
    testApi()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Authentication</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Client Session Status:</h2>
          <p>Status: {status}</p>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold">API Test:</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(apiTest, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
