/**
 * FlowPilot Simple Store
 * Minimal viable state management - expand as needed
 */

import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

import type { WebflowCmsItem, WebflowField } from '@/lib/types/webflow'

// Basic types for our core entities
export interface User {
  id: string
  email: string
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
}

// Main store interface - keep it simple
interface AppStore {
  // User state
  user: User | null
  isAuthenticated: boolean
  
  // UI state
  isLoading: boolean
  error: string | null
  
  // Webflow data
  currentSite: WebflowSite | null
  sites: WebflowSite[]
  collections: WebflowCollection[]
  
  // API connection
  apiKey: string | null
  isConnected: boolean

  // CMS state
  activeCollection: WebflowCollection | null
  cmsCollections: Record<string, CmsCollectionState>
  optimisticOperations: OptimisticOperation[]
  
  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  setSites: (sites: WebflowSite[]) => void
  setCurrentSite: (site: WebflowSite | null) => void
  setCollections: (collections: WebflowCollection[]) => void
  setApiKey: (key: string | null) => void
  setConnected: (connected: boolean) => void
  logout: () => void

  // CMS actions
  setActiveCollection: (collection: WebflowCollection | null) => void
  initializeCollection: (collection: WebflowCollection) => void
  setCmsItems: (collectionId: string, items: WebflowCmsItem[], totalItems?: number) => void
  addCmsItem: (collectionId: string, item: WebflowCmsItem) => void
  updateCmsItem: (collectionId: string, itemId: string, updates: Partial<WebflowCmsItem>) => void
  removeCmsItem: (collectionId: string, itemId: string) => void
  setCmsLoading: (collectionId: string, loading: boolean) => void
  setCmsError: (collectionId: string, error: string | null) => void
  setCmsPagination: (collectionId: string, pagination: Partial<CmsPaginationState>) => void
  addOptimisticOperation: (operation: OptimisticOperation) => void
  removeOptimisticOperation: (operationId: string) => void
  clearOptimisticOperations: (collectionId?: string) => void
  getCombinedItems: (collectionId: string) => WebflowCmsItem[]
}

// Create the store
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        currentSite: null,
        sites: [],
        collections: [],
        apiKey: null,
        isConnected: false,

        // CMS initial state
        activeCollection: null,
        cmsCollections: {},
        optimisticOperations: [],

        // Actions
        setUser: (user) => set({ 
          user, 
          isAuthenticated: !!user 
        }),
        
        setLoading: (isLoading) => set({ isLoading }),
        
        setError: (error) => set({ error }),
        
        clearError: () => set({ error: null }),
        
        setSites: (sites) => set({ sites }),
        
        setCurrentSite: (currentSite) => set({ currentSite }),
        
        setCollections: (collections) => set({ collections }),
        
        setApiKey: (apiKey) => set({ 
          apiKey,
          isConnected: !!apiKey 
        }),
        
        setConnected: (isConnected) => set({ isConnected }),
        
        logout: () => set({
          user: null,
          isAuthenticated: false,
          currentSite: null,
          sites: [],
          collections: [],
          apiKey: null,
          isConnected: false,
          error: null,
          // Clear CMS state on logout
          activeCollection: null,
          cmsCollections: {},
          optimisticOperations: []
        }),

        // CMS actions implementation
        setActiveCollection: (activeCollection) => set({ activeCollection }),

        initializeCollection: (collection) => set((state) => {
          if (state.cmsCollections[collection.id]) {
            return state // Already initialized
          }

          return {
            cmsCollections: {
              ...state.cmsCollections,
              [collection.id]: {
                items: [],
                loading: false,
                error: null,
                lastFetched: null,
                pagination: {
                  currentPage: 1,
                  pageSize: 25,
                  totalItems: 0,
                  searchQuery: '',
                  sortConfig: null
                }
              }
            }
          }
        }),

        setCmsItems: (collectionId, items, totalItems) => set((state) => ({
          cmsCollections: {
            ...state.cmsCollections,
            [collectionId]: {
              ...state.cmsCollections[collectionId],
              items,
              lastFetched: new Date().toISOString(),
              pagination: {
                ...state.cmsCollections[collectionId]?.pagination || {
                  currentPage: 1,
                  pageSize: 25,
                  searchQuery: '',
                  sortConfig: null
                },
                totalItems: totalItems ?? items.length
              }
            }
          }
        })),

        addCmsItem: (collectionId, item) => set((state) => {
          const collection = state.cmsCollections[collectionId]
          if (!collection) return state

          return {
            cmsCollections: {
              ...state.cmsCollections,
              [collectionId]: {
                ...collection,
                items: [item, ...collection.items],
                pagination: {
                  ...collection.pagination,
                  totalItems: collection.pagination.totalItems + 1
                }
              }
            }
          }
        }),

        updateCmsItem: (collectionId, itemId, updates) => set((state) => {
          const collection = state.cmsCollections[collectionId]
          if (!collection) return state

          return {
            cmsCollections: {
              ...state.cmsCollections,
              [collectionId]: {
                ...collection,
                items: collection.items.map(item =>
                  item.id === itemId ? { ...item, ...updates } : item
                )
              }
            }
          }
        }),

        removeCmsItem: (collectionId, itemId) => set((state) => {
          const collection = state.cmsCollections[collectionId]
          if (!collection) return state

          return {
            cmsCollections: {
              ...state.cmsCollections,
              [collectionId]: {
                ...collection,
                items: collection.items.filter(item => item.id !== itemId),
                pagination: {
                  ...collection.pagination,
                  totalItems: Math.max(0, collection.pagination.totalItems - 1)
                }
              }
            }
          }
        }),

        setCmsLoading: (collectionId, loading) => set((state) => {
          const collection = state.cmsCollections[collectionId]
          if (!collection) return state

          return {
            cmsCollections: {
              ...state.cmsCollections,
              [collectionId]: {
                ...collection,
                loading
              }
            }
          }
        }),

        setCmsError: (collectionId, error) => set((state) => {
          const collection = state.cmsCollections[collectionId]
          if (!collection) return state

          return {
            cmsCollections: {
              ...state.cmsCollections,
              [collectionId]: {
                ...collection,
                error
              }
            }
          }
        }),

        setCmsPagination: (collectionId, paginationUpdates) => set((state) => {
          const collection = state.cmsCollections[collectionId]
          if (!collection) return state

          return {
            cmsCollections: {
              ...state.cmsCollections,
              [collectionId]: {
                ...collection,
                pagination: {
                  ...collection.pagination,
                  ...paginationUpdates
                }
              }
            }
          }
        }),

        addOptimisticOperation: (operation) => set((state) => ({
          optimisticOperations: [...state.optimisticOperations, operation]
        })),

        removeOptimisticOperation: (operationId) => set((state) => ({
          optimisticOperations: state.optimisticOperations.filter(op => op.id !== operationId)
        })),

        clearOptimisticOperations: (collectionId) => set((state) => ({
          optimisticOperations: collectionId
            ? state.optimisticOperations.filter(op => op.collectionId !== collectionId)
            : []
        })),

        getCombinedItems: (collectionId) => {
          const state = useAppStore.getState()
          const collection = state.cmsCollections[collectionId]
          if (!collection) return []

          let items = [...collection.items]

          // Apply optimistic operations for this collection
          state.optimisticOperations
            .filter(op => op.collectionId === collectionId)
            .forEach(op => {
              switch (op.type) {
                case 'delete':
                  if (op.itemId) {
                    items = items.filter(item => item.id !== op.itemId)
                  }
                  break
                case 'update':
                  if (op.item) {
                    items = items.map(item => item.id === op.item?.id ? op.item : item)
                  }
                  break
                case 'create':
                  if (op.item && !items.find(item => item.id === op.item?.id)) {
                    items = [op.item, ...items]
                  }
                  break
              }
            })

          return items
        },
      }),
      {
        name: 'flowpilot-store',
        // Only persist user auth, API key, and active collection
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          apiKey: state.apiKey,
          activeCollection: state.activeCollection,
        }),
      }
    ),
    { name: 'FlowPilot Store' }
  )
)

// Convenient hooks for common use cases
export const useAuth = () => useAppStore((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  login: state.setUser,
  logout: state.logout,
}))

export const useWebflow = () => useAppStore((state) => ({
  currentSite: state.currentSite,
  sites: state.sites,
  collections: state.collections,
  apiKey: state.apiKey,
  isConnected: state.isConnected,
  setSites: state.setSites,
  setCurrentSite: state.setCurrentSite,
  setCollections: state.setCollections,
  setApiKey: state.setApiKey,
  setConnected: state.setConnected,
}))

export const useUI = () => useAppStore((state) => ({
  isLoading: state.isLoading,
  error: state.error,
  setLoading: state.setLoading,
  setError: state.setError,
  clearError: state.clearError,
}))

// CMS-specific hooks
export const useCms = () => useAppStore((state) => ({
  activeCollection: state.activeCollection,
  cmsCollections: state.cmsCollections,
  optimisticOperations: state.optimisticOperations,
  setActiveCollection: state.setActiveCollection,
  initializeCollection: state.initializeCollection,
  clearOptimisticOperations: state.clearOptimisticOperations,
}))

export const useCmsCollection = (collectionId: string) => useAppStore((state) => {
  const collection = state.cmsCollections[collectionId]
  return {
    collection,
    items: state.getCombinedItems(collectionId),
    loading: collection?.loading || false,
    error: collection?.error || null,
    pagination: collection?.pagination || {
      currentPage: 1,
      pageSize: 25,
      totalItems: 0,
      searchQuery: '',
      sortConfig: null
    },
    lastFetched: collection?.lastFetched || null,
    isInitialized: !!collection,
    // Actions
    setCmsItems: (items: WebflowCmsItem[], totalItems?: number) => 
      state.setCmsItems(collectionId, items, totalItems),
    addCmsItem: (item: WebflowCmsItem) => 
      state.addCmsItem(collectionId, item),
    updateCmsItem: (itemId: string, updates: Partial<WebflowCmsItem>) => 
      state.updateCmsItem(collectionId, itemId, updates),
    removeCmsItem: (itemId: string) => 
      state.removeCmsItem(collectionId, itemId),
    setLoading: (loading: boolean) => 
      state.setCmsLoading(collectionId, loading),
    setError: (error: string | null) => 
      state.setCmsError(collectionId, error),
    setPagination: (pagination: Partial<CmsPaginationState>) => 
      state.setCmsPagination(collectionId, pagination),
  }
})

export const useCmsOperations = () => useAppStore((state) => ({
  optimisticOperations: state.optimisticOperations,
  addOptimisticOperation: state.addOptimisticOperation,
  removeOptimisticOperation: state.removeOptimisticOperation,
  clearOptimisticOperations: state.clearOptimisticOperations,
}))

export const useCmsPagination = (collectionId: string) => useAppStore((state) => {
  const collection = state.cmsCollections[collectionId]
  const pagination = collection?.pagination || {
    currentPage: 1,
    pageSize: 25,
    totalItems: 0,
    searchQuery: '',
    sortConfig: null
  }

  return {
    ...pagination,
    setPagination: (updates: Partial<CmsPaginationState>) => 
      state.setCmsPagination(collectionId, updates),
    setPage: (currentPage: number) => 
      state.setCmsPagination(collectionId, { currentPage }),
    setPageSize: (pageSize: number) => 
      state.setCmsPagination(collectionId, { pageSize, currentPage: 1 }),
    setSearch: (searchQuery: string) => 
      state.setCmsPagination(collectionId, { searchQuery, currentPage: 1 }),
    setSort: (field: string, direction: 'asc' | 'desc') => 
      state.setCmsPagination(collectionId, { sortConfig: { field, direction } }),
    clearSort: () => 
      state.setCmsPagination(collectionId, { sortConfig: null }),
  }
})