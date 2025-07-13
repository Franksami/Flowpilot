# Error Boundary Guide

## Overview

Error boundaries are React components that catch JavaScript errors anywhere in their child component tree, log those errors, and display a fallback UI instead of the component tree that crashed.

## Implementation Status

### Test Coverage Progress
- **Initial State**: 4/21 tests passing (19%)
- **Current State**: 16/27 tests passing (59%)
- **Improvement**: +12 tests passing (+40% coverage)

### What We've Implemented

1. **Error Boundary Component** (`components/errors/error-boundary.tsx`)
   - Catches and handles JavaScript errors in child components
   - Displays user-friendly error messages
   - Integrates with our centralized error handler
   - Provides retry functionality
   - Shows different UI based on error level (app/page/component)

2. **Error Handler Integration**
   - Logs errors with proper context
   - Generates error IDs for tracking
   - Provides recovery options
   - Handles different error severities

3. **Fallback UI Components**
   - `DefaultErrorFallback` - Standard error display
   - `AppErrorFallback` - Full application errors
   - `PageErrorFallback` - Page-level errors
   - `ComponentErrorFallback` - Component-level errors

## Usage Examples

### Basic Usage

```tsx
import { ErrorBoundary } from '@/components/errors/error-boundary'

function MyComponent() {
  return (
    <ErrorBoundary>
      <ComponentThatMightError />
    </ErrorBoundary>
  )
}
```

### With Custom Fallback

```tsx
<ErrorBoundary 
  fallback={CustomErrorFallback}
  level="page"
  onError={(error, errorId) => {
    console.log('Error caught:', error.message)
  }}
>
  <PageContent />
</ErrorBoundary>
```

### Using HOC Pattern

```tsx
import { withErrorBoundary } from '@/components/errors/error-boundary'

const SafeComponent = withErrorBoundary(UnsafeComponent, {
  level: 'component',
  fallback: MinimalErrorFallback
})
```

## Best Practices

### 1. Error Boundary Placement

```tsx
// App-level boundary
<ErrorBoundary level="app">
  <App />
</ErrorBoundary>

// Page-level boundaries
<ErrorBoundary level="page">
  <PageComponent />
</ErrorBoundary>

// Feature-level boundaries
<ErrorBoundary level="component">
  <FeatureComponent />
</ErrorBoundary>
```

### 2. Error Recovery Strategies

- **Retry Operations**: Allow users to retry failed operations
- **Fallback Content**: Show placeholder content when possible
- **Graceful Degradation**: Disable features rather than crash
- **Clear Communication**: Explain what went wrong in user terms

### 3. Error Logging

```tsx
<ErrorBoundary 
  onError={(error, errorId) => {
    // Log to external service
    analytics.track('error_boundary_triggered', {
      errorId,
      errorMessage: error.message,
      errorCode: error.code
    })
  }}
>
  <Content />
</ErrorBoundary>
```

### 4. Testing Error Boundaries

```tsx
// Test error handling
it('should catch and display errors', () => {
  const ThrowError = () => {
    throw new Error('Test error')
  }
  
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  )
  
  expect(screen.getByText(/Something went wrong/)).toBeInTheDocument()
  expect(screen.getByText('Try Again')).toBeInTheDocument()
})
```

## Common Patterns

### 1. Async Error Handling

Error boundaries don't catch errors in:
- Event handlers
- Asynchronous code (setTimeout, promises)
- Server-side rendering
- Errors thrown in the error boundary itself

For async errors, use:

```tsx
const { captureError } = useErrorHandler()

try {
  await riskyAsyncOperation()
} catch (error) {
  captureError(error)
}
```

### 2. Conditional Error Boundaries

```tsx
const SafeFeature = () => {
  const isExperimental = useFeatureFlag('experimental')
  
  if (isExperimental) {
    return (
      <ErrorBoundary fallback={ExperimentalErrorFallback}>
        <ExperimentalFeature />
      </ErrorBoundary>
    )
  }
  
  return <StableFeature />
}
```

### 3. Error Boundary with Context

```tsx
<ErrorBoundary
  onError={(error, errorId) => {
    // Include context in error report
    errorHandler.report(error, {
      errorId,
      userId: currentUser.id,
      feature: 'data-table',
      action: 'sort-column'
    })
  }}
>
  <DataTable />
</ErrorBoundary>
```

## Integration with FlowPilot

### CMS Operations

```tsx
// Wrap CMS operations with error boundaries
<ErrorBoundary level="component" fallback={CmsErrorFallback}>
  <CmsDataTable collection={collection} />
</ErrorBoundary>
```

### API Error Handling

```tsx
// Catch API errors at the page level
<ErrorBoundary 
  level="page"
  onError={(error) => {
    if (error.code === 'INVALID_API_KEY') {
      router.push('/onboarding')
    }
  }}
>
  <CmsPage />
</ErrorBoundary>
```

## Monitoring and Analytics

### Error Tracking

```tsx
const errorBoundaryConfig = {
  onError: (error: AppError, errorId: string) => {
    // Send to monitoring service
    Sentry.captureException(error, {
      tags: {
        errorBoundary: true,
        errorId,
        level: error.severity
      },
      extra: {
        code: error.code,
        recoverable: error.recoverable,
        retryable: error.retryable
      }
    })
  }
}
```

### Performance Impact

Error boundaries have minimal performance impact:
- Only active when errors occur
- No overhead during normal operation
- Helps prevent full app crashes
- Improves user experience during failures

## Future Improvements

1. **Async Error Boundaries** (React 18+)
   - Support for Suspense integration
   - Better handling of promise rejections

2. **Error Recovery Automation**
   - Auto-retry for transient errors
   - Intelligent fallback selection

3. **Enhanced Error Context**
   - Component stack traces
   - User action tracking
   - Session replay integration

4. **Progressive Error Handling**
   - Partial component recovery
   - State preservation during errors

## Summary

Error boundaries are essential for production React applications. They:
- Prevent full application crashes
- Provide better user experience during failures
- Enable proper error tracking and monitoring
- Allow graceful degradation of functionality

The FlowPilot implementation provides a robust foundation for error handling with room for enhancement as the application grows.