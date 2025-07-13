/**
 * CMS Slice
 * Handles CMS data management and optimistic updates
 */

import { StateCreator } from 'zustand'
import type { CmsSlice, AppStore, CmsCollectionState, CmsPaginationState, WebflowCmsItem } from '../types'

const defaultPagination: CmsPaginationState = {
  currentPage: 1,
  pageSize: 25,
  totalItems: 0,
  searchQuery: '',
  sortConfig: null
}

export const createCmsSlice: StateCreator<
  AppStore,
  [],
  [],
  CmsSlice
> = (set, get) => ({
  activeCollection: null,
  cmsCollections: {},
  optimisticOperations: [],
  
  setActiveCollection: (activeCollection) => {
    set({ activeCollection })
  },
  
  initializeCollection: (collection) => {
    set((state) => {
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
            pagination: { ...defaultPagination }
          }
        }
      }
    })
  },
  
  setCmsItems: (collectionId, items, totalItems) => {
    set((state) => ({
      cmsCollections: {
        ...state.cmsCollections,
        [collectionId]: {
          ...state.cmsCollections[collectionId],
          items,
          lastFetched: new Date().toISOString(),
          pagination: {
            ...state.cmsCollections[collectionId]?.pagination || defaultPagination,
            totalItems: totalItems ?? items.length
          }
        }
      }
    }))
  },
  
  addCmsItem: (collectionId, item) => {
    set((state) => {
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
    })
  },
  
  updateCmsItem: (collectionId, itemId, updates) => {
    set((state) => {
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
    })
  },
  
  removeCmsItem: (collectionId, itemId) => {
    set((state) => {
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
    })
  },
  
  setCmsLoading: (collectionId, loading) => {
    set((state) => {
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
    })
  },
  
  setCmsError: (collectionId, error) => {
    set((state) => {
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
    })
  },
  
  setCmsPagination: (collectionId, paginationUpdates) => {
    set((state) => {
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
    })
  },
  
  addOptimisticOperation: (operation) => {
    set((state) => ({
      optimisticOperations: [...state.optimisticOperations, operation]
    }))
  },
  
  removeOptimisticOperation: (operationId) => {
    set((state) => ({
      optimisticOperations: state.optimisticOperations.filter(op => op.id !== operationId)
    }))
  },
  
  clearOptimisticOperations: (collectionId) => {
    set((state) => ({
      optimisticOperations: collectionId
        ? state.optimisticOperations.filter(op => op.collectionId !== collectionId)
        : []
    }))
  },
  
  getCombinedItems: (collectionId) => {
    const state = get()
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
            if (op.item && op.itemId) {
              const index = items.findIndex(item => item.id === op.itemId)
              if (index !== -1) {
                items[index] = op.item
              }
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
  }
})