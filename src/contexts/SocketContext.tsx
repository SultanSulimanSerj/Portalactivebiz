'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
})

export function useSocket() {
  return useContext(SocketContext)
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Инициализация Socket.IO клиента
    const socketInstance = io({
      path: '/api/socket',
      transports: ['polling', 'websocket'],
      autoConnect: true
    })

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket подключен:', socketInstance.id)
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('❌ WebSocket отключен')
      setIsConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Ошибка подключения WebSocket:', error)
      setIsConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      console.log('🔌 Закрытие WebSocket соединения')
      socketInstance.disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

