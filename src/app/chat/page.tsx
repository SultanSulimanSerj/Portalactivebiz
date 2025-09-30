'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, MessageSquare, User, Paperclip } from 'lucide-react'
import Layout from '@/components/layout'

interface Message {
  id: string
  sender: string
  content: string
  timestamp: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'Иван Петров', content: 'Привет всем! Как продвигается работа над проектом "Солнечный"?', timestamp: '10:00' },
    { id: '2', sender: 'Анна Сидорова', content: 'Привет, Иван! Все идет по плану. Документы по этапу 1 готовы к согласованию.', timestamp: '10:05' },
    { id: '3', sender: 'Петр Иванов', content: 'Отлично! Я проверю финансовые отчеты сегодня.', timestamp: '10:10' },
  ])
  const [newMessage, setNewMessage] = useState('')

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, {
        id: String(messages.length + 1),
        sender: 'Вы',
        content: newMessage,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      }])
      setNewMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Чат проекта</h1>
                <p className="text-gray-600">Обсуждение текущих вопросов</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Card className="h-full flex flex-col animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                Общий чат
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'Вы' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-end max-w-xs md:max-w-md ${message.sender === 'Вы' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      message.sender === 'Вы' ? 'bg-primary ml-2' : 'bg-gray-500 mr-2'
                    }`}>
                      {message.sender === 'Вы' ? 'Я' : message.sender.charAt(0)}
                    </div>
                    <div className={`p-3 rounded-lg ${
                      message.sender === 'Вы' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}>
                      <p className="text-sm font-medium">{message.sender}</p>
                      <p className="text-sm">{message.content}</p>
                      <span className={`block text-xs mt-1 ${
                        message.sender === 'Вы' ? 'text-primary-foreground/80' : 'text-gray-600'
                      }`}>{message.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
            <div className="border-t border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-5 w-5 text-gray-500" />
                </Button>
                <input
                  type="text"
                  placeholder="Напишите сообщение..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage()
                    }
                  }}
                />
                <Button className="gradient-primary hover:opacity-90" onClick={handleSendMessage}>
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}