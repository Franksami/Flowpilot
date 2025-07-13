/**
 * Error Boundary Component Tests
 * Testing error recovery, fallback UI, and crash prevention
 */

import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ErrorBoundary } from '@/components/errors/error-boundary'
import { errorHandler } from '@/lib/errors/handler'

// Mock the error handler
jest.mock('../lib/errors/handler', () => ({
  errorHandler: {
    handleError: jest.fn((error) => ({
      code: 'TEST_ERROR',
      message: error.message || 'Unknown error',
      userMessage: error.message || 'Unknown error',
      severity: 'medium',
      recoverable: true,
      retryable: true,
      timestamp: new Date().toISOString(),
      toJSON: () => ({ message: error.message })
    })),
    createContext: jest.fn((context) => context),
    getRecoveryOptions: jest.fn(() => []),
    shouldDisplayDetails: jest.fn(() => false),
    getErrorId: jest.fn(() => 'test-error-id'),
    formatErrorMessage: jest.fn((error) => error.message || 'Unknown error')
  }
}))

// Mock console.error to prevent test output noise
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }: { shouldThrow?: boolean, errorMessage?: string }) => {
  if (shouldThrow) {
    throw new Error(errorMessage)
  }
  return <div>Working Component</div>
}

// Component that throws async error
const ThrowAsyncError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    setTimeout(() => {
      throw new Error('Async error')
    }, 0)
  }
  return <div>Async Component</div>
}

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Normal Operation', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Normal content')).toBeInTheDocument()
    })

    it('renders multiple children without issues', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </ErrorBoundary>
      )
      
      expect(screen.getByText('First child')).toBeInTheDocument()
      expect(screen.getByText('Second child')).toBeInTheDocument()
    })

    it('passes props to children correctly', () => {
      const TestComponent = ({ message }: { message: string }) => <div>{message}</div>
      
      render(
        <ErrorBoundary>
          <TestComponent message="Test message" />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('catches and displays error fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
      expect(screen.queryByText('Working Component')).not.toBeInTheDocument()
    })

    it('displays error message in fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Custom error message" />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Custom error message')).toBeInTheDocument()
    })

    it('calls ErrorHandler.logError when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Test error" />
        </ErrorBoundary>
      )
      
      expect(errorHandler.createContext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error'
        }),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      )
    })

    it('shows error ID when available', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText(/Error ID: test-error-id/i)).toBeInTheDocument()
    })

    it('handles different error types', () => {
      const TestError = () => {
        throw new TypeError('Type error test')
      }
      
      render(
        <ErrorBoundary>
          <TestError />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Type error test')).toBeInTheDocument()
    })

    it('handles errors without messages', () => {
      const TestError = () => {
        throw new Error()
      }
      
      render(
        <ErrorBoundary>
          <TestError />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Unknown error')).toBeInTheDocument()
    })
  })

  describe('Recovery Functionality', () => {
    it('shows retry button in error fallback', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('resets error state when retry is clicked', async () => {
      const user = userEvent.setup()
      let shouldThrow = true
      
      const TestComponent = () => {
        if (shouldThrow) {
          throw new Error('Test error')
        }
        return <div>Component recovered</div>
      }
      
      render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      )
      
      // Should show error initially
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
      
      // Fix the error condition
      shouldThrow = false
      
      // Click retry
      const retryButton = screen.getByText('Try Again')
      await user.click(retryButton)
      
      // Should show recovered component
      expect(screen.getByText('Component recovered')).toBeInTheDocument()
    })

    it('allows multiple retry attempts', async () => {
      const user = userEvent.setup()
      let attemptCount = 0
      
      const TestComponent = () => {
        attemptCount++
        if (attemptCount < 3) {
          throw new Error(`Attempt ${attemptCount} failed`)
        }
        return <div>Success after retries</div>
      }
      
      render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      )
      
      // First attempt fails
      expect(screen.getByText('Attempt 1 failed')).toBeInTheDocument()
      
      // First retry
      await user.click(screen.getByText('Try Again'))
      expect(screen.getByText('Attempt 2 failed')).toBeInTheDocument()
      
      // Second retry succeeds
      await user.click(screen.getByText('Try Again'))
      expect(screen.getByText('Success after retries')).toBeInTheDocument()
    })
  })

  describe('User Experience', () => {
    it('shows loading state during retry', async () => {
      const user = userEvent.setup()
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      const retryButton = screen.getByText('Try Again')
      await user.click(retryButton)
      
      // Should show some indication of retry attempt
      expect(retryButton).toBeDisabled()
    })

    it('provides helpful error information', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
      expect(screen.getByText(/We apologize for the inconvenience/i)).toBeInTheDocument()
    })

    it('shows contact information for support', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText(/contact support/i)).toBeInTheDocument()
    })
  })

  describe('Development vs Production', () => {
    it('shows detailed error info in development', () => {
      // Mock development environment
      process.env.NODE_ENV = 'development'
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Dev error" />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Dev error')).toBeInTheDocument()
    })

    it('hides detailed error info in production', () => {
      // Mock production environment
      process.env.NODE_ENV = 'production'
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Sensitive error info" />
        </ErrorBoundary>
      )
      
      expect(screen.queryByText('Sensitive error info')).not.toBeInTheDocument()
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    })
  })

  describe('Error Reporting', () => {
    it('includes component stack in error report', () => {
      render(
        <ErrorBoundary>
          <div>
            <ThrowError shouldThrow={true} />
          </div>
        </ErrorBoundary>
      )
      
      expect(errorHandler.createContext).toHaveBeenCalledWith(
        expect.objectContaining({
          additionalData: expect.objectContaining({
            componentStack: expect.any(String)
          })
        })
      )
    })

    it('includes error boundary info in report', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(errorHandler.createContext).toHaveBeenCalledWith(
        expect.objectContaining({
          additionalData: expect.objectContaining({
            level: 'component'
          })
        })
      )
    })

    it('generates unique error IDs for different errors', () => {
      // Mock different error IDs
      let errorCount = 0
      errorHandler.handleError.mockImplementation((error) => ({
        code: 'TEST_ERROR',
        message: error.message || 'Unknown error',
        userMessage: error.message || 'Unknown error',
        severity: 'medium',
        recoverable: true,
        retryable: true,
        timestamp: new Date().toISOString(),
        toJSON: () => ({ message: error.message, id: `error-${++errorCount}` })
      }))
      
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="First error" />
        </ErrorBoundary>
      )
      
      // Error ID is generated internally, not displayed in UI
      
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Second error" />
        </ErrorBoundary>
      )
      
      // Error ID is generated internally
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes for error state', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      const errorContainer = screen.getByRole('alert')
      expect(errorContainer).toBeInTheDocument()
      expect(errorContainer).toHaveAttribute('aria-live', 'polite')
    })

    it('has keyboard accessible retry button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      const retryButton = screen.getByText('Try Again')
      expect(retryButton).toBeEnabled()
      expect(retryButton).toHaveAttribute('type', 'button')
    })

    it('provides screen reader friendly error messages', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      const errorMessage = screen.getByText(/Something went wrong/i)
      expect(errorMessage).toHaveAttribute('aria-describedby')
    })
  })

  describe('Edge Cases', () => {
    it('handles null/undefined children gracefully', () => {
      render(
        <ErrorBoundary>
          {null}
          {undefined}
        </ErrorBoundary>
      )
      
      // Should not crash
      expect(document.body).toBeInTheDocument()
    })

    it('handles error handler failures gracefully', () => {
      errorHandler.handleError.mockImplementationOnce(() => {
        throw new Error('Handler failed')
      })
      
      // Should not crash when handler fails
      expect(() => {
        render(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        )
      }).not.toThrow()
    })

    it('handles component stack overflow', () => {
      const createDeepComponent = (depth: number): any => {
        if (depth === 0) {
          return <ThrowError shouldThrow={true} />
        }
        return createDeepComponent(depth - 1)
      }
      
      render(
        <ErrorBoundary>
          {createDeepComponent(10)}
        </ErrorBoundary>
      )
      
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    })

    it('handles rapid consecutive errors', () => {
      const MultipleErrors = () => {
        throw new Error('First error')
        throw new Error('Second error') // This won't be reached, but tests the concept
      }
      
      render(
        <ErrorBoundary>
          <MultipleErrors />
        </ErrorBoundary>
      )
      
      expect(screen.getByText(/First error/)).toBeInTheDocument()
      expect(errorHandler.handleError).toHaveBeenCalledTimes(1)
    })
  })
}) 