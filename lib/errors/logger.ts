/**
 * Error Logging and Reporting Service
 * Centralized logging for debugging and monitoring
 */

import type { AppError, ErrorSeverity } from './types'

interface LogEntry {
  id: string
  timestamp: string
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  error?: AppError
  context?: Record<string, unknown>
  stack?: string
  userAgent?: string
  url?: string
  userId?: string
  sessionId?: string
}

interface ErrorReportingConfig {
  enabled: boolean
  maxLocalLogs: number
  reportToConsole: boolean
  reportToRemote: boolean
  remoteEndpoint?: string
  sensitiveFields: string[]
}

/**
 * Error Logger Class
 */
export class ErrorLogger {
  private static instance: ErrorLogger
  private logs: LogEntry[] = []
  private config: ErrorReportingConfig = {
    enabled: true,
    maxLocalLogs: 100,
    reportToConsole: true,
    reportToRemote: false,
    sensitiveFields: ['apiKey', 'password', 'token', 'secret'],
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      // Initialize session ID
      this.sessionId = this.generateSessionId()

      // Load configuration from environment or localStorage
      this.loadConfig()

      // Set up error event listeners
      this.setupGlobalErrorHandlers()
    }
  }

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  private sessionId?: string

  /**
   * Configure the logger
   */
  public configure(config: Partial<ErrorReportingConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Log an error
   */
  public logError(error: AppError, context?: Record<string, unknown>): void {
    if (!this.config.enabled) return

    const logEntry = this.createLogEntry('error', error.message, error, context)
    this.addLog(logEntry)

    if (this.config.reportToConsole) {
      this.logToConsole(logEntry)
    }

    if (this.config.reportToRemote) {
      this.reportToRemote(logEntry)
    }
  }

  /**
   * Log a warning
   */
  public logWarning(message: string, context?: Record<string, unknown>): void {
    if (!this.config.enabled) return

    const logEntry = this.createLogEntry('warn', message, undefined, context)
    this.addLog(logEntry)

    if (this.config.reportToConsole) {
      this.logToConsole(logEntry)
    }
  }

  /**
   * Log info message
   */
  public logInfo(message: string, context?: Record<string, unknown>): void {
    if (!this.config.enabled) return

    const logEntry = this.createLogEntry('info', message, undefined, context)
    this.addLog(logEntry)

    if (this.config.reportToConsole) {
      this.logToConsole(logEntry)
    }
  }

  /**
   * Log debug message (only in development)
   */
  public logDebug(message: string, context?: Record<string, unknown>): void {
    if (!this.config.enabled || process.env.NODE_ENV !== 'development') return

    const logEntry = this.createLogEntry('debug', message, undefined, context)
    this.addLog(logEntry)

    if (this.config.reportToConsole) {
      this.logToConsole(logEntry)
    }
  }

  /**
   * Get recent logs
   */
  public getRecentLogs(count = 50): LogEntry[] {
    return this.logs.slice(-count)
  }

  /**
   * Get logs by level
   */
  public getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter((log) => log.level === level)
  }

  /**
   * Clear logs
   */
  public clearLogs(): void {
    this.logs = []
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('flowpilot_error_logs')
    }
  }

  /**
   * Export logs for debugging
   */
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * Create a log entry
   */
  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    error?: AppError,
    context?: Record<string, unknown>
  ): LogEntry {
    return {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      error: error ? this.sanitizeError(error) : undefined,
      context: context ? this.sanitizeContext(context) : undefined,
      stack: error?.stack,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      sessionId: this.sessionId,
    }
  }

  /**
   * Add log entry and manage storage
   */
  private addLog(logEntry: LogEntry): void {
    this.logs.push(logEntry)

    // Trim logs if exceeded max count
    if (this.logs.length > this.config.maxLocalLogs) {
      this.logs = this.logs.slice(-this.config.maxLocalLogs)
    }

    // Persist to localStorage for debugging
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('flowpilot_error_logs', JSON.stringify(this.logs.slice(-20)))
      } catch {
        // Ignore localStorage errors
      }
    }
  }

  /**
   * Log to console with proper formatting
   */
  private logToConsole(logEntry: LogEntry): void {
    const prefix = `[FlowPilot ${logEntry.level.toUpperCase()}]`

    switch (logEntry.level) {
      case 'error':
        console.error(`${prefix} ${logEntry.message}`, {
          error: logEntry.error,
          context: logEntry.context,
          timestamp: logEntry.timestamp,
        })
        break
      case 'warn':
        console.warn(`${prefix} ${logEntry.message}`, {
          context: logEntry.context,
          timestamp: logEntry.timestamp,
        })
        break
      case 'info':
        console.info(`${prefix} ${logEntry.message}`, {
          context: logEntry.context,
          timestamp: logEntry.timestamp,
        })
        break
      case 'debug':
        console.debug(`${prefix} ${logEntry.message}`, {
          context: logEntry.context,
          timestamp: logEntry.timestamp,
        })
        break
    }
  }

  /**
   * Get console styling for different log levels
   */
  private getConsoleStyle(level: LogEntry['level']): string {
    switch (level) {
      case 'error':
        return 'color: #dc2626; font-weight: bold;'
      case 'warn':
        return 'color: #d97706; font-weight: bold;'
      case 'info':
        return 'color: #2563eb;'
      case 'debug':
        return 'color: #6b7280;'
      default:
        return ''
    }
  }

  /**
   * Report to remote logging service (if configured)
   */
  private async reportToRemote(logEntry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      })
    } catch {
      // Ignore remote logging errors to prevent infinite loops
    }
  }

  /**
   * Remove sensitive data from error objects
   */
  private sanitizeError(error: AppError): Partial<AppError> {
    const sanitized = { ...error.toJSON() }

    // Remove sensitive data from context
    if (sanitized.context?.additionalData) {
      sanitized.context.additionalData = this.sanitizeContext(sanitized.context.additionalData)
    }

    return sanitized
  }

  /**
   * Remove sensitive data from context objects
   */
  private sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...context }

    // Remove sensitive fields
    this.config.sensitiveFields.forEach((field) => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    })

    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach((key) => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeContext(sanitized[key] as Record<string, unknown>)
      }
    })

    return sanitized
  }

  /**
   * Load configuration from environment or localStorage
   */
  private loadConfig(): void {
    // Load from environment variables if available
    if (typeof process !== 'undefined' && process.env) {
      this.config.enabled = process.env.NEXT_PUBLIC_ERROR_LOGGING_ENABLED !== 'false'
      this.config.reportToRemote = process.env.NEXT_PUBLIC_ERROR_REPORTING_ENABLED === 'true'
      this.config.remoteEndpoint = process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT
    }

    // Load from localStorage for user preferences
    if (typeof localStorage !== 'undefined') {
      try {
        const storedConfig = localStorage.getItem('flowpilot_error_config')
        if (storedConfig) {
          const userConfig = JSON.parse(storedConfig)
          this.config = { ...this.config, ...userConfig }
        }
      } catch {
        // Ignore localStorage errors
      }
    }
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        {
          code: 'UNHANDLED_PROMISE_REJECTION',
          message: event.reason?.message || 'Unhandled promise rejection',
          userMessage: 'An unexpected error occurred',
          severity: 'high' as ErrorSeverity,
          recoverable: false,
          retryable: false,
          timestamp: new Date().toISOString(),
        } as AppError,
        {
          type: 'unhandledrejection',
          reason: event.reason,
        }
      )
    })

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError(
        {
          code: 'JAVASCRIPT_ERROR',
          message: event.message,
          userMessage: 'A JavaScript error occurred',
          severity: 'medium' as ErrorSeverity,
          recoverable: true,
          retryable: false,
          timestamp: new Date().toISOString(),
          stack: event.error?.stack,
        } as AppError,
        {
          type: 'javascript',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      )
    })
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * Generate unique log entry ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

/**
 * Export singleton instance
 */
export const errorLogger = ErrorLogger.getInstance()

/**
 * Convenience functions
 */
export const logError = (error: AppError, context?: Record<string, unknown>) =>
  errorLogger.logError(error, context)

export const logWarning = (message: string, context?: Record<string, unknown>) =>
  errorLogger.logWarning(message, context)

export const logInfo = (message: string, context?: Record<string, unknown>) =>
  errorLogger.logInfo(message, context)

export const logDebug = (message: string, context?: Record<string, unknown>) =>
  errorLogger.logDebug(message, context)
