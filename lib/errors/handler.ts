/**
 * Global Error Handler
 * Centralized error handling utility for the FlowPilot CMS
 */

import React from 'react'

import { 
  AppError, 
  ErrorCode, 
  ErrorSeverity, 
  ErrorFactory,
  isAppError,
  isRetryableError,
  isRecoverableError,
  ErrorContext
} from './types'

interface ToastFunction {
  (toast: {
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    description?: string
    duration?: number
  }): void
}

interface ErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  reportError?: boolean
  context?: ErrorContext
}

interface RetryOptions {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

/**
 * Global Error Handler Class
 */
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler
  private toastFunction?: ToastFunction
  private retryAttempts = new Map<string, number>()

  private constructor() {}

  public static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler()
    }
    return GlobalErrorHandler.instance
  }

  /**
   * Initialize the error handler with dependencies
   */
  public initialize(toastFunction: ToastFunction) {
    this.toastFunction = toastFunction
  }

  /**
   * Handle any error and provide appropriate user feedback
   */
  public handleError(
    error: unknown,
    options: ErrorHandlerOptions = {}
  ): AppError {
    const { showToast = true, logError = true, context } = options

    // Convert unknown error to AppError
    const appError = this.normalizeError(error, context)

    // Log error for debugging
    if (logError) {
      this.logError(appError)
    }

    // Show user notification
    if (showToast && this.toastFunction) {
      this.showErrorToast(appError)
    }

    return appError
  }

  /**
   * Handle API errors with specific context
   */
  public handleAPIError(
    error: unknown,
    operation: string,
    context?: ErrorContext
  ): AppError {
    const enhancedContext: ErrorContext = {
      ...context,
      operation,
      timestamp: new Date().toISOString()
    }

    if (error instanceof Response) {
      return this.handleHTTPError(error, enhancedContext)
    }

    return this.handleError(error, { context: enhancedContext })
  }

  /**
   * Handle HTTP Response errors
   */
  private async handleHTTPError(response: Response, context?: ErrorContext): Promise<AppError> {
    const status = response.status
    let message = `HTTP ${status} error`
    let userMessage = 'An error occurred while communicating with the server.'

    try {
      const errorData = await response.json()
      message = errorData.message || message
    } catch {
      // Ignore JSON parsing errors
    }

    // Map HTTP status codes to appropriate errors
    switch (status) {
      case 401:
        return ErrorFactory.authentication(message, 'Please check your API key and try again.', context)
      case 403:
        return ErrorFactory.authentication(message, 'You do not have permission to perform this action.', context)
      case 404:
        return ErrorFactory.generic(message, 'The requested resource was not found.', undefined, context)
      case 429:
        const retryAfter = response.headers.get('retry-after')
        return new (await import('./types')).RateLimitError(retryAfter ? parseInt(retryAfter) : undefined, context)
      case 500:
      case 502:
      case 503:
      case 504:
        return ErrorFactory.webflowAPI(message, status, undefined, context)
      default:
        return ErrorFactory.generic(message, userMessage, undefined, context)
    }
  }

  /**
   * Convert unknown error to AppError
   */
  private normalizeError(error: unknown, context?: ErrorContext): AppError {
    if (isAppError(error)) {
      return error
    }

    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return ErrorFactory.network(error.message, error, context)
      }

      if (error.message.includes('unauthorized') || error.message.includes('auth')) {
        return ErrorFactory.authentication(error.message, undefined, context)
      }

      return ErrorFactory.generic(error.message, undefined, error, context)
    }

    if (typeof error === 'string') {
      return ErrorFactory.generic(error, undefined, undefined, context)
    }

    return ErrorFactory.generic(
      'An unknown error occurred',
      'Something went wrong. Please try again.',
      undefined,
      context
    )
  }

  /**
   * Show appropriate toast notification for error
   */
  private showErrorToast(error: AppError): void {
    if (!this.toastFunction) return

    const getToastConfig = (error: AppError) => {
      switch (error.severity) {
        case ErrorSeverity.CRITICAL:
          return {
            type: 'error' as const,
            title: 'Critical Error',
            description: error.userMessage,
            duration: 0 // Don't auto-dismiss critical errors
          }
        case ErrorSeverity.HIGH:
          return {
            type: 'error' as const,
            title: 'Error',
            description: error.userMessage,
            duration: 8000
          }
        case ErrorSeverity.MEDIUM:
          return {
            type: 'warning' as const,
            title: 'Warning',
            description: error.userMessage,
            duration: 6000
          }
        case ErrorSeverity.LOW:
          return {
            type: 'info' as const,
            title: 'Notice',
            description: error.userMessage,
            duration: 4000
          }
        default:
          return {
            type: 'error' as const,
            title: 'Error',
            description: error.userMessage,
            duration: 5000
          }
      }
    }

    this.toastFunction(getToastConfig(error))
  }

  /**
   * Log error for debugging
   */
  private logError(error: AppError): void {
    const logData = {
      error: error.toJSON(),
      userAgent: navigator?.userAgent,
      url: window?.location?.href,
      timestamp: new Date().toISOString()
    }

    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      console.error('FlowPilot Error:', logData)
    } else {
      console.warn('FlowPilot Warning:', logData)
    }
  }

  /**
   * Retry mechanism for retryable operations
   */
  public async withRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2
    } = options

    const currentAttempts = this.retryAttempts.get(operationId) || 0

    try {
      const result = await operation()
      // Clear retry count on success
      this.retryAttempts.delete(operationId)
      return result
    } catch (error) {
      const appError = this.normalizeError(error)

      // Don't retry if error is not retryable or max attempts reached
      if (!isRetryableError(appError) || currentAttempts >= maxAttempts - 1) {
        this.retryAttempts.delete(operationId)
        throw appError
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, currentAttempts),
        maxDelay
      )

      // Update retry count
      this.retryAttempts.set(operationId, currentAttempts + 1)

      // Show retry notification
      if (this.toastFunction) {
        this.toastFunction({
          type: 'info',
          title: 'Retrying...',
          description: `Attempt ${currentAttempts + 2} of ${maxAttempts}`,
          duration: delay
        })
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay))

      // Recursive retry
      return this.withRetry(operation, operationId, options)
    }
  }

  /**
   * Create error context for operations
   */
  public createContext(data: Partial<ErrorContext> = {}): ErrorContext {
    return {
      timestamp: new Date().toISOString(),
      userAgent: navigator?.userAgent,
      url: window?.location?.href,
      ...data
    }
  }

  /**
   * Check if error is recoverable and provide recovery options
   */
  public getRecoveryOptions(error: AppError): Array<{
    label: string
    action: () => void
    primary?: boolean
  }> {
    const options: Array<{ label: string; action: () => void; primary?: boolean }> = []

    if (isRetryableError(error)) {
      options.push({
        label: 'Try Again',
        action: () => window.location.reload(),
        primary: true
      })
    }

    if (error.code === ErrorCode.INVALID_API_KEY) {
      options.push({
        label: 'Update API Key',
        action: () => {
          // Navigate to settings
          window.location.href = '/onboarding'
        },
        primary: true
      })
    }

    if (error.code === ErrorCode.NETWORK_ERROR) {
      options.push({
        label: 'Check Connection',
        action: () => {
          if ('onLine' in navigator) {
            if (navigator.onLine) {
              window.location.reload()
            } else {
              alert('Please check your internet connection and try again.')
            }
          }
        }
      })
    }

    // Always provide refresh option
    if (options.length === 0 && isRecoverableError(error)) {
      options.push({
        label: 'Refresh Page',
        action: () => window.location.reload()
      })
    }

    return options
  }
}

/**
 * Convenience functions for common error handling patterns
 */
export const errorHandler = GlobalErrorHandler.getInstance()

export function handleAsyncError<T>(
  promise: Promise<T>,
  context?: ErrorContext
): Promise<T> {
  return promise.catch(error => {
    throw errorHandler.handleError(error, { context })
  })
}

export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: ErrorContext
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      throw errorHandler.handleError(error, { context })
    }
  }
}

export function createErrorBoundary(fallback: React.ComponentType<{ error: AppError }>) {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { error: AppError | null }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props)
      this.state = { error: null }
    }

    static getDerivedStateFromError(error: Error) {
      return { 
        error: errorHandler.handleError(error, { showToast: false })
      }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      const context = errorHandler.createContext({
        additionalData: { 
          errorInfo,
          componentStack: errorInfo.componentStack 
        }
      })

      errorHandler.handleError(error, { 
        context,
        showToast: true,
        logError: true 
      })
    }

    render() {
      if (this.state.error) {
        return React.createElement(fallback, { error: this.state.error })
      }

      return this.props.children
    }
  }
}