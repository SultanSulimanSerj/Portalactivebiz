'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Save, User, Bell, Shield, Database, Globe, LogOut } from 'lucide-react'
import Layout from '@/components/layout'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      passwordExpiry: 90
    }
  })

  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  // Загружаем данные пользователя при загрузке компонента
  useEffect(() => {
    if (session?.user) {
      setSettings(prev => ({
        ...prev,
        email: session.user.email || '',
        companyName: session.user.name || '',
        phone: session.user.phone || '',
        address: session.user.address || ''
      }))
    }
  }, [session])

  const handleSave = async () => {
    setLoading(true)
    // Имитация сохранения
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
                <p className="text-gray-600">Управление настройками системы</p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Выйти
                </Button>
                <Button
                  className="gradient-primary hover:opacity-90"
                  onClick={handleSave}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {saved && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
              <p className="text-green-800">Настройки успешно сохранены!</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Основная информация */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  Основная информация
                </CardTitle>
                <CardDescription>Настройки компании и контактной информации</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Название компании</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({...settings, email: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings({...settings, phone: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Адрес</Label>
                  <Input
                    id="address"
                    value={settings.address}
                    onChange={(e) => setSettings({...settings, address: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Уведомления */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-primary" />
                  Уведомления
                </CardTitle>
                <CardDescription>Настройки уведомлений и оповещений</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email уведомления</Label>
                    <p className="text-sm text-gray-500">Получать уведомления на email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.email}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: {...settings.notifications, email: e.target.checked}
                    })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS уведомления</Label>
                    <p className="text-sm text-gray-500">Получать SMS уведомления</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.sms}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: {...settings.notifications, sms: e.target.checked}
                    })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push уведомления</Label>
                    <p className="text-sm text-gray-500">Получать push уведомления в браузере</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.push}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: {...settings.notifications, push: e.target.checked}
                    })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Безопасность */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-primary" />
                  Безопасность
                </CardTitle>
                <CardDescription>Настройки безопасности и доступа</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Двухфакторная аутентификация</Label>
                    <p className="text-sm text-gray-500">Дополнительная защита аккаунта</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.security.twoFactor}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: {...settings.security, twoFactor: e.target.checked}
                    })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </div>
                <div>
                  <Label htmlFor="sessionTimeout">Таймаут сессии (минуты)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: {...settings.security, sessionTimeout: parseInt(e.target.value)}
                    })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="passwordExpiry">Срок действия пароля (дни)</Label>
                  <Input
                    id="passwordExpiry"
                    type="number"
                    value={settings.security.passwordExpiry}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: {...settings.security, passwordExpiry: parseInt(e.target.value)}
                    })}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Система */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2 text-primary" />
                  Система
                </CardTitle>
                <CardDescription>Информация о системе и базе данных</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-500">Версия системы</Label>
                    <p className="font-medium">1.0.0</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">База данных</Label>
                    <p className="font-medium">PostgreSQL</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Последнее обновление</Label>
                    <p className="font-medium">Сегодня</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Статус</Label>
                    <p className="font-medium text-green-600">Активна</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    <Globe className="h-4 w-4 mr-2" />
                    Проверить обновления
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}