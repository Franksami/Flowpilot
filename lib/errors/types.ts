/**
 * Comprehensive Error Types and Classes
 * Defines specific error types for different scenarios in the FlowPilot CMS
 */

export enum ErrorCode {
  // Authentication & Authorization Errors
  INVALID_API_KEY = 'INVALID_API_KEY',
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  FORBIDDEN = 'FORBIDDEN',

  // Network & Connection Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Webflow API Specific Errors
  WEBFLOW_API_ERROR = 'WEBFLOW_API_ERROR',
  COLLECTION_NOT_FOUND = 'COLLECTION_NOT_FOUND',
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  INVALID_COLLECTION_ID = 'INVALID_COLLECTION_ID',
  INVALID_ITEM_DATA = 'INVALID_ITEM_DATA',

  // CRUD Operation Errors
  CREATE_FAILED = 'CREATE_FAILED',
  UPDATE_FAILED = 'UPDATE_FAILED',
  DELETE_FAILED = 'DELETE_FAILED',
  FETCH_FAILED = 'FETCH_FAILED',

  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_DATA_FORMAT = 'INVALID_DATA_FORMAT',

  // Application State Errors
  STATE_CORRUPTION = 'STATE_CORRUPTION',
  OPTIMISTIC_UPDATE_FAILED = 'OPTIMISTIC_UPDATE_FAILED',
  PAGINATION_ERROR = 'PAGINATION_ERROR',

  // Generic Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  userId?: string
  sessionId?: string
  collectionId?: string
  itemId?: string
  operation?: string
  timestamp: string
  userAgent?: string
  url?: string
  additionalData?: Record<string, unknown>
}

export interface ErrorDetails {
  code: ErrorCode
  message: string
  userMessage: string
  severity: ErrorSeverity
  recoverable: boolean
  retryable: boolean
  context?: ErrorContext
  originalError?: Error
  stack?: string
}

/**
 * Base Application Error Class
 */
export abstract class AppError extends Error {
  public readonly code: ErrorCode
  public readonly userMessage: string
  public readonly severity: ErrorSeverity
  public readonly recoverable: boolean
  public readonly retryable: boolean
  public readonly context?: ErrorContext
  public readonly originalError?: Error
  public readonly timestamp: string

  constructor(details: ErrorDetails) {
    super(details.message)
    this.name = this.constructor.name
    this.code = details.code
    this.userMessage = details.userMessage
    this.severity = details.severity
    this.recoverable = details.recoverable
    this.retryable = details.retryable
    this.context = details.context
    this.originalError = details.originalError
    this.timestamp = new Date().toISOString()

    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  public toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      severity: this.severity,
      recoverable: this.recoverable,
      retryable: this.retryable,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    }
  }
}

/**
 * Authentication & Authorization Errors
 */
export class AuthenticationError extends AppError {
  constructor(message: string, userMessage?: string, context?: ErrorContext) {
    super({
      code: ErrorCode.UNAUTHORIZED,
      message,
      userMessage: userMessage || 'Authentication failed. Please check your API key.',
      severity: ErrorSeverity.HIGH,
      recoverable: true,
      retryable: false,
      context
    })
  }
}

export class APIKeyError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super({
      code: ErrorCode.INVALID_API_KEY,
      message,
      userMessage: 'Invalid API key. Please check your Webflow API key in settings.',
      severity: ErrorSeverity.HIGH,
      recoverable: true,
      retryable: false,
      context
    })
  }
}

/**
 * Network & Connection Errors
 */
export class NetworkError extends AppError {
  constructor(message: string, originalError?: Error, context?: ErrorContext) {
    super({
      code: ErrorCode.NETWORK_ERROR,
      message,
      userMessage: 'Network connection failed. Please check your internet connection and try again.',
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      retryable: true,
      context,
      originalError
    })
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number, context?: ErrorContext) {
    const retryMessage = retryAfter 
      ? `Please wait ${retryAfter} seconds before trying again.`
      : 'Please wait a moment before trying again.'

    super({
      code: ErrorCode.RATE_LIMITED,
      message: `Rate limit exceeded. Retry after ${retryAfter || 'unknown'} seconds.`,
      userMessage: `Too many requests. ${retryMessage}`,
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      retryable: true,
      context: {
        ...context,
        additionalData: { retryAfter }
      }
    })
  }
}

/**
 * Webflow API Specific Errors
 */
export class WebflowAPIError extends AppError {
  constructor(message: string, statusCode?: number, originalError?: Error, context?: ErrorContext) {
    super({
      code: ErrorCode.WEBFLOW_API_ERROR,
      message,
      userMessage: 'Webflow API error occurred. Please try again or contact support.',
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      retryable: statusCode ? statusCode >= 500 : false,
      context: {
        ...context,
        additionalData: { statusCode }
      },
      originalError
    })
  }
}

export class CollectionNotFoundError extends AppError {
  constructor(collectionId: string, context?: ErrorContext) {
    super({
      code: ErrorCode.COLLECTION_NOT_FOUND,
      message: `Collection with ID ${collectionId} not found`,
      userMessage: 'The requested collection could not be found. It may have been deleted or you may not have access to it.',
      severity: ErrorSeverity.MEDIUM,
      recoverable: false,
      retryable: false,
      context: {
        ...context,
        collectionId
      }
    })
  }
}

export class ItemNotFoundError extends AppError {
  constructor(itemId: string, context?: ErrorContext) {
    super({
      code: ErrorCode.ITEM_NOT_FOUND,
      message: `Item with ID ${itemId} not found`,
      userMessage: 'The requested item could not be found. It may have been deleted.',
      severity: ErrorSeverity.LOW,
      recoverable: false,
      retryable: false,
      context: {
        ...context,
        itemId
      }
    })
  }
}

/**
 * CRUD Operation Errors
 */
export class CRUDError extends AppError {
  constructor(
    operation: 'create' | 'read' | 'update' | 'delete',
    message: string,
    originalError?: Error,
    context?: ErrorContext
  ) {
    const codeMap = {
      create: ErrorCode.CREATE_FAILED,
      read: ErrorCode.FETCH_FAILED,
      update: ErrorCode.UPDATE_FAILED,
      delete: ErrorCode.DELETE_FAILED
    }

    const userMessageMap = {
      create: 'Failed to create the item. Please try again.',
      read: 'Failed to load data. Please refresh the page.',
      update: 'Failed to update the item. Please try again.',
      delete: 'Failed to delete the item. Please try again.'
    }

    super({
      code: codeMap[operation],
      message,
      userMessage: userMessageMap[operation],
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      retryable: true,
      context: {
        ...context,
        operation
      },
      originalError
    })
  }
}

/**
 * Validation Errors
 */
export class ValidationError extends AppError {
  constructor(message: string, fieldName?: string, context?: ErrorContext) {
    super({
      code: ErrorCode.VALIDATION_ERROR,
      message,
      userMessage: fieldName 
        ? `Invalid value for ${fieldName}. ${message}`
        : `Validation failed: ${message}`,
      severity: ErrorSeverity.LOW,
      recoverable: true,
      retryable: false,
      context: {
        ...context,
        additionalData: { fieldName }
      }
    })
  }
}

/**
 * Application State Errors
 */
export class OptimisticUpdateError extends AppError {
  constructor(operation: string, originalError?: Error, context?: ErrorContext) {
    super({
      code: ErrorCode.OPTIMISTIC_UPDATE_FAILED,
      message: `Optimistic ${operation} operation failed and was rolled back`,
      userMessage: `${operation} operation failed. Changes have been reverted.`,
      severity: ErrorSeverity.LOW,
      recoverable: true,
      retryable: true,
      context: {
        ...context,
        operation
      },
      originalError
    })
  }
}

/**
 * Generic Application Error
 */
export class GenericError extends AppError {
  constructor(message: string, userMessage?: string, originalError?: Error, context?: ErrorContext) {
    super({
      code: ErrorCode.UNKNOWN_ERROR,
      message,
      userMessage: userMessage || 'An unexpected error occurred. Please try again.',
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      retryable: true,
      context,
      originalError
    })
  }
}

/**
 * Type Guards
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function isRetryableError(error: unknown): boolean {
  return isAppError(error) && error.retryable
}

export function isRecoverableError(error: unknown): boolean {
  return isAppError(error) && error.recoverable
}

/**
 * Error Factory Functions
 */
export const ErrorFactory = {
  network: (message: string, originalError?: Error, context?: ErrorContext) =>
    new NetworkError(message, originalError, context),

  authentication: (message: string, userMessage?: string, context?: ErrorContext) =>
    new AuthenticationError(message, userMessage, context),

  apiKey: (message: string, context?: ErrorContext) =>
    new APIKeyError(message, context),

  webflowAPI: (message: string, statusCode?: number, originalError?: Error, context?: ErrorContext) =>
    new WebflowAPIError(message, statusCode, originalError, context),

  crud: (operation: 'create' | 'read' | 'update' | 'delete', message: string, originalError?: Error, context?: ErrorContext) =>
    new CRUDError(operation, message, originalError, context),

  validation: (message: string, fieldName?: string, context?: ErrorContext) =>
    new ValidationError(message, fieldName, context),

  optimisticUpdate: (operation: string, originalError?: Error, context?: ErrorContext) =>
    new OptimisticUpdateError(operation, originalError, context),

  generic: (message: string, userMessage?: string, originalError?: Error, context?: ErrorContext) =>
    new GenericError(message, userMessage, originalError, context)
}