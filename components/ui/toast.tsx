/**
 * Toast Component
 * Simple toast notification system for user feedback
 */

'use client'

import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface Toast {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }

    setToasts((prev) => [...prev, newToast])

    // Auto remove after duration (default 5 seconds)
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className='fixed top-4 right-4 z-50 max-w-sm space-y-2'>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className='h-5 w-5 text-green-600' />
      case 'error':
        return <XCircle className='h-5 w-5 text-red-600' />
      case 'warning':
        return <AlertCircle className='h-5 w-5 text-yellow-600' />
      case 'info':
        return <Info className='h-5 w-5 text-blue-600' />
    }
  }

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div
      className={cn(
        'relative rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out',
        'animate-in slide-in-from-right-full',
        getBackgroundColor()
      )}
    >
      <div className='flex items-start gap-3'>
        {getIcon()}
        <div className='flex-1'>
          <h4 className='text-sm font-medium text-gray-900'>{toast.title}</h4>
          {toast.description && <p className='mt-1 text-sm text-gray-600'>{toast.description}</p>}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className='flex-shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:text-gray-600'
        >
          <X className='h-4 w-4' />
        </button>
      </div>
    </div>
  )
}
