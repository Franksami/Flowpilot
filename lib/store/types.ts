/**
 * FlowPilot Store Types
 * Centralized type definitions for state management
 */

import type { WebflowCmsItem, WebflowField, WebflowUser } from '@/lib/types/webflow'

// Re-export for convenience
export type { WebflowCmsItem } from '@/lib/types/webflow'

// Re-export WebflowUser but ensure it matches our needs
export interface User extends WebflowUser {
  id: string // Make id required for authenticated users
  name: string
}

export interface WebflowSite {
  id: string
  name: string
  shortName: string
  defaultDomain: string
}

export interface WebflowCollection {
  id: string
  name: string
  slug: string
  siteId: string
  singularName: string
  fields: WebflowField[]
}

// CMS-specific types
export interface OptimisticOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  collectionId: string
  itemId?: string
  item?: WebflowCmsItem
  originalItem?: WebflowCmsItem
  timestamp: string
}

export interface CmsPaginationState {
  currentPage: number
  pageSize: number
  totalItems: number
  searchQuery: string
  sortConfig: {
    field: string
    direction: 'asc' | 'desc'
  } | null
}

export interface CmsCollectionState {
  items: WebflowCmsItem[]
  loading: boolean
  error: string | null
  lastFetched: string | null
  pagination: CmsPaginationState
  selectedItems: Set<string>
}

// Slice interfaces
export interface AuthSlice {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void
}

export interface UISlice {
  isLoading: boolean
  error: string | null
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export interface WebflowSlice {
  currentSite: WebflowSite | null
  sites: WebflowSite[]
  collections: WebflowCollection[]
  apiKey: string | null
  isConnected: boolean
  setSites: (sites: WebflowSite[]) => void
  setCurrentSite: (site: WebflowSite | null) => void
  setCollections: (collections: WebflowCollection[]) => void
  setApiKey: (key: string | null) => void
  setConnected: (connected: boolean) => void
}

export interface CmsSlice {
  activeCollection: WebflowCollection | null
  cmsCollections: Record<string, CmsCollectionState>
  optimisticOperations: OptimisticOperation[]

  // Collection management
  setActiveCollection: (collection: WebflowCollection | null) => void
  initializeCollection: (collection: WebflowCollection) => void

  // Item operations
  setCmsItems: (collectionId: string, items: WebflowCmsItem[], totalItems?: number) => void
  addCmsItem: (collectionId: string, item: WebflowCmsItem) => void
  updateCmsItem: (collectionId: string, itemId: string, updates: Partial<WebflowCmsItem>) => void
  removeCmsItem: (collectionId: string, itemId: string) => void

  // State management
  setCmsLoading: (collectionId: string, loading: boolean) => void
  setCmsError: (collectionId: string, error: string | null) => void
  setCmsPagination: (collectionId: string, pagination: Partial<CmsPaginationState>) => void

  // Selection operations
  selectItem: (collectionId: string, itemId: string) => void
  deselectItem: (collectionId: string, itemId: string) => void
  selectAll: (collectionId: string, itemIds: string[]) => void
  clearSelection: (collectionId: string) => void
  toggleItemSelection: (collectionId: string, itemId: string) => void
  setSelectedItems: (collectionId: string, itemIds: string[]) => void

  // Optimistic updates
  addOptimisticOperation: (operation: OptimisticOperation) => void
  removeOptimisticOperation: (operationId: string) => void
  clearOptimisticOperations: (collectionId?: string) => void

  // Computed values
  getCombinedItems: (collectionId: string) => WebflowCmsItem[]
}

// Settings slice for user preferences
export interface SettingsSlice {
  theme: 'light' | 'dark' | 'system'
  defaultPageSize: number
  autoSave: boolean
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setDefaultPageSize: (size: number) => void
  setAutoSave: (enabled: boolean) => void
}

// Combined store type
export type AppStore = AuthSlice & UISlice & WebflowSlice & CmsSlice & SettingsSlice
