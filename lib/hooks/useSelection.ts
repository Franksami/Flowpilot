/**
 * useSelection Hook
 * Custom hook for managing bulk selection state in CMS collections
 */

'use client'

import { useCallback, useMemo } from 'react'

import { useAppStore } from '@/lib/store'
import type { WebflowCmsItem } from '@/lib/types/webflow'

export function useSelection(collectionId: string) {
  const {
    cmsCollections,
    selectItem,
    deselectItem,
    selectAll,
    clearSelection,
    toggleItemSelection,
    setSelectedItems,
  } = useAppStore()

  const collection = cmsCollections[collectionId]
  const selectedItems = collection?.selectedItems || new Set<string>()

  // Convert Set to array for easier manipulation
  const selectedItemIds = useMemo(() => Array.from(selectedItems), [selectedItems])

  // Check if an item is selected
  const isSelected = useCallback((itemId: string) => selectedItems.has(itemId), [selectedItems])

  // Get selection count
  const selectionCount = selectedItems.size

  // Handle single item selection
  const handleSelectItem = useCallback(
    (itemId: string) => {
      selectItem(collectionId, itemId)
    },
    [collectionId, selectItem]
  )

  // Handle single item deselection
  const handleDeselectItem = useCallback(
    (itemId: string) => {
      deselectItem(collectionId, itemId)
    },
    [collectionId, deselectItem]
  )

  // Handle toggle selection
  const handleToggleItem = useCallback(
    (itemId: string) => {
      toggleItemSelection(collectionId, itemId)
    },
    [collectionId, toggleItemSelection]
  )

  // Handle select all items
  const handleSelectAll = useCallback(
    (items: WebflowCmsItem[]) => {
      const itemIds = items.map((item) => item.id)
      selectAll(collectionId, itemIds)
    },
    [collectionId, selectAll]
  )

  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    clearSelection(collectionId)
  }, [collectionId, clearSelection])

  // Handle range selection (shift+click)
  const handleRangeSelection = useCallback(
    (startId: string, endId: string, items: WebflowCmsItem[]) => {
      const startIndex = items.findIndex((item) => item.id === startId)
      const endIndex = items.findIndex((item) => item.id === endId)

      if (startIndex === -1 || endIndex === -1) return

      const start = Math.min(startIndex, endIndex)
      const end = Math.max(startIndex, endIndex)

      const rangeItems = items.slice(start, end + 1).map((item) => item.id)
      const newSelection = new Set([...selectedItemIds, ...rangeItems])

      setSelectedItems(collectionId, Array.from(newSelection))
    },
    [collectionId, selectedItemIds, setSelectedItems]
  )

  // Check if all items are selected
  const areAllItemsSelected = useCallback(
    (items: WebflowCmsItem[]) => {
      if (items.length === 0) return false
      return items.every((item) => selectedItems.has(item.id))
    },
    [selectedItems]
  )

  // Check if some items are selected (for indeterminate state)
  const areSomeItemsSelected = useCallback(
    (items: WebflowCmsItem[]) => {
      if (items.length === 0) return false
      const selectedCount = items.filter((item) => selectedItems.has(item.id)).length
      return selectedCount > 0 && selectedCount < items.length
    },
    [selectedItems]
  )

  return {
    selectedItems,
    selectedItemIds,
    selectionCount,
    isSelected,
    handleSelectItem,
    handleDeselectItem,
    handleToggleItem,
    handleSelectAll,
    handleClearSelection,
    handleRangeSelection,
    areAllItemsSelected,
    areSomeItemsSelected,
  }
}
