'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogIn, Eye, EyeOff } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('admin@company.com')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Простая аутентификация для демо
      if (email === 'admin@company.com' && password === 'admin123') {
        // Сохраняем токен в localStorage
        localStorage.setItem('auth-token', 'demo-token')
        localStorage.setItem('user', JSON.stringify({
          id: '1',
          name: 'Администратор',
          email: 'admin@company.com',
          role: 'ADMIN',
          companyId: 'company-1'
        }))
        
        // Перенаправляем на главную
        router.push('/')
      } else {
        setError('Неверные учетные данные')
      }
    } catch (err) {
      setError('Ошибка входа в систему')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary flex items-center justify-center mb-4">
            <LogIn className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Вход в систему</CardTitle>
          <CardDescription>
            Войдите в свой аккаунт для доступа к порталу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                required
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123"
                  required
                  className="w-full pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full gradient-primary hover:opacity-90"
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Демо аккаунты:</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Администратор:</strong> admin@company.com / admin123</p>
              <p><strong>Менеджер:</strong> manager@company.com / admin123</p>
              <p><strong>Пользователь:</strong> user@company.com / admin123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}