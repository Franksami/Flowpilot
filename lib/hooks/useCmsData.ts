/**
 * CMS Data Hooks
 * Specialized hooks for CMS data operations with integrated state management
 */

import { useCallback } from 'react'

import { errorHandler } from '@/lib/errors/handler'
import { getCmsItems, createCmsItem, deleteCmsItem } from '@/lib/actions/webflow-actions'
import { updateCmsItem as updateCmsItemAction } from '@/lib/actions/webflow-actions'
import { useCmsCollection, useCmsOperations } from '@/lib/store'
import type { WebflowCollection, WebflowCmsItem } from '@/lib/types/webflow'

/**
 * Hook for managing CMS data operations for a specific collection
 */
export function useCmsData(collection: WebflowCollection, apiKey: string | null) {
  const {
    items,
    loading,
    error,
    pagination,
    isInitialized,
    setCmsItems,
    setLoading,
    setError,
    setPagination
  } = useCmsCollection(collection.id)

  const {
    optimisticOperations,
    addOptimisticOperation,
    removeOptimisticOperation
  } = useCmsOperations()

  // Initialize collection if not already done
  const initializeIfNeeded = useCallback(() => {
    if (!isInitialized) {
      // This will be handled by the store action
    }
  }, [isInitialized])

  // Fetch CMS items with retry and error handling
  const fetchItems = useCallback(async (
    page?: number,
    pageSize?: number,
    searchQuery?: string,
    sortField?: string,
    sortDirection?: 'asc' | 'desc'
  ) => {
    if (!apiKey) return

    const currentPage = page ?? pagination.currentPage
    const currentPageSize = pageSize ?? pagination.pageSize
    const currentSearch = searchQuery ?? pagination.searchQuery
    const currentSort = sortField ?? pagination.sortConfig?.field
    const currentDirection = sortDirection ?? pagination.sortConfig?.direction

    setLoading(true)
    setError(null)

    try {
      const options = {
        limit: currentPageSize,
        offset: (currentPage - 1) * currentPageSize,
        ...(currentSort && { sort: [`${currentSort}:${currentDirection || 'asc'}`] })
      }

      const response = await errorHandler.withRetry(
        async () => {
          const result = await getCmsItems(apiKey, collection.id, options)
          if (!result.success) {
            throw new Error(result.error || 'Failed to fetch CMS items')
          }
          return result
        },
        `fetch-cms-items-${collection.id}-${currentPage}`,
        { maxAttempts: 3, baseDelay: 1000 }
      )

      if (response.data) {
        setCmsItems(response.data.items, response.data.pagination.total)
        setPagination({
          currentPage,
          pageSize: currentPageSize,
          totalItems: response.data.pagination.total,
          searchQuery: currentSearch,
          sortConfig: currentSort ? { field: currentSort, direction: currentDirection || 'asc' } : null
        })
      }
    } catch (err) {
      const appError = errorHandler.handleError(err, {
        context: errorHandler.createContext({
          operation: 'fetchCmsItems',
          collectionId: collection.id,
          additionalData: { page: currentPage, pageSize: currentPageSize }
        })
      })
      setError(appError.userMessage)
    } finally {
      setLoading(false)
    }
  }, [apiKey, collection.id, pagination, setCmsItems, setLoading, setError, setPagination])

  // Create item with optimistic updates
  const createItem = useCallback(async (data: Record<string, unknown>) => {
    if (!apiKey) return

    const operationId = `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const optimisticItem: WebflowCmsItem = {
      id: operationId,
      cid: operationId,
      createdOn: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      lastPublished: null,
      isDraft: true,
      isArchived: false,
      fieldData: data as Record<string, unknown>
    }

    // Add optimistic operation
    addOptimisticOperation({
      id: operationId,
      type: 'create',
      collectionId: collection.id,
      item: optimisticItem,
      timestamp: new Date().toISOString()
    })

    try {
      const response = await createCmsItem(apiKey, collection.id, { fieldData: data })
      
      if (response.success) {
        // Remove optimistic operation and refresh data
        removeOptimisticOperation(operationId)
        await fetchItems()
      } else {
        // Remove optimistic operation on failure
        removeOptimisticOperation(operationId)
        throw new Error(response.error || 'Failed to create item')
      }
    } catch (err) {
      // Remove optimistic operation on error
      removeOptimisticOperation(operationId)
      throw errorHandler.handleError(err, {
        context: errorHandler.createContext({
          operation: 'createCmsItem',
          collectionId: collection.id
        })
      })
    }
  }, [apiKey, collection.id, addOptimisticOperation, removeOptimisticOperation, fetchItems])

  // Update item with optimistic updates
  const updateItem = useCallback(async (itemId: string, data: Record<string, unknown>) => {
    if (!apiKey) return

    // Find the original item
    const originalItem = items.find(item => item.id === itemId)
    if (!originalItem) return

    const operationId = `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const updatedItem: WebflowCmsItem = {
      ...originalItem,
      fieldData: { ...originalItem.fieldData, ...data },
      lastUpdated: new Date().toISOString()
    }

    // Add optimistic operation
    addOptimisticOperation({
      id: operationId,
      type: 'update',
      collectionId: collection.id,
      itemId,
      item: updatedItem,
      originalItem,
      timestamp: new Date().toISOString()
    })

    try {
      const response = await updateCmsItemAction(apiKey, collection.id, itemId, { id: itemId, fieldData: data })
      
      if (response.success) {
        // Remove optimistic operation and refresh data
        removeOptimisticOperation(operationId)
        await fetchItems()
      } else {
        // Remove optimistic operation on failure
        removeOptimisticOperation(operationId)
        throw new Error(response.error || 'Failed to update item')
      }
    } catch (err) {
      // Remove optimistic operation on error
      removeOptimisticOperation(operationId)
      throw errorHandler.handleError(err, {
        context: errorHandler.createContext({
          operation: 'updateCmsItem',
          collectionId: collection.id,
          itemId
        })
      })
    }
  }, [apiKey, collection.id, items, addOptimisticOperation, removeOptimisticOperation, fetchItems])

  // Delete item with optimistic updates
  const deleteItem = useCallback(async (itemId: string) => {
    if (!apiKey) return

    // Find the original item
    const originalItem = items.find(item => item.id === itemId)
    if (!originalItem) return

    const operationId = `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Add optimistic operation
    addOptimisticOperation({
      id: operationId,
      type: 'delete',
      collectionId: collection.id,
      itemId,
      originalItem,
      timestamp: new Date().toISOString()
    })

    try {
      const response = await deleteCmsItem(apiKey, collection.id, itemId)
      
      if (response.success) {
        // Remove optimistic operation and refresh data
        removeOptimisticOperation(operationId)
        await fetchItems()
      } else {
        // Remove optimistic operation on failure
        removeOptimisticOperation(operationId)
        throw new Error(response.error || 'Failed to delete item')
      }
    } catch (err) {
      // Remove optimistic operation on error
      removeOptimisticOperation(operationId)
      throw errorHandler.handleError(err, {
        context: errorHandler.createContext({
          operation: 'deleteCmsItem',
          collectionId: collection.id,
          itemId
        })
      })
    }
  }, [apiKey, collection.id, items, addOptimisticOperation, removeOptimisticOperation, fetchItems])

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    fetchItems(page)
  }, [fetchItems])

  const handlePageSizeChange = useCallback((pageSize: number) => {
    fetchItems(1, pageSize)
  }, [fetchItems])

  const handleSearch = useCallback((searchQuery: string) => {
    fetchItems(1, undefined, searchQuery)
  }, [fetchItems])

  const handleSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    fetchItems(undefined, undefined, undefined, field, direction)
  }, [fetchItems])

  // Get filtered optimistic operations for this collection
  const collectionOptimisticOps = optimisticOperations.filter(op => op.collectionId === collection.id)

  return {
    // Data
    items,
    loading,
    error,
    pagination,
    optimisticOperations: collectionOptimisticOps,
    isInitialized,

    // Operations
    fetchItems,
    createItem,
    updateItem,
    deleteItem,

    // Handlers
    handlePageChange,
    handlePageSizeChange,
    handleSearch,
    handleSort,

    // Utilities
    initializeIfNeeded,
    refreshData: () => fetchItems(),
    clearError: () => setError(null)
  }
}