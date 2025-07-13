/**
 * Server-Side Error Handler
 * Specialized error handling for Server Actions and API routes
 */

import { z } from 'zod'

import { 
  AppError, 
  ErrorCode, 
  ErrorFactory, 
  isAppError,
  ErrorContext 
} from './types'

/**
 * Server Action Response Type
 */
export interface ServerActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: ErrorCode
    message: string
    userMessage: string
    retryable: boolean
    context?: ErrorContext
  }
}

/**
 * Server-side error handler for Server Actions
 */
export class ServerErrorHandler {
  /**
   * Handle Server Action errors and return standardized response
   */
  public static handleServerError<T>(
    error: unknown,
    operation: string,
    context?: Partial<ErrorContext>
  ): ServerActionResponse<T> {
    const appError = this.normalizeServerError(error, operation, context)

    // Log server errors
    this.logServerError(appError, operation)

    return {
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        userMessage: appError.userMessage,
        retryable: appError.retryable,
        context: appError.context
      }
    }
  }

  /**
   * Wrap Server Action with error handling
   */
  public static withErrorHandling<T extends unknown[], R>(
    action: (...args: T) => Promise<ServerActionResponse<R>>,
    operation: string
  ) {
    return async (...args: T): Promise<ServerActionResponse<R>> => {
      try {
        return await action(...args)
      } catch (error) {
        return this.handleServerError(error, operation)
      }
    }
  }

  /**
   * Handle Zod validation errors
   */
  public static handleValidationError(error: z.ZodError): ServerActionResponse {
    const firstError = error.errors[0]
    const fieldName = firstError.path.join('.')
    
    const validationError = ErrorFactory.validation(
      firstError.message,
      fieldName
    )

    return {
      success: false,
      error: {
        code: validationError.code,
        message: validationError.message,
        userMessage: validationError.userMessage,
        retryable: false
      }
    }
  }

  /**
   * Handle HTTP/Fetch errors from external APIs
   */
  public static async handleHttpError(
    response: Response,
    operation: string,
    context?: Partial<ErrorContext>
  ): Promise<ServerActionResponse> {
    const status = response.status
    let message = `HTTP ${status} error in ${operation}`
    let errorData: any = null

    try {
      errorData = await response.json()
      message = errorData.message || errorData.error || message
    } catch {
      // If can't parse JSON, use status text
      message = response.statusText || message
    }

    const enhancedContext: ErrorContext = {
      ...context,
      operation,
      timestamp: new Date().toISOString(),
      additionalData: {
        status,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries()),
        errorData
      }
    }

    let appError: AppError

    switch (status) {
      case 400:
        appError = ErrorFactory.validation(message, undefined, enhancedContext)
        break
      case 401:
        appError = ErrorFactory.authentication(message, undefined, enhancedContext)
        break
      case 403:
        appError = ErrorFactory.authentication(
          message, 
          'You do not have permission to perform this action.',
          enhancedContext
        )
        break
      case 404:
        appError = ErrorFactory.generic(
          message,
          'The requested resource was not found.',
          undefined,
          enhancedContext
        )
        break
      case 429:
        const retryAfter = response.headers.get('retry-after')
        appError = new (await import('./types')).RateLimitError(
          retryAfter ? parseInt(retryAfter) : undefined,
          enhancedContext
        )
        break
      case 500:
      case 502:
      case 503:
      case 504:
        appError = ErrorFactory.webflowAPI(message, status, undefined, enhancedContext)
        break
      default:
        appError = ErrorFactory.generic(message, undefined, undefined, enhancedContext)
    }

    this.logServerError(appError, operation)

    return {
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        userMessage: appError.userMessage,
        retryable: appError.retryable,
        context: appError.context
      }
    }
  }

  /**
   * Convert unknown error to AppError for server context
   */
  private static normalizeServerError(
    error: unknown,
    operation: string,
    context?: Partial<ErrorContext>
  ): AppError {
    const enhancedContext: ErrorContext = {
      ...context,
      operation,
      timestamp: new Date().toISOString()
    }

    if (isAppError(error)) {
      return error
    }

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return ErrorFactory.validation(
        firstError.message,
        firstError.path.join('.'),
        enhancedContext
      )
    }

    if (error instanceof Error) {
      // Check for specific server-side error patterns
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNRESET')) {
        return ErrorFactory.network(error.message, error, enhancedContext)
      }

      if (error.message.includes('timeout')) {
        return ErrorFactory.network(
          'Request timeout',
          error,
          enhancedContext
        )
      }

      if (error.message.includes('unauthorized') || error.message.includes('auth')) {
        return ErrorFactory.authentication(error.message, undefined, enhancedContext)
      }

      return ErrorFactory.generic(error.message, undefined, error, enhancedContext)
    }

    if (typeof error === 'string') {
      return ErrorFactory.generic(error, undefined, undefined, enhancedContext)
    }

    return ErrorFactory.generic(
      'An unknown server error occurred',
      'Something went wrong on the server. Please try again.',
      undefined,
      enhancedContext
    )
  }

  /**
   * Log server errors with appropriate level
   */
  private static logServerError(error: AppError, operation: string): void {
    const logData = {
      operation,
      error: error.toJSON(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }

    switch (error.severity) {
      case 'critical':
      case 'high':
        console.error(`[FlowPilot Server Error] ${operation}:`, logData)
        break
      case 'medium':
        console.warn(`[FlowPilot Server Warning] ${operation}:`, logData)
        break
      case 'low':
        console.info(`[FlowPilot Server Info] ${operation}:`, logData)
        break
      default:
        console.log(`[FlowPilot Server] ${operation}:`, logData)
    }
  }

  /**
   * Success response helper
   */
  public static success<T>(data: T): ServerActionResponse<T> {
    return {
      success: true,
      data
    }
  }

  /**
   * Create error context for server operations
   */
  public static createServerContext(data: Partial<ErrorContext> = {}): ErrorContext {
    return {
      timestamp: new Date().toISOString(),
      ...data
    }
  }
}

/**
 * Convenience decorators for Server Actions
 */

/**
 * Decorator for Server Actions with automatic error handling
 */
export function withServerErrorHandling<T extends unknown[], R>(
  operation: string
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<ServerActionResponse<R>>>
  ) {
    const method = descriptor.value!

    descriptor.value = async function (...args: T): Promise<ServerActionResponse<R>> {
      try {
        return await method.apply(this, args)
      } catch (error) {
        return ServerErrorHandler.handleServerError(error, operation)
      }
    }

    return descriptor
  }
}

/**
 * Validation helper with error handling
 */
export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): ServerActionResponse<T> {
  try {
    const data = schema.parse(input)
    return ServerErrorHandler.success(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ServerErrorHandler.handleValidationError(error)
    }
    return ServerErrorHandler.handleServerError(error, 'input validation')
  }
}

/**
 * Async operation wrapper with error handling
 */
export async function withAsyncErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: Partial<ErrorContext>
): Promise<ServerActionResponse<T>> {
  try {
    const result = await operation()
    return ServerErrorHandler.success(result)
  } catch (error) {
    return ServerErrorHandler.handleServerError(error, operationName, context)
  }
}