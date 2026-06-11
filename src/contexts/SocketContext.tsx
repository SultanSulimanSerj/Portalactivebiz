'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
})

export function useSocket() {
  return useContext(SocketContext)
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') {
      setSocket((current) => {
        current?.disconnect()
        return null
      })
      setIsConnected(false)
      return
    }

    const socketInstance = io({
      path: '/api/socket',
      transports: ['polling', 'websocket'],
      autoConnect: true,
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    const onConnect = () => {
      setIsConnected(true)
    }

    const onDisconnect = () => {
      setIsConnected(false)
    }

    const onConnectError = (error: Error) => {
      console.error('Ошибка подключения WebSocket:', error.message)
      setIsConnected(false)
    }

    socketInstance.on('connect', onConnect)
    socketInstance.on('disconnect', onDisconnect)
    socketInstance.on('connect_error', onConnectError)

    if (socketInstance.connected) {
      setIsConnected(true)
    }

    setSocket(socketInstance)

    return () => {
      socketInstance.off('connect', onConnect)
      socketInstance.off('disconnect', onDisconnect)
      socketInstance.off('connect_error', onConnectError)
      socketInstance.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [status])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}
