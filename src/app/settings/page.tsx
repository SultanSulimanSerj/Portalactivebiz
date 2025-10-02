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
  const { data: session, update } = useSession()
  const [settings, setSettings] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    // Реквизиты компании
    companyRequisites: {
      legalName: '',
      inn: '',
      kpp: '',
      ogrn: '',
      legalAddress: '',
      actualAddress: '',
      bankAccount: '',
      bankName: '',
      bankBik: '',
      correspondentAccount: '',
      directorName: '',
      directorPosition: 'Генеральный директор',
      contactEmail: '',
      contactPhone: ''
    },
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
  const [refreshKey, setRefreshKey] = useState(0)
  const router = useRouter()

  // Загружаем данные пользователя при загрузке компонента
  useEffect(() => {
    if (session?.user) {
      setSettings(prev => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || '',
        companyName: session.user.company?.name || '',
        phone: session.user.phone || '',
        address: session.user.address || '',
        // Загружаем реквизиты компании
        companyRequisites: {
          legalName: session.user.company?.legalName || '',
          inn: session.user.company?.inn || '',
          kpp: session.user.company?.kpp || '',
          ogrn: session.user.company?.ogrn || '',
          legalAddress: session.user.company?.legalAddress || '',
          actualAddress: session.user.company?.actualAddress || '',
          bankAccount: session.user.company?.bankAccount || '',
          bankName: session.user.company?.bankName || '',
          bankBik: session.user.company?.bankBik || '',
          correspondentAccount: session.user.company?.correspondentAccount || '',
          directorName: session.user.company?.directorName || '',
          directorPosition: session.user.company?.directorPosition || 'Генеральный директор',
          contactEmail: session.user.company?.contactEmail || '',
          contactPhone: session.user.company?.contactPhone || ''
        }
      }))
    }
  }, [session])

  const handleSave = async () => {
    setLoading(true)
    try {
      // Отправляем личные данные пользователя
      const userResponse = await fetch(`/api/users/${session?.user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: settings.name,
          phone: settings.phone,
          address: settings.address
        }),
      })

      // Отправляем реквизиты компании
      const companyResponse = await fetch(`/api/company/${session?.user?.companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          legalName: settings.companyRequisites.legalName,
          inn: settings.companyRequisites.inn,
          kpp: settings.companyRequisites.kpp,
          ogrn: settings.companyRequisites.ogrn,
          legalAddress: settings.companyRequisites.legalAddress,
          actualAddress: settings.companyRequisites.actualAddress,
          bankAccount: settings.companyRequisites.bankAccount,
          bankName: settings.companyRequisites.bankName,
          bankBik: settings.companyRequisites.bankBik,
          correspondentAccount: settings.companyRequisites.correspondentAccount,
          directorName: settings.companyRequisites.directorName,
          directorPosition: settings.companyRequisites.directorPosition,
          contactEmail: settings.companyRequisites.contactEmail,
          contactPhone: settings.companyRequisites.contactPhone
        }),
      })

      if (userResponse.ok && companyResponse.ok) {
        const updatedUser = await userResponse.json()
        const updatedCompany = await companyResponse.json()
        
        // Убираем логи для чистоты

        // Обновляем состояние из API ответа
        setSettings(prev => ({
          ...prev,
          name: updatedUser.name || prev.name,
          phone: updatedUser.phone || prev.phone,
          address: updatedUser.address || prev.address,
          companyName: updatedCompany.company?.name || prev.companyName, // Обновляем название компании
          companyRequisites: {
            ...prev.companyRequisites,
            legalName: updatedCompany.company?.legalName || prev.companyRequisites.legalName, // Исправлено: используем legalName, а не name
            inn: updatedCompany.company?.inn || prev.companyRequisites.inn,
            kpp: updatedCompany.company?.kpp || prev.companyRequisites.kpp,
            ogrn: updatedCompany.company?.ogrn || prev.companyRequisites.ogrn,
            legalAddress: updatedCompany.company?.legalAddress || prev.companyRequisites.legalAddress,
            actualAddress: updatedCompany.company?.actualAddress || prev.companyRequisites.actualAddress,
            bankAccount: updatedCompany.company?.bankAccount || prev.companyRequisites.bankAccount,
            bankName: updatedCompany.company?.bankName || prev.companyRequisites.bankName,
            bankBik: updatedCompany.company?.bankBik || prev.companyRequisites.bankBik,
            correspondentAccount: updatedCompany.company?.correspondentAccount || prev.companyRequisites.correspondentAccount,
            directorName: updatedCompany.company?.directorName || prev.companyRequisites.directorName,
            directorPosition: updatedCompany.company?.directorPosition || prev.companyRequisites.directorPosition, // Добавляем directorPosition
            contactEmail: updatedCompany.company?.contactEmail || prev.companyRequisites.contactEmail,
            contactPhone: updatedCompany.company?.contactPhone || prev.companyRequisites.contactPhone
          }
        }))

        // Обновляем сессию NextAuth
        await update()

        setSaved(true)
        setRefreshKey(prev => prev + 1) // Принудительно обновляем компонент
        setTimeout(() => setSaved(false), 3000)
      } else {
        const errorData = await (userResponse.ok ? companyResponse : userResponse).json()
        alert(`Ошибка при сохранении настроек: ${errorData.error || 'Неизвестная ошибка'}`)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Ошибка при сохранении настроек')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <Layout>
      <div key={refreshKey} className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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
                  <Label htmlFor="name">ФИО</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => setSettings({...settings, name: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="companyName">Название компании</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                    className="mt-1"
                    disabled
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

            {/* Реквизиты компании */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2 text-primary" />
                  Реквизиты компании
                </CardTitle>
                <CardDescription>Юридические и банковские реквизиты для использования в договорах и документах</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Юридические реквизиты */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Юридические реквизиты</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="legalName">Полное наименование организации *</Label>
                      <Input
                        id="legalName"
                        value={settings.companyRequisites.legalName}
                        onChange={(e) => setSettings({
                          ...settings,
                          companyRequisites: {...settings.companyRequisites, legalName: e.target.value}
                        })}
                        placeholder="ООО 'Название компании'"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="inn">ИНН *</Label>
                      <Input
                        id="inn"
                        value={settings.companyRequisites.inn}
                        onChange={(e) => setSettings({
                          ...settings,
                          companyRequisites: {...settings.companyRequisites, inn: e.target.value}
                        })}
                        placeholder="123456789012"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="kpp">КПП</Label>
                      <Input
                        id="kpp"
                        value={settings.companyRequisites.kpp}
                        onChange={(e) => setSettings({
                          ...settings,
                          companyRequisites: {...settings.companyRequisites, kpp: e.target.value}
                        })}
                        placeholder="123401001"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ogrn">ОГРН</Label>
                      <Input
                        id="ogrn"
                        value={settings.companyRequisites.ogrn}
                        onChange={(e) => setSettings({
                          ...settings,
                          companyRequisites: {...settings.companyRequisites, ogrn: e.target.value}
                        })}
                        placeholder="123456789012345"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Адреса */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Адреса</h4>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="legalAddress">Юридический адрес</Label>
                      <textarea
                        id="legalAddress"
                        rows={3}
                        value={settings.companyRequisites.legalAddress}
                        onChange={(e) => setSettings({
                          ...settings,
                          companyRequisites: {...settings.companyRequisites, legalAddress: e.target.value}
                        })}
                        placeholder="123456, г. Москва, ул. Ленина, д. 1, офис 101"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="actualAddress">Фактический адрес</Label>
                      <textarea
                        id="actualAddress"
                        rows={3}
                        value={settings.companyRequisites.actualAddress}
                        onChange={(e) => setSettings({
                          ...settings,
                          companyRequisites: {...settings.companyRequisites, actualAddress: e.target.value}
                        })}
                        placeholder="123456, г. Москва, ул. Ленина, д. 1, офис 101"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Банковские реквизиты */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Банковские реквизиты</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bankAccount">Расчетный счет</Label>
                      <Input
                        id="bankAccount"
                        value={settings.companyRequisites.bankAccount}
                        onChange={(e) => setSettings({
                          ...settings,
                          companyRequisites: {...settings.companyRequisites, bankAccount: e.target.value}
                        })}
                        placeholder="40702810000000000001"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bankName">Наименование банка</Label>
                      <Input
                        id="bankName"
                        value={settings.companyRequisites.bankName}
                        onChange={(e) => setSettings({
                          ...settings,
                          companyRequisites: {...settings.companyRequisites, bankName: e.target.value}
                        })}
                        placeholder="ПАО СБЕРБАНК"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bankBik">БИК банка</Label>
                      <Input
                        id="bankBik"
                        value={settings.companyRequisites.bankBik}
                        onChange={(e) => setSettings({
                          ...settings,
                          companyRequisites: {...settings.companyRequisites, bankBik: e.target.value}
                        })}
                        placeholder="044525225"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="correspondentAccount">Корреспондентский счет</Label>
                      <Input
                        id="correspondentAccount"
                        value={settings.companyRequisites.correspondentAccount}
                        onChange={(e) => setSettings({
                          ...settings,
                          companyRequisites: {...settings.companyRequisites, correspondentAccount: e.target.value}
                        })}
                        placeholder="30101810400000000225"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Руководитель */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Руководитель</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="directorName">ФИО руководителя *</Label>
                      <Input
                        id="directorName"
                        value={settings.companyRequisites.directorName}
                        onChange={(e) => setSettings({
                          ...settings,
                          companyRequisites: {...settings.companyRequisites, directorName: e.target.value}
                        })}
                        placeholder="Иванов Иван Иванович"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="directorPosition">Должность</Label>
                      <Input
                        id="directorPosition"
                        value={settings.companyRequisites.directorPosition}
                        onChange={(e) => setSettings({
                          ...settings,
                          companyRequisites: {...settings.companyRequisites, directorPosition: e.target.value}
                        })}
                        placeholder="Генеральный директор"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactEmail">Email для договоров</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={settings.companyRequisites.contactEmail}
                        onChange={(e) => setSettings({
                          ...settings,
                          companyRequisites: {...settings.companyRequisites, contactEmail: e.target.value}
                        })}
                        placeholder="info@company.ru"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPhone">Телефон для договоров</Label>
                      <Input
                        id="contactPhone"
                        value={settings.companyRequisites.contactPhone}
                        onChange={(e) => setSettings({
                          ...settings,
                          companyRequisites: {...settings.companyRequisites, contactPhone: e.target.value}
                        })}
                        placeholder="+7 (495) 123-45-67"
                        className="mt-1"
                      />
                    </div>
                  </div>
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