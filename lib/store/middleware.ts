/**
 * Store Middleware
 * Logging, debugging, and monitoring for development
 */

import { StateCreator, StoreMutatorIdentifier } from 'zustand'

type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>

type LoggerImpl = <T>(
  f: StateCreator<T, [], []>,
  name?: string
) => StateCreator<T, [], []>

const loggerImpl: LoggerImpl = (f, name) => (set, get, store) => {
  const loggedSet: typeof set = (...args) => {
    const prevState = get()
    set(...args)
    const nextState = get()
    
    if (process.env.NODE_ENV === 'development') {
      console.group(`[${name || 'Store'}] State Update`)
      console.log('Previous State:', prevState)
      console.log('Next State:', nextState)
      console.log('Diff:', getDiff(prevState, nextState))
      console.groupEnd()
    }
  }
  
  return f(loggedSet, get, store)
}

export const logger = loggerImpl as Logger

// Helper to get state diff
function getDiff(prev: any, next: any): Record<string, any> {
  const diff: Record<string, any> = {}
  
  // Check for added or changed properties
  for (const key in next) {
    if (prev[key] !== next[key]) {
      diff[key] = {
        from: prev[key],
        to: next[key]
      }
    }
  }
  
  // Check for removed properties
  for (const key in prev) {
    if (!(key in next)) {
      diff[key] = {
        from: prev[key],
        to: undefined
      }
    }
  }
  
  return diff
}

// Performance monitoring middleware
export const performanceMiddleware = <T extends Record<string, any>>(
  config: StateCreator<T>
): StateCreator<T> => {
  return (set, get, api) => {
    const trackedSet: typeof set = (...args) => {
      const start = performance.now()
      set(...args)
      const end = performance.now()
      
      if (process.env.NODE_ENV === 'development' && end - start > 16) {
        console.warn(`[Performance] Slow state update: ${end - start}ms`)
      }
    }
    
    return config(trackedSet, get, api)
  }
}

// Error boundary middleware
export const errorBoundaryMiddleware = <T extends Record<string, any>>(
  config: StateCreator<T>
): StateCreator<T> => {
  return (set, get, api) => {
    const safeSet: typeof set = (...args) => {
      try {
        set(...args)
      } catch (error) {
        console.error('[Store Error]', error)
        // You could also dispatch an error action here
        if ('setError' in get() && typeof (get() as any).setError === 'function') {
          (get() as any).setError('An error occurred while updating the store')
        }
      }
    }
    
    return config(safeSet, get, api)
  }
}