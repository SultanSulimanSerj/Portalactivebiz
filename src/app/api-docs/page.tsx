'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Code, Database, FileText, Users, DollarSign, CheckCircle, MessageSquare, Settings } from 'lucide-react'

interface ApiEndpoint {
  method: string
  path: string
  description: string
  tags: string[]
  parameters?: any[]
  responses: any
}

export default function ApiDocsPage() {
  const [swaggerData, setSwaggerData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null)

  useEffect(() => {
    fetchSwaggerData()
  }, [])

  const fetchSwaggerData = async () => {
    try {
      const response = await fetch('/api/docs')
      const data = await response.json()
      setSwaggerData(data)
    } catch (error) {
      console.error('Error fetching API docs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-green-100 text-green-800'
      case 'POST': return 'bg-blue-100 text-blue-800'
      case 'PUT': return 'bg-yellow-100 text-yellow-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTagIcon = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'authentication': return <Settings className="h-4 w-4" />
      case 'projects': return <FileText className="h-4 w-4" />
      case 'tasks': return <CheckCircle className="h-4 w-4" />
      case 'documents': return <FileText className="h-4 w-4" />
      case 'finance': return <DollarSign className="h-4 w-4" />
      case 'users': return <Users className="h-4 w-4" />
      case 'system': return <Database className="h-4 w-4" />
      default: return <Code className="h-4 w-4" />
    }
  }

  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'authentication': return 'bg-purple-100 text-purple-800'
      case 'projects': return 'bg-blue-100 text-blue-800'
      case 'tasks': return 'bg-green-100 text-green-800'
      case 'documents': return 'bg-orange-100 text-orange-800'
      case 'finance': return 'bg-yellow-100 text-yellow-800'
      case 'users': return 'bg-pink-100 text-pink-800'
      case 'system': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Загрузка API документации...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!swaggerData) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600">Ошибка загрузки API документации</p>
            <Button onClick={fetchSwaggerData} className="mt-4">
              Попробовать снова
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  const endpoints = Object.entries(swaggerData.paths || {}).flatMap(([path, methods]: [string, any]) =>
    Object.entries(methods).map(([method, details]: [string, any]) => ({
      method: method.toUpperCase(),
      path,
      description: details.summary || '',
      tags: details.tags || [],
      parameters: details.parameters || [],
      responses: details.responses || {}
    }))
  )

  const groupedEndpoints = endpoints.reduce((acc, endpoint) => {
    endpoint.tags.forEach(tag => {
      if (!acc[tag]) acc[tag] = []
      acc[tag].push(endpoint)
    })
    return acc
  }, {} as Record<string, ApiEndpoint[]>)

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Документация</h1>
          <p className="text-gray-600 mt-2">
            Полное описание API для интеграции с Project Portal
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Информация об API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">Название</h3>
                <p className="text-gray-600">{swaggerData.info?.title}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Версия</h3>
                <p className="text-gray-600">{swaggerData.info?.version}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Описание</h3>
                <p className="text-gray-600">{swaggerData.info?.description}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Базовый URL</h3>
                <p className="text-gray-600">{swaggerData.servers?.[0]?.url}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue={Object.keys(groupedEndpoints)[0]} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            {Object.keys(groupedEndpoints).map(tag => (
              <TabsTrigger key={tag} value={tag} className="flex items-center gap-2">
                {getTagIcon(tag)}
                <span className="hidden sm:inline">{tag}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(groupedEndpoints).map(([tag, endpoints]) => (
            <TabsContent key={tag} value={tag} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                {getTagIcon(tag)}
                <h2 className="text-xl font-semibold capitalize">{tag}</h2>
                <Badge className={getTagColor(tag)}>
                  {endpoints.length} endpoints
                </Badge>
              </div>

              <div className="grid gap-4">
                {endpoints.map((endpoint, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader 
                      className="pb-3"
                      onClick={() => setSelectedEndpoint(endpoint)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={getMethodColor(endpoint.method)}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {endpoint.path}
                          </code>
                        </div>
                        <Button variant="ghost" size="sm">
                          Подробнее
                        </Button>
                      </div>
                      <CardDescription className="mt-2">
                        {endpoint.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {selectedEndpoint && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className={getMethodColor(selectedEndpoint.method)}>
                  {selectedEndpoint.method}
                </Badge>
                <code className="text-lg font-mono">{selectedEndpoint.path}</code>
              </CardTitle>
              <CardDescription>{selectedEndpoint.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Параметры</h3>
                  <div className="space-y-2">
                    {selectedEndpoint.parameters.map((param: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Badge variant="outline">{param.name}</Badge>
                        <span className="text-sm text-gray-600">
                          {param.in} - {param.schema?.type || 'string'}
                          {param.required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Ответы</h3>
                <div className="space-y-2">
                  {Object.entries(selectedEndpoint.responses).map(([code, response]: [string, any]) => (
                    <div key={code} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Badge className={code.startsWith('2') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {code}
                      </Badge>
                      <span className="text-sm text-gray-600">{response.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedEndpoint(null)}
                  className="w-full"
                >
                  Закрыть
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Аутентификация</CardTitle>
            <CardDescription>
              API использует Bearer токены для аутентификации
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Получение токена</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <code className="text-sm">
                    POST /api/auth/login<br/>
                    {`{`}<br/>
                    &nbsp;&nbsp;"email": "user@example.com",<br/>
                    &nbsp;&nbsp;"password": "password"<br/>
                    {`}`}
                  </code>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Использование токена</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <code className="text-sm">
                    Authorization: Bearer YOUR_TOKEN_HERE
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
