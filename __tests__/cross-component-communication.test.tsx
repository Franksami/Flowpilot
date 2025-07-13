/**
 * Cross-Component Communication Tests
 * Tests interactions between different components and shared state management
 */

import React, { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Component imports
import { OnboardingFlow } from '../components/onboarding/onboarding-flow'
import { CmsDataTable } from '../components/cms/cms-data-table'
import { CmsItemDialog } from '../components/cms/cms-item-dialog'

// Store and hook imports
import { useCmsData } from '../lib/hooks/useCmsData'
import { useCmsCollection, useCmsOperations } from '../lib/store'

// Action imports
import * as webflowActions from '../lib/actions/webflow-actions'

// Type imports
import type { WebflowCollection, WebflowCmsItem } from '../lib/types/webflow'

// Mock dependencies
jest.mock('../lib/actions/webflow-actions')
jest.mock('../lib/hooks/useCmsData')
jest.mock('../lib/store')
jest.mock('../lib/errors/handler')

const mockedWebflowActions = webflowActions as jest.Mocked<typeof webflowActions>
const mockedUseCmsData = useCmsData as jest.MockedFunction<typeof useCmsData>
const mockedUseCmsCollection = useCmsCollection as jest.MockedFunction<typeof useCmsCollection>
const mockedUseCmsOperations = useCmsOperations as jest.MockedFunction<typeof useCmsOperations>

// Test data
const mockCollection: WebflowCollection = {
  id: 'test-collection-123',
  displayName: 'Test Products',
  singularName: 'Product',
  slug: 'products',
  fields: [
    { id: 'name', type: 'PlainText', slug: 'name', displayName: 'Name' },
    { id: 'price', type: 'Number', slug: 'price', displayName: 'Price' },
    { id: 'description', type: 'RichText', slug: 'description', displayName: 'Description' }
  ]
}

const mockItems: WebflowCmsItem[] = [
  {
    id: 'item-1',
    cid: 'cid-1',
    createdOn: '2024-01-01T00:00:00.000Z',
    lastUpdated: '2024-01-01T00:00:00.000Z',
    lastPublished: null,
    isDraft: false,
    isArchived: false,
    fieldData: {
      name: 'Test Product 1',
      price: 99.99,
      description: 'A test product'
    }
  }
]

// Test wrapper component that manages multiple interconnected components
const TestComponentWrapper: React.FC<{
  collection: WebflowCollection
  apiKey: string | null
}> = ({ collection, apiKey }) => {
  const [selectedItem, setSelectedItem] = useState<WebflowCmsItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleEditItem = (item: WebflowCmsItem) => {
    setSelectedItem(item)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setSelectedItem(null)
    setDialogOpen(false)
  }

  return (
    <div>
      <CmsDataTable 
        collection={collection} 
        apiKey={apiKey}
        onEditItem={handleEditItem}
      />
      {dialogOpen && selectedItem && (
        <CmsItemDialog
          isOpen={dialogOpen}
          onClose={handleCloseDialog}
          collection={collection}
          item={selectedItem}
          apiKey={apiKey}
        />
      )}
    </div>
  )
}

describe('Cross-Component Communication Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default successful API mocks
    mockedWebflowActions.validateWebflowApiKey.mockResolvedValue({
      valid: true,
      user: { email: 'test@example.com', firstName: 'Test', lastName: 'User' }
    })
    
    mockedWebflowActions.getCmsItems.mockResolvedValue({
      success: true,
      data: {
        items: mockItems,
        pagination: { limit: 10, offset: 0, total: 1 }
      }
    })
    
    mockedWebflowActions.updateCmsItem.mockResolvedValue({
      success: true,
      data: { ...mockItems[0], fieldData: { ...mockItems[0].fieldData, name: 'Updated Product' } }
    })
    
    // Default store mocks
    mockedUseCmsCollection.mockReturnValue({
      items: mockItems,
      loading: false,
      error: null,
      pagination: { currentPage: 1, pageSize: 10, totalItems: 1, searchQuery: '', sortConfig: null },
      isInitialized: true,
      setCmsItems: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      setPagination: jest.fn()
    })
    
    mockedUseCmsOperations.mockReturnValue({
      optimisticOperations: [],
      addOptimisticOperation: jest.fn(),
      removeOptimisticOperation: jest.fn()
    })
    
    mockedUseCmsData.mockReturnValue({
      items: mockItems,
      loading: false,
      error: null,
      pagination: { currentPage: 1, pageSize: 10, totalItems: 1, searchQuery: '', sortConfig: null },
      optimisticOperations: [],
      isInitialized: true,
      fetchItems: jest.fn(),
      createItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      handlePageChange: jest.fn(),
      handlePageSizeChange: jest.fn(),
      handleSearch: jest.fn(),
      handleSort: jest.fn(),
      initializeIfNeeded: jest.fn(),
      refreshData: jest.fn(),
      clearError: jest.fn()
    })
  })

  describe('Table to Dialog Communication', () => {
    it('should pass selected item data from table to dialog', async () => {
      const user = userEvent.setup()
      
      render(<TestComponentWrapper collection={mockCollection} apiKey="test-key" />)
      
      // Find and click edit button for first item
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      // Dialog should open with item data
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      
      // Should display item data in form
      expect(screen.getByDisplayValue('Test Product 1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('99.99')).toBeInTheDocument()
      expect(screen.getByDisplayValue('A test product')).toBeInTheDocument()
    })

    it('should close dialog and refresh table data after successful update', async () => {
      const user = userEvent.setup()
      const mockUpdateItem = jest.fn().mockResolvedValue(undefined)
      const mockRefreshData = jest.fn()
      
      mockedUseCmsData.mockReturnValue({
        ...mockedUseCmsData.mock.results[0].value,
        updateItem: mockUpdateItem,
        refreshData: mockRefreshData
      })
      
      render(<TestComponentWrapper collection={mockCollection} apiKey="test-key" />)
      
      // Open dialog
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      
      // Modify item data
      const nameInput = screen.getByDisplayValue('Test Product 1')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Product Name')
      
      // Save changes
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      // Should call update function
      await waitFor(() => {
        expect(mockUpdateItem).toHaveBeenCalledWith('item-1', {
          name: 'Updated Product Name'
        })
      })
      
      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
      
      // Table should refresh
      expect(mockRefreshData).toHaveBeenCalled()
    })

    it('should handle dialog cancellation without affecting table state', async () => {
      const user = userEvent.setup()
      const mockUpdateItem = jest.fn()
      
      mockedUseCmsData.mockReturnValue({
        ...mockedUseCmsData.mock.results[0].value,
        updateItem: mockUpdateItem
      })
      
      render(<TestComponentWrapper collection={mockCollection} apiKey="test-key" />)
      
      // Open dialog
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      
      // Modify data but cancel
      const nameInput = screen.getByDisplayValue('Test Product 1')
      await user.clear(nameInput)
      await user.type(nameInput, 'Modified but Cancelled')
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      
      // Dialog should close without saving
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
      
      // Update should not be called
      expect(mockUpdateItem).not.toHaveBeenCalled()
      
      // Original data should still be displayed in table
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
  })

  describe('Shared State Management', () => {
    it('should synchronize optimistic updates across components', async () => {
      const user = userEvent.setup()
      const mockAddOptimisticOperation = jest.fn()
      const optimisticOperation = {
        id: 'optimistic-123',
        type: 'update' as const,
        collectionId: mockCollection.id,
        itemId: 'item-1',
        item: { ...mockItems[0], fieldData: { ...mockItems[0].fieldData, name: 'Optimistic Update' } },
        originalItem: mockItems[0],
        timestamp: new Date().toISOString()
      }
      
      mockedUseCmsOperations.mockReturnValue({
        optimisticOperations: [optimisticOperation],
        addOptimisticOperation: mockAddOptimisticOperation,
        removeOptimisticOperation: jest.fn()
      })
      
      mockedUseCmsData.mockReturnValue({
        ...mockedUseCmsData.mock.results[0].value,
        optimisticOperations: [optimisticOperation]
      })
      
      render(<TestComponentWrapper collection={mockCollection} apiKey="test-key" />)
      
      // Should display optimistic update in table
      expect(screen.getByText('Optimistic Update')).toBeInTheDocument()
      expect(screen.getByTestId('optimistic-indicator')).toBeInTheDocument()
      
      // Open dialog - should show optimistic data
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Optimistic Update')).toBeInTheDocument()
      })
    })

    it('should propagate error states between components', async () => {
      const user = userEvent.setup()
      const mockClearError = jest.fn()
      
      mockedUseCmsData.mockReturnValue({
        ...mockedUseCmsData.mock.results[0].value,
        error: 'Network connection failed',
        clearError: mockClearError
      })
      
      render(<TestComponentWrapper collection={mockCollection} apiKey="test-key" />)
      
      // Error should be displayed in table
      expect(screen.getByText(/network connection failed/i)).toBeInTheDocument()
      
      // Error actions should be available
      const retryButton = screen.getByRole('button', { name: /retry/i })
      expect(retryButton).toBeInTheDocument()
      
      await user.click(retryButton)
      
      // Should clear error across all components
      expect(mockClearError).toHaveBeenCalled()
    })

    it('should maintain loading states across component hierarchy', async () => {
      mockedUseCmsData.mockReturnValue({
        ...mockedUseCmsData.mock.results[0].value,
        loading: true,
        items: []
      })
      
      render(<TestComponentWrapper collection={mockCollection} apiKey="test-key" />)
      
      // Should show loading state in table
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      
      // Interaction elements should be disabled during loading
      expect(screen.getByRole('button', { name: /create/i })).toBeDisabled()
    })
  })

  describe('Event Propagation and Callbacks', () => {
    it('should handle cascading updates through component hierarchy', async () => {
      const user = userEvent.setup()
      const mockFetchItems = jest.fn()
      const mockUpdateItem = jest.fn().mockResolvedValue(undefined)
      
      mockedUseCmsData.mockReturnValue({
        ...mockedUseCmsData.mock.results[0].value,
        fetchItems: mockFetchItems,
        updateItem: mockUpdateItem
      })
      
      render(<TestComponentWrapper collection={mockCollection} apiKey="test-key" />)
      
      // Open dialog and make update
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      
      const nameInput = screen.getByDisplayValue('Test Product 1')
      await user.clear(nameInput)
      await user.type(nameInput, 'Cascading Update')
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      // Should trigger update in hook
      await waitFor(() => {
        expect(mockUpdateItem).toHaveBeenCalledWith('item-1', {
          name: 'Cascading Update'
        })
      })
      
      // Should refresh table data
      expect(mockFetchItems).toHaveBeenCalled()
    })

    it('should handle component unmounting during operations', async () => {
      const user = userEvent.setup()
      const mockRemoveOptimisticOperation = jest.fn()
      
      mockedUseCmsOperations.mockReturnValue({
        optimisticOperations: [],
        addOptimisticOperation: jest.fn(),
        removeOptimisticOperation: mockRemoveOptimisticOperation
      })
      
      const { unmount } = render(<TestComponentWrapper collection={mockCollection} apiKey="test-key" />)
      
      // Start an operation
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      // Unmount component during operation
      unmount()
      
      // Should clean up properly without errors
      expect(mockRemoveOptimisticOperation).not.toHaveBeenCalled()
    })
  })

  describe('Multiple Instance Communication', () => {
    it('should synchronize state between multiple table instances', async () => {
      const mockSetCmsItems = jest.fn()
      
      mockedUseCmsCollection.mockReturnValue({
        ...mockedUseCmsCollection.mock.results[0].value,
        setCmsItems: mockSetCmsItems
      })
      
      render(
        <div>
          <CmsDataTable collection={mockCollection} apiKey="test-key" />
          <CmsDataTable collection={mockCollection} apiKey="test-key" />
        </div>
      )
      
      // Both instances should use the same store
      expect(mockedUseCmsCollection).toHaveBeenCalledTimes(2)
      expect(mockedUseCmsCollection).toHaveBeenCalledWith(mockCollection.id)
      
      // Should display same data in both instances
      expect(screen.getAllByText('Test Product 1')).toHaveLength(2)
    })

    it('should isolate operations between different collections', async () => {
      const collection1 = { ...mockCollection, id: 'collection-1' }
      const collection2 = { ...mockCollection, id: 'collection-2' }
      
      render(
        <div>
          <CmsDataTable collection={collection1} apiKey="test-key" />
          <CmsDataTable collection={collection2} apiKey="test-key" />
        </div>
      )
      
      // Should call store with different collection IDs
      expect(mockedUseCmsCollection).toHaveBeenCalledWith('collection-1')
      expect(mockedUseCmsCollection).toHaveBeenCalledWith('collection-2')
    })
  })

  describe('API Key Propagation', () => {
    it('should propagate API key changes through component hierarchy', async () => {
      const { rerender } = render(
        <TestComponentWrapper collection={mockCollection} apiKey={null} />
      )
      
      // Should show no API key state
      expect(screen.getByText(/api key required/i)).toBeInTheDocument()
      
      // Provide API key
      rerender(
        <TestComponentWrapper collection={mockCollection} apiKey="test-key" />
      )
      
      // Should initialize with API key
      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
      })
    })

    it('should handle API key validation across components', async () => {
      const user = userEvent.setup()
      
      // Mock API key validation failure
      mockedWebflowActions.validateWebflowApiKey.mockResolvedValue({
        valid: false,
        error: 'Invalid API key'
      })
      
      render(<OnboardingFlow />)
      
      const apiKeyInput = screen.getByLabelText(/webflow api key/i)
      await user.type(apiKeyInput, 'invalid-key')
      
      const validateButton = screen.getByRole('button', { name: /validate/i })
      await user.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByText(/invalid api key/i)).toBeInTheDocument()
      })
      
      // Should prevent progression to CMS components
      expect(screen.queryByText(/select your site/i)).not.toBeInTheDocument()
    })
  })
})