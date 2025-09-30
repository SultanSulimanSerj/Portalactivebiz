'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Send, Paperclip, Smile, MoreVertical } from 'lucide-react'
import Layout from '@/components/layout'

interface Message {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  project?: {
    id: string
    name: string
  }
  attachments: any[]
}

interface Project {
  id: string
  name: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchProjects()
    fetchMessages()
  }, [])

  useEffect(() => {
    fetchMessages()
  }, [selectedProject])

  // Автоматическое обновление сообщений каждые 3 секунды
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages()
    }, 3000)

    return () => clearInterval(interval)
  }, [selectedProject])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
    }
  }

  const fetchMessages = async () => {
    try {
      const url = selectedProject 
        ? `/api/chat?projectId=${selectedProject}`
        : '/api/chat'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        setIsOnline(true)
      } else {
        setIsOnline(false)
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
      setIsOnline(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          projectId: selectedProject || null
        })
      })

      if (response.ok) {
        const newMsg = await response.json()
        setMessages([...messages, newMsg])
        setNewMessage('')
        // Дополнительно обновляем сообщения с сервера
        setTimeout(() => fetchMessages(), 100)
      }
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера'
    } else {
      return date.toLocaleDateString('ru-RU')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Загрузка сообщений...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">Чат команды</h1>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-500">
                {isOnline ? 'Онлайн' : 'Офлайн'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {selectedProject 
                ? `Проект: ${projects.find(p => p.id === selectedProject)?.name}`
                : 'Общий чат'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Общий чат</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет сообщений</h3>
              <p className="text-gray-500">Начните общение с командой</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const showDate = index === 0 || 
                formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt)
              
              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center text-sm text-gray-500 py-2">
                      {formatDate(message.createdAt)}
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {message.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{message.user.name}</span>
                        <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
                        {message.project && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {message.project.name}
                          </span>
                        )}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm">{message.content}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((attachment, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                                <Paperclip className="h-3 w-3" />
                                <span>{attachment.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Smile className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Напишите сообщение..."
                disabled={sending}
              />
            </div>
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || sending}
              className="flex items-center gap-2"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
              Отправить
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  )
}