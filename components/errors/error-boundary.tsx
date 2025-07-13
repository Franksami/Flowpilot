/**
 * React Error Boundaries
 * Components for catching and handling JavaScript errors in component trees
 */

'use client'

import { RefreshCw, AlertTriangle, Home, Settings } from 'lucide-react'
import React, { Component, ReactNode } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { errorHandler } from '@/lib/errors/handler'
import type { AppError } from '@/lib/errors/types'

interface ErrorBoundaryState {
  hasError: boolean
  error: AppError | null
  errorId: string | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  level?: 'app' | 'page' | 'component'
  onError?: (error: AppError, errorId: string) => void
}

interface ErrorFallbackProps {
  error: AppError
  resetError: () => void
  level: 'app' | 'page' | 'component'
}

/**
 * Main Error Boundary Component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const appError = errorHandler.handleError(error, { showToast: false })
    const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2)

    return {
      hasError: true,
      error: appError,
      errorId,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const context = errorHandler.createContext({
      additionalData: {
        errorInfo,
        componentStack: errorInfo.componentStack,
        level: this.props.level || 'component',
      },
    })

    const appError = errorHandler.handleError(error, {
      context,
      showToast: true,
      logError: true,
    })

    if (this.props.onError && this.state.errorId) {
      this.props.onError(appError, this.state.errorId)
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback

      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          level={this.props.level || 'component'}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Default Error Fallback Component
 */
function DefaultErrorFallback({ error, resetError, level }: ErrorFallbackProps) {
  const getTitle = () => {
    switch (level) {
      case 'app':
        return 'Application Error'
      case 'page':
        return 'Page Error'
      case 'component':
      default:
        return 'Something went wrong'
    }
  }

  const getDescription = () => {
    switch (level) {
      case 'app':
        return 'The application has encountered an unexpected error.'
      case 'page':
        return 'This page has encountered an error and cannot be displayed.'
      case 'component':
      default:
        return 'A component on this page has encountered an error.'
    }
  }

  const recoveryOptions = errorHandler.getRecoveryOptions(error)

  return (
    <div className='flex min-h-64 items-center justify-center p-6'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
            <AlertTriangle className='h-6 w-6 text-red-600' />
          </div>
          <CardTitle className='text-xl text-red-900'>{getTitle()}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Alert variant='destructive'>
            <AlertDescription>{getDescription()}</AlertDescription>
          </Alert>

          <div className='rounded-md bg-gray-50 p-3 text-sm text-gray-600'>
            <strong>Error:</strong> {error.userMessage}
          </div>

          <div className='flex flex-col gap-2'>
            <Button onClick={resetError} className='w-full'>
              <RefreshCw className='mr-2 h-4 w-4' />
              Try Again
            </Button>

            {recoveryOptions.map((option, index) => (
              <Button
                key={index}
                variant={option.primary ? 'default' : 'outline'}
                onClick={option.action}
                className='w-full'
              >
                {option.label}
              </Button>
            ))}

            {level === 'app' && (
              <Button
                variant='outline'
                onClick={() => (window.location.href = '/')}
                className='w-full'
              >
                <Home className='mr-2 h-4 w-4' />
                Go Home
              </Button>
            )}
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className='mt-4'>
              <summary className='cursor-pointer text-sm text-gray-500 hover:text-gray-700'>
                Error Details (Development)
              </summary>
              <pre className='mt-2 max-h-32 overflow-auto rounded bg-gray-100 p-2 text-xs'>
                {JSON.stringify(error.toJSON(), null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Specialized Error Fallbacks
 */

/**
 * App-level error fallback with full page layout
 */
export function AppErrorFallback({ error, resetError: _resetError }: ErrorFallbackProps) {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 p-4'>
      <Card className='w-full max-w-lg'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
            <AlertTriangle className='h-8 w-8 text-red-600' />
          </div>
          <CardTitle className='text-2xl text-red-900'>Application Error</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <Alert variant='destructive'>
            <AlertDescription className='text-center'>
              FlowPilot has encountered an unexpected error and needs to restart.
            </AlertDescription>
          </Alert>

          <div className='rounded-md bg-gray-50 p-4 text-sm text-gray-600'>
            <strong>Error:</strong> {error.userMessage}
            <br />
            <strong>Error Code:</strong> {error.code}
          </div>

          <div className='flex flex-col gap-3'>
            <Button onClick={() => window.location.reload()} className='w-full'>
              <RefreshCw className='mr-2 h-4 w-4' />
              Reload Application
            </Button>

            <Button
              variant='outline'
              onClick={() => (window.location.href = '/')}
              className='w-full'
            >
              <Home className='mr-2 h-4 w-4' />
              Return to Home
            </Button>

            <Button
              variant='outline'
              onClick={() => (window.location.href = '/onboarding')}
              className='w-full'
            >
              <Settings className='mr-2 h-4 w-4' />
              Check Settings
            </Button>
          </div>

          <div className='text-center text-xs text-gray-500'>
            If this problem persists, please contact support.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Page-level error fallback
 */
export function PageErrorFallback({ error, resetError: _resetError }: ErrorFallbackProps) {
  return (
    <div className='container mx-auto p-6'>
      <Card className='mx-auto max-w-2xl'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100'>
            <AlertTriangle className='h-6 w-6 text-yellow-600' />
          </div>
          <CardTitle className='text-xl text-gray-900'>Page Error</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Alert>
            <AlertDescription>
              This page encountered an error and cannot be displayed properly.
            </AlertDescription>
          </Alert>

          <div className='rounded-md bg-gray-50 p-3 text-sm text-gray-600'>{error.userMessage}</div>

          <div className='flex gap-2'>
            <Button onClick={() => window.location.reload()} className='flex-1'>
              <RefreshCw className='mr-2 h-4 w-4' />
              Try Again
            </Button>

            <Button
              variant='outline'
              onClick={() => (window.location.href = '/')}
              className='flex-1'
            >
              <Home className='mr-2 h-4 w-4' />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Component-level error fallback (minimal)
 */
export function ComponentErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <Alert variant='destructive' className='my-4'>
      <AlertTriangle className='h-4 w-4' />
      <AlertDescription className='flex items-center justify-between'>
        <span>{error.userMessage}</span>
        <Button size='sm' variant='outline' onClick={resetError}>
          <RefreshCw className='mr-1 h-3 w-3' />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Higher-Order Component for wrapping components with error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryConfig?: Partial<ErrorBoundaryProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryConfig}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

/**
 * Hook for error boundary integration (for functional components)
 */
export function useErrorHandler() {
  return {
    handleError: (error: unknown, context?: any) => {
      return errorHandler.handleError(error, { context })
    },
    withRetry: errorHandler.withRetry.bind(errorHandler),
  }
}
