'use client'

import { Loader2 } from 'lucide-react'

interface LoadingProps {
  text?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Loading({ text = 'Загрузка...', size = 'md' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-3">
        <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
        <p className="text-sm text-gray-600">{text}</p>
      </div>
    </div>
  )
}
