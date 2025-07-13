/**
 * Store Hooks
 * Convenient typed hooks for accessing store slices
 */

import { useAppStore } from './index'
import type { WebflowCmsItem, CmsPaginationState, AppStore } from './types'

// Auth hooks
export const useAuth = () => useAppStore((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  login: state.setUser,
  logout: state.logout,
}))

// UI hooks
export const useUI = () => useAppStore((state) => ({
  isLoading: state.isLoading,
  error: state.error,
  setLoading: state.setLoading,
  setError: state.setError,
  clearError: state.clearError,
}))

// Webflow hooks
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

// CMS hooks
export const useCms = () => useAppStore((state) => ({
  activeCollection: state.activeCollection,
  cmsCollections: state.cmsCollections,
  optimisticOperations: state.optimisticOperations,
  setActiveCollection: state.setActiveCollection,
  initializeCollection: state.initializeCollection,
  clearOptimisticOperations: state.clearOptimisticOperations,
}))

// Settings hooks
export const useSettings = () => useAppStore((state) => ({
  theme: state.theme,
  defaultPageSize: state.defaultPageSize,
  autoSave: state.autoSave,
  setTheme: state.setTheme,
  setDefaultPageSize: state.setDefaultPageSize,
  setAutoSave: state.setAutoSave,
}))

// Collection-specific hook with all related operations
export const useCmsCollection = (collectionId: string) => useAppStore((state) => {
  const collection = state.cmsCollections[collectionId]
  return {
    collection,
    items: state.getCombinedItems(collectionId),
    loading: collection?.loading || false,
    error: collection?.error || null,
    pagination: collection?.pagination || {
      currentPage: 1,
      pageSize: state.defaultPageSize,
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

// Optimistic operations hook
export const useCmsOperations = () => useAppStore((state) => ({
  optimisticOperations: state.optimisticOperations,
  addOptimisticOperation: state.addOptimisticOperation,
  removeOptimisticOperation: state.removeOptimisticOperation,
  clearOptimisticOperations: state.clearOptimisticOperations,
}))

// Pagination hook with helper methods
export const useCmsPagination = (collectionId: string) => useAppStore((state) => {
  const collection = state.cmsCollections[collectionId]
  const pagination = collection?.pagination || {
    currentPage: 1,
    pageSize: state.defaultPageSize,
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

// Shallow equality checker for optimization
import { useShallow } from 'zustand/react/shallow'

export const useShallowStore = <T>(selector: (state: AppStore) => T) => 
  useAppStore(useShallow(selector))