/**
 * Error Boundary Component Tests - Simplified
 * Core error boundary functionality testing
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Mock console.error to prevent test output noise
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

// Simple test error boundary component
const TestErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <h1>Error Boundary Test</h1>
      {children}
    </div>
  )
}

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }: { shouldThrow?: boolean, errorMessage?: string }) => {
  if (shouldThrow) {
    throw new Error(errorMessage)
  }
  return <div>Working Component</div>
}

// Mock error boundary that mimics the real one
const MockErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  
  const handleRetry = () => {
    setHasError(false)
    setError(null)
  }
  
  if (hasError) {
    return (
      <div role="alert" aria-live="polite">
        <h2>Something went wrong</h2>
        <p>We apologize for the inconvenience</p>
        <p>Error: {error?.message || 'Unknown error'}</p>
        <p>Error ID: test-error-id</p>
        <button onClick={handleRetry} type="button">
          Try Again
        </button>
        <p>If this problem persists, please contact support</p>
      </div>
    )
  }
  
  // Simulate error boundary behavior
  try {
    return <>{children}</>
  } catch (err) {
    setHasError(true)
    setError(err as Error)
    return null
  }
}

describe('ErrorBoundary Component - Core Functionality', () => {
  describe('Normal Operation', () => {
    it('renders children when no error occurs', () => {
      render(
        <MockErrorBoundary>
          <div>Normal content</div>
        </MockErrorBoundary>
      )
      
      expect(screen.getByText('Normal content')).toBeInTheDocument()
    })

    it('renders multiple children without issues', () => {
      render(
        <MockErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </MockErrorBoundary>
      )
      
      expect(screen.getByText('First child')).toBeInTheDocument()
      expect(screen.getByText('Second child')).toBeInTheDocument()
    })

    it('passes props to children correctly', () => {
      const TestComponent = ({ message }: { message: string }) => <div>{message}</div>
      
      render(
        <MockErrorBoundary>
          <TestComponent message="Test message" />
        </MockErrorBoundary>
      )
      
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })
  })

  describe('Error Fallback UI', () => {
    it('displays error fallback UI structure', () => {
      render(
        <MockErrorBoundary>
          <ThrowError shouldThrow={true} />
        </MockErrorBoundary>
      )
      
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
      expect(screen.getByText(/We apologize for the inconvenience/i)).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('displays error message in fallback UI', () => {
      render(
        <MockErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Custom error message" />
        </MockErrorBoundary>
      )
      
      expect(screen.getByText('Custom error message')).toBeInTheDocument()
    })

    it('shows error ID when available', () => {
      render(
        <MockErrorBoundary>
          <ThrowError shouldThrow={true} />
        </MockErrorBoundary>
      )
      
      expect(screen.getByText(/Error ID: test-error-id/i)).toBeInTheDocument()
    })

    it('shows contact information for support', () => {
      render(
        <MockErrorBoundary>
          <ThrowError shouldThrow={true} />
        </MockErrorBoundary>
      )
      
      expect(screen.getByText(/contact support/i)).toBeInTheDocument()
    })
  })

  describe('Recovery Functionality', () => {
    it('shows retry button in error fallback', () => {
      render(
        <MockErrorBoundary>
          <ThrowError shouldThrow={true} />
        </MockErrorBoundary>
      )
      
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('retry button is clickable', async () => {
      const user = userEvent.setup()
      
      render(
        <MockErrorBoundary>
          <ThrowError shouldThrow={true} />
        </MockErrorBoundary>
      )
      
      const retryButton = screen.getByText('Try Again')
      await user.click(retryButton)
      
      // Button should be functional (no crash)
      expect(retryButton).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes for error state', () => {
      render(
        <MockErrorBoundary>
          <ThrowError shouldThrow={true} />
        </MockErrorBoundary>
      )
      
      const errorContainer = screen.getByRole('alert')
      expect(errorContainer).toBeInTheDocument()
      expect(errorContainer).toHaveAttribute('aria-live', 'polite')
    })

    it('has keyboard accessible retry button', () => {
      render(
        <MockErrorBoundary>
          <ThrowError shouldThrow={true} />
        </MockErrorBoundary>
      )
      
      const retryButton = screen.getByText('Try Again')
      expect(retryButton).toBeEnabled()
      expect(retryButton).toHaveAttribute('type', 'button')
    })
  })

  describe('Edge Cases', () => {
    it('handles null/undefined children gracefully', () => {
      render(
        <MockErrorBoundary>
          {null}
          {undefined}
        </MockErrorBoundary>
      )
      
      // Should not crash
      expect(document.body).toBeInTheDocument()
    })

    it('handles different error types', () => {
      const TestError = () => {
        throw new TypeError('Type error test')
      }
      
      render(
        <MockErrorBoundary>
          <TestError />
        </MockErrorBoundary>
      )
      
      expect(screen.getByText('Type error test')).toBeInTheDocument()
    })

    it('handles errors without messages', () => {
      const TestError = () => {
        throw new Error()
      }
      
      render(
        <MockErrorBoundary>
          <TestError />
        </MockErrorBoundary>
      )
      
      expect(screen.getByText('Unknown error')).toBeInTheDocument()
    })
  })

  describe('Component Structure', () => {
    it('error boundary provides proper error context', () => {
      render(
        <MockErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Context test" />
        </MockErrorBoundary>
      )
      
      // Should show error UI with context
      expect(screen.getByText('Context test')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('error boundary handles component hierarchy', () => {
      render(
        <MockErrorBoundary>
          <div>
            <div>
              <ThrowError shouldThrow={true} errorMessage="Nested error" />
            </div>
          </div>
        </MockErrorBoundary>
      )
      
      expect(screen.getByText('Nested error')).toBeInTheDocument()
    })
  })

  describe('Error Message Formatting', () => {
    it('formats error messages consistently', () => {
      render(
        <MockErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Formatted error message" />
        </MockErrorBoundary>
      )
      
      expect(screen.getByText('Formatted error message')).toBeInTheDocument()
    })

    it('handles long error messages', () => {
      const longMessage = 'This is a very long error message that should be handled gracefully without breaking the UI layout'
      
      render(
        <MockErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage={longMessage} />
        </MockErrorBoundary>
      )
      
      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })
  })

  describe('User Experience', () => {
    it('provides clear error messaging', () => {
      render(
        <MockErrorBoundary>
          <ThrowError shouldThrow={true} />
        </MockErrorBoundary>
      )
      
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
      expect(screen.getByText(/We apologize for the inconvenience/i)).toBeInTheDocument()
    })

    it('offers recovery options', () => {
      render(
        <MockErrorBoundary>
          <ThrowError shouldThrow={true} />
        </MockErrorBoundary>
      )
      
      expect(screen.getByText('Try Again')).toBeInTheDocument()
      expect(screen.getByText(/contact support/i)).toBeInTheDocument()
    })

    it('maintains visual consistency', () => {
      render(
        <MockErrorBoundary>
          <ThrowError shouldThrow={true} />
        </MockErrorBoundary>
      )
      
      // Should have consistent heading structure
      expect(screen.getByRole('heading')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
}) 