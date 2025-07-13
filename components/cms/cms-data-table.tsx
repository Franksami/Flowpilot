/**
 * CMS Data Table Component
 * Professional table with search, sorting, and pagination for CMS items
 * Integrated with centralized state management
 */

'use client'

import {
  ChevronDown,
  ChevronUp,
  Search,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
} from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCmsData } from '@/lib/hooks/useCmsData'
import { useAppStore, type OptimisticOperation } from '@/lib/store'
import type { WebflowCollection, WebflowField, WebflowCmsItem } from '@/lib/types/webflow'

import { CmsItemDialog } from './cms-item-dialog'

interface CmsDataTableProps {
  collection: WebflowCollection
}

type SortConfig = {
  field: string
  direction: 'asc' | 'desc'
} | null

export function CmsDataTable({ collection }: CmsDataTableProps) {
  const { apiKey } = useAppStore()
  const {
    items,
    loading,
    error,
    pagination,
    optimisticOperations,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    handlePageChange,
    handlePageSizeChange,
    handleSearch,
    handleSort,
    initializeIfNeeded,
    clearError,
  } = useCmsData(collection, apiKey)

  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)

  // Initialize collection data on mount
  useEffect(() => {
    initializeIfNeeded()
    fetchItems()
  }, [initializeIfNeeded, fetchItems])

  // Helper to check if item has pending operations
  const getItemOperationStatus = (itemId: string) => {
    const operation = optimisticOperations.find(
      (op: OptimisticOperation) => op.itemId === itemId || op.item?.id === itemId
    )
    return operation ? operation.type : null
  }

  const isOptimisticItem = (itemId: string) => {
    return itemId.startsWith('optimistic-')
  }

  // Get visible fields from collection
  const visibleFields = useMemo(() => {
    return collection.fields.filter((field) => !field.archived && field.editable).slice(0, 6) // Limit to first 6 fields for table width
  }, [collection.fields])

  // Filter items based on search query (client-side)
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items

    return items.filter((item) => {
      // Search across all field values
      const searchableText = Object.values(item.fieldData)
        .map((value) => String(value || '').toLowerCase())
        .join(' ')

      return searchableText.includes(searchQuery.toLowerCase())
    })
  }, [items, searchQuery])

  // Handle search input
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    handleSearch(value)
  }

  // Handle sorting
  const handleSortClick = (fieldSlug: string) => {
    let direction: 'asc' | 'desc' = 'asc'

    if (sortConfig && sortConfig.field === fieldSlug && sortConfig.direction === 'asc') {
      direction = 'desc'
    }

    setSortConfig({ field: fieldSlug, direction })
    handleSort(fieldSlug, direction)
  }

  // Calculate pagination info (use filtered items for client-side search)
  const displayItems = searchQuery ? filteredItems : items
  const totalDisplayItems = searchQuery ? filteredItems.length : pagination.totalItems
  const totalPages = Math.ceil(totalDisplayItems / pagination.pageSize)
  const startItem = (pagination.currentPage - 1) * pagination.pageSize + 1
  const endItem = Math.min(pagination.currentPage * pagination.pageSize, totalDisplayItems)

  // Paginate the display items for client-side pagination
  const paginatedItems = useMemo(() => {
    if (!searchQuery) return displayItems // Server-side pagination

    const start = (pagination.currentPage - 1) * pagination.pageSize
    return filteredItems.slice(start, start + pagination.pageSize)
  }, [displayItems, filteredItems, searchQuery, pagination.currentPage, pagination.pageSize])

  // Format field value for display
  const formatFieldValue = (item: WebflowCmsItem, field: WebflowField) => {
    const value = item.fieldData[field.slug]

    if (value === null || value === undefined) {
      return '-'
    }

    // Handle different field types
    switch (field.type) {
      case 'Date':
        return value ? new Date(value).toLocaleDateString() : '-'
      case 'DateTime':
        return value ? new Date(value).toLocaleString() : '-'
      case 'Bool':
        return value ? 'Yes' : 'No'
      case 'Number':
        return typeof value === 'number' ? value.toLocaleString() : value
      case 'RichText':
        // Strip HTML and truncate
        const text = value.replace(/<[^>]*>/g, '')
        return text.length > 50 ? `${text.substring(0, 50)}...` : text
      case 'PlainText':
      case 'Email':
      case 'Phone':
      case 'Link':
        return typeof value === 'string' && value.length > 50
          ? `${value.substring(0, 50)}...`
          : value
      default:
        return String(value)
    }
  }

  const getSortIcon = (fieldSlug: string) => {
    if (!sortConfig || sortConfig.field !== fieldSlug) {
      return <ArrowUpDown className='ml-2 h-4 w-4' />
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className='ml-2 h-4 w-4' />
    ) : (
      <ChevronDown className='ml-2 h-4 w-4' />
    )
  }

  return (
    <div className='space-y-4'>
      {/* Error Display */}
      {error && (
        <div className='rounded-md border border-red-200 bg-red-50 p-4'>
          <div className='flex items-center justify-between'>
            <span className='text-red-700'>{error}</span>
            <Button size='sm' variant='outline' onClick={clearError}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Search and Controls */}
      <div className='flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
        <div className='flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2'>
          <div className='relative'>
            <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
            <Input
              placeholder='Search items...'
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className='w-full pl-8 sm:w-64'
            />
          </div>
          <div className='text-muted-foreground text-sm'>
            {searchQuery
              ? `${filteredItems.length} of ${pagination.totalItems} items`
              : `${pagination.totalItems} total items`}
          </div>
        </div>

        <div className='flex items-center space-x-2'>
          <CmsItemDialog
            collection={collection}
            mode='create'
            onSave={createItem}
            trigger={<Button>Create New {collection.singularName}</Button>}
          />
          <span className='text-muted-foreground hidden text-sm sm:inline'>Items per page:</span>
          <select
            value={pagination.pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className='border-input bg-background rounded-md border px-3 py-1 text-sm'
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className='overflow-hidden rounded-md border'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-20'>Status</TableHead>
                {visibleFields.map((field) => (
                  <TableHead key={field.slug} className='min-w-32'>
                    <Button
                      variant='ghost'
                      onClick={() => handleSortClick(field.slug)}
                      className='h-auto p-0 font-medium hover:bg-transparent'
                    >
                      {field.name}
                      {getSortIcon(field.slug)}
                    </Button>
                  </TableHead>
                ))}
                <TableHead className='w-32'>Last Updated</TableHead>
                <TableHead className='w-24'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={visibleFields.length + 3} className='py-8 text-center'>
                    Loading...
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleFields.length + 3}
                    className='text-muted-foreground py-8 text-center'
                  >
                    {searchQuery ? 'No items match your search' : 'No items found'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item) => {
                  const operationStatus = getItemOperationStatus(item.id)
                  const isOptimistic = isOptimisticItem(item.id)

                  return (
                    <TableRow
                      key={item.id}
                      className={operationStatus ? 'opacity-75 transition-opacity' : ''}
                    >
                      <TableCell>
                        <div className='flex flex-wrap gap-1'>
                          {/* Operation Status Indicators */}
                          {operationStatus && (
                            <span className='flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800'>
                              <Loader2 className='h-3 w-3 animate-spin' />
                              {operationStatus === 'create' && 'Creating...'}
                              {operationStatus === 'update' && 'Updating...'}
                              {operationStatus === 'delete' && 'Deleting...'}
                            </span>
                          )}

                          {isOptimistic && !operationStatus && (
                            <span className='rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800'>
                              New
                            </span>
                          )}

                          {/* Regular Status Badges */}
                          {item.isDraft && (
                            <span className='rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800'>
                              Draft
                            </span>
                          )}
                          {item.isArchived && (
                            <span className='rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800'>
                              Archived
                            </span>
                          )}
                          {!item.isDraft && !item.isArchived && !isOptimistic && (
                            <span className='rounded-full bg-green-100 px-2 py-1 text-xs text-green-800'>
                              Published
                            </span>
                          )}
                        </div>
                      </TableCell>
                      {visibleFields.map((field) => (
                        <TableCell key={field.slug} className='max-w-48'>
                          <div
                            className='truncate'
                            title={String(item.fieldData[field.slug] || '')}
                          >
                            {formatFieldValue(item, field)}
                          </div>
                        </TableCell>
                      ))}
                      <TableCell className='text-muted-foreground text-sm'>
                        {new Date(item.lastUpdated).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' className='h-8 w-8 p-0'>
                              <span className='sr-only'>Open menu</span>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end' className='w-48'>
                            <CmsItemDialog
                              collection={collection}
                              item={item}
                              mode='view'
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Eye className='mr-2 h-4 w-4' />
                                  View Details
                                </DropdownMenuItem>
                              }
                            />

                            <CmsItemDialog
                              collection={collection}
                              item={item}
                              mode='edit'
                              onSave={(data) => updateItem(item.id, data)}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Edit className='mr-2 h-4 w-4' />
                                  Edit Item
                                </DropdownMenuItem>
                              }
                            />

                            <CmsItemDialog
                              collection={collection}
                              item={item}
                              mode='delete'
                              onDelete={() => deleteItem(item.id)}
                              trigger={
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className='text-red-600 focus:text-red-600'
                                >
                                  <Trash2 className='mr-2 h-4 w-4' />
                                  Delete Item
                                </DropdownMenuItem>
                              }
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className='flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
        <div className='text-muted-foreground text-sm'>
          Showing {startItem} to {endItem} of {totalDisplayItems} items
        </div>

        <div className='flex items-center justify-center space-x-2 sm:justify-end'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage <= 1}
            className='hidden sm:inline-flex'
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage <= 1}
            className='sm:hidden'
          >
            Prev
          </Button>

          <div className='flex items-center space-x-1'>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, pagination.currentPage - 2) + i
              if (pageNum > totalPages) return null

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.currentPage ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => handlePageChange(pageNum)}
                  className='w-8'
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
