/**
 * FlowPilot Store - Modular Architecture
 * Central state management with slice pattern
 */

import { create } from 'zustand'
import { persist, devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { createAuthSlice } from './slices/auth'
import { createUISlice } from './slices/ui'
import { createWebflowSlice } from './slices/webflow'
import { createCmsSlice } from './slices/cms'
import { createSettingsSlice } from './slices/settings'
import { logger, errorBoundaryMiddleware } from './middleware'

import type { AppStore } from './types'

// Create the store with all slices and middleware
export const useAppStore = create<AppStore>()(
  logger(
    devtools(
      persist(
        subscribeWithSelector(
          immer(
            errorBoundaryMiddleware(
              (...a) => ({
                ...createAuthSlice(...a),
                ...createUISlice(...a),
                ...createWebflowSlice(...a),
                ...createCmsSlice(...a),
                ...createSettingsSlice(...a),
              })
            )
          )
        ),
        {
          name: 'flowpilot-store',
          // Only persist specific data
          partialize: (state) => ({
            // Auth
            user: state.user,
            isAuthenticated: state.isAuthenticated,
            
            // API connection
            apiKey: state.apiKey,
            
            // User preferences
            theme: state.theme,
            defaultPageSize: state.defaultPageSize,
            autoSave: state.autoSave,
            
            // Active selections
            activeCollection: state.activeCollection,
          }),
        }
      ),
      { 
        name: 'FlowPilot Store',
        trace: true,
      }
    ),
    'FlowPilot'
  )
)

// Export typed hooks for better DX
export { useAuth, useWebflow, useUI, useCms, useSettings } from './hooks'
export { useCmsCollection, useCmsOperations, useCmsPagination } from './hooks'

// Re-export types
export type { 
  User, 
  WebflowSite, 
  WebflowCollection,
  OptimisticOperation,
  CmsCollectionState,
  CmsPaginationState,
  AppStore 
} from './types'