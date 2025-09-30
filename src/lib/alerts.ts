import { logger } from './logger'
import { performanceMonitor } from './monitoring'

export interface AlertConfig {
  enabled: boolean
  email?: string
  webhook?: string
  threshold: {
    errorRate: number
    responseTime: number
    memoryUsage: number
  }
}

export interface Alert {
  id: string
  type: 'error' | 'performance' | 'security' | 'system'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  context?: any
  timestamp: Date
  resolved: boolean
}

class AlertManager {
  private alerts: Alert[] = []
  private config: AlertConfig

  constructor() {
    this.config = {
      enabled: process.env.ALERTS_ENABLED === 'true',
      email: process.env.ALERT_EMAIL,
      webhook: process.env.ALERT_WEBHOOK,
      threshold: {
        errorRate: parseFloat(process.env.ALERT_ERROR_RATE || '5'),
        responseTime: parseFloat(process.env.ALERT_RESPONSE_TIME || '2000'),
        memoryUsage: parseFloat(process.env.ALERT_MEMORY_USAGE || '80')
      }
    }
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }

  private async sendAlert(alert: Alert) {
    if (!this.config.enabled) return

    // Логируем алерт
    await logger.error(`ALERT: ${alert.message}`, {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      context: alert.context
    })

    // Отправляем email (если настроен)
    if (this.config.email) {
      await this.sendEmailAlert(alert)
    }

    // Отправляем webhook (если настроен)
    if (this.config.webhook) {
      await this.sendWebhookAlert(alert)
    }
  }

  private async sendEmailAlert(alert: Alert) {
    // TODO: Implement email sending (nodemailer, sendgrid, etc.)
    console.log(`Email alert sent: ${alert.message}`)
  }

  private async sendWebhookAlert(alert: Alert) {
    try {
      const response = await fetch(this.config.webhook!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alert: {
            id: alert.id,
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            timestamp: alert.timestamp.toISOString(),
            context: alert.context
          }
        })
      })

      if (!response.ok) {
        console.error('Failed to send webhook alert:', response.statusText)
      }
    } catch (error) {
      console.error('Error sending webhook alert:', error)
    }
  }

  async createAlert(
    type: Alert['type'],
    severity: Alert['severity'],
    message: string,
    context?: any
  ): Promise<Alert> {
    const alert: Alert = {
      id: this.generateAlertId(),
      type,
      severity,
      message,
      context,
      timestamp: new Date(),
      resolved: false
    }

    this.alerts.push(alert)
    await this.sendAlert(alert)

    return alert
  }

  async checkPerformanceAlerts() {
    const errorRate = performanceMonitor.getErrorRate()
    const avgResponseTime = performanceMonitor.getAverageResponseTime()
    const systemHealth = performanceMonitor.getSystemHealth()

    // Проверяем error rate
    if (errorRate > this.config.threshold.errorRate) {
      await this.createAlert(
        'performance',
        errorRate > 20 ? 'critical' : 'high',
        `High error rate detected: ${errorRate.toFixed(2)}%`,
        { errorRate, threshold: this.config.threshold.errorRate }
      )
    }

    // Проверяем response time
    if (avgResponseTime > this.config.threshold.responseTime) {
      await this.createAlert(
        'performance',
        avgResponseTime > 5000 ? 'critical' : 'high',
        `Slow response time detected: ${avgResponseTime.toFixed(2)}ms`,
        { responseTime: avgResponseTime, threshold: this.config.threshold.responseTime }
      )
    }

    // Проверяем system health
    if (systemHealth === 'critical') {
      await this.createAlert(
        'system',
        'critical',
        'System health is critical',
        { systemHealth }
      )
    }
  }

  async checkMemoryAlerts() {
    const memUsage = process.memoryUsage()
    const memoryPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100

    if (memoryPercentage > this.config.threshold.memoryUsage) {
      await this.createAlert(
        'system',
        memoryPercentage > 95 ? 'critical' : 'high',
        `High memory usage detected: ${memoryPercentage.toFixed(2)}%`,
        { 
          memoryPercentage, 
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          threshold: this.config.threshold.memoryUsage
        }
      )
    }
  }

  async checkDatabaseAlerts() {
    // TODO: Implement database monitoring
    // Check connection pool, slow queries, etc.
  }

  async checkSecurityAlerts() {
    // TODO: Implement security monitoring
    // Check for suspicious activities, failed logins, etc.
  }

  getAlerts(severity?: Alert['severity'], resolved?: boolean): Alert[] {
    let filtered = this.alerts

    if (severity) {
      filtered = filtered.filter(a => a.severity === severity)
    }

    if (resolved !== undefined) {
      filtered = filtered.filter(a => a.resolved === resolved)
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  async resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      await logger.info(`Alert resolved: ${alert.message}`, { alertId })
    }
  }

  async runHealthChecks() {
    await this.checkPerformanceAlerts()
    await this.checkMemoryAlerts()
    await this.checkDatabaseAlerts()
    await this.checkSecurityAlerts()
  }
}

export const alertManager = new AlertManager()

// Запускаем проверки каждые 5 минут
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    alertManager.runHealthChecks()
  }, 5 * 60 * 1000)
}

// Утилиты для быстрого создания алертов
export const createErrorAlert = (message: string, context?: any) =>
  alertManager.createAlert('error', 'high', message, context)

export const createPerformanceAlert = (message: string, context?: any) =>
  alertManager.createAlert('performance', 'medium', message, context)

export const createSecurityAlert = (message: string, context?: any) =>
  alertManager.createAlert('security', 'high', message, context)

export const createSystemAlert = (message: string, context?: any) =>
  alertManager.createAlert('system', 'medium', message, context)
