import { logger } from './logger'

export interface PerformanceMetrics {
  operation: string
  duration: number
  timestamp: Date
  userId?: string
  requestId?: string
  success: boolean
  error?: string
}

export interface SystemMetrics {
  memory: {
    used: number
    total: number
    percentage: number
  }
  cpu: {
    usage: number
  }
  database: {
    connections: number
    queries: number
    slowQueries: number
  }
  api: {
    requests: number
    errors: number
    averageResponseTime: number
  }
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private maxMetrics: number = 1000

  recordOperation(operation: string, duration: number, success: boolean, userId?: string, requestId?: string, error?: string) {
    const metric: PerformanceMetrics = {
      operation,
      duration,
      timestamp: new Date(),
      userId,
      requestId,
      success,
      error
    }

    this.metrics.push(metric)

    // Ограничиваем количество метрик в памяти
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Логируем медленные операции (>1 секунды)
    if (duration > 1000) {
      logger.performance(operation, duration, { 
        slow: true, 
        userId, 
        requestId,
        error 
      })
    }

    // Логируем ошибки
    if (!success && error) {
      logger.error(`Operation failed: ${operation}`, { 
        duration, 
        userId, 
        requestId, 
        error 
      })
    }
  }

  getMetrics(operation?: string, timeRange?: { start: Date; end: Date }): PerformanceMetrics[] {
    let filtered = this.metrics

    if (operation) {
      filtered = filtered.filter(m => m.operation === operation)
    }

    if (timeRange) {
      filtered = filtered.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      )
    }

    return filtered
  }

  getAverageResponseTime(operation?: string): number {
    const metrics = this.getMetrics(operation)
    if (metrics.length === 0) return 0

    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0)
    return totalDuration / metrics.length
  }

  getErrorRate(operation?: string): number {
    const metrics = this.getMetrics(operation)
    if (metrics.length === 0) return 0

    const errorCount = metrics.filter(m => !m.success).length
    return (errorCount / metrics.length) * 100
  }

  getSlowOperations(threshold: number = 1000): PerformanceMetrics[] {
    return this.metrics.filter(m => m.duration > threshold)
  }

  getSystemHealth(): 'healthy' | 'warning' | 'critical' {
    const recentMetrics = this.getMetrics(undefined, {
      start: new Date(Date.now() - 5 * 60 * 1000), // Последние 5 минут
      end: new Date()
    })

    const errorRate = this.getErrorRate()
    const avgResponseTime = this.getAverageResponseTime()

    if (errorRate > 10 || avgResponseTime > 5000) {
      return 'critical'
    } else if (errorRate > 5 || avgResponseTime > 2000) {
      return 'warning'
    }

    return 'healthy'
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Декоратор для автоматического мониторинга функций
export function monitorPerformance(operationName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      let success = true
      let error: string | undefined

      try {
        const result = await method.apply(this, args)
        return result
      } catch (err) {
        success = false
        error = err instanceof Error ? err.message : String(err)
        throw err
      } finally {
        const duration = Date.now() - startTime
        performanceMonitor.recordOperation(operationName, duration, success, undefined, undefined, error)
      }
    }
  }
}

// Middleware для мониторинга API запросов
export function apiMonitoringMiddleware(handler: Function) {
  return async function (request: any, ...args: any[]) {
    const startTime = Date.now()
    const requestId = Math.random().toString(36).substring(7)
    let success = true
    let error: string | undefined

    try {
      const result = await handler(request, ...args)
      return result
    } catch (err) {
      success = false
      error = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      const duration = Date.now() - startTime
      const operation = `${request.method} ${request.url}`
      
      performanceMonitor.recordOperation(operation, duration, success, undefined, requestId, error)
      
      // Логируем API запрос
      logger.info(`API Request: ${operation}`, {
        method: request.method,
        url: request.url,
        duration,
        success,
        requestId
      })
    }
  }
}

// Системные метрики
export async function getSystemMetrics(): Promise<SystemMetrics> {
  const memUsage = process.memoryUsage()
  
  return {
    memory: {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
    },
    cpu: {
      usage: process.cpuUsage().user / 1000000 // Convert to seconds
    },
    database: {
      connections: 0, // TODO: Implement database connection monitoring
      queries: 0, // TODO: Implement query counting
      slowQueries: 0 // TODO: Implement slow query detection
    },
    api: {
      requests: performanceMonitor.getMetrics().length,
      errors: performanceMonitor.getMetrics().filter(m => !m.success).length,
      averageResponseTime: performanceMonitor.getAverageResponseTime()
    }
  }
}
