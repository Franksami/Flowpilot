/**
 * Integration Tests
 * Tests component interactions, API integration, and cross-component communication
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Component imports
import { OnboardingFlow } from '../components/onboarding/onboarding-flow'
import { CmsDataTable } from '../components/cms/cms-data-table'

// Hook and store imports
import { useCmsData } from '../lib/hooks/useCmsData'
import { useCmsCollection } from '../lib/store'

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
  },
  {
    id: 'item-2', 
    cid: 'cid-2',
    createdOn: '2024-01-02T00:00:00.000Z',
    lastUpdated: '2024-01-02T00:00:00.000Z',
    lastPublished: null,
    isDraft: true,
    isArchived: false,
    fieldData: {
      name: 'Test Product 2',
      price: 149.99,
      description: 'Another test product'
    }
  }
]

const mockApiKey = 'a'.repeat(64)

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default successful API mocks
    mockedWebflowActions.validateWebflowApiKey.mockResolvedValue({
      valid: true,
      user: { email: 'test@example.com', firstName: 'Test', lastName: 'User' }
    })
    
    mockedWebflowActions.getWebflowSites.mockResolvedValue({
      success: true,
      sites: [{
        id: 'site-123',
        displayName: 'Test Site',
        shortName: 'test-site',
        slug: 'test-site',
        domains: [{ name: 'test.webflow.io' }]
      }]
    })
    
    mockedWebflowActions.getCmsItems.mockResolvedValue({
      success: true,
      data: {
        items: mockItems,
        pagination: { limit: 10, offset: 0, total: 2 }
      }
    })
    
    // Default hook mocks
    mockedUseCmsCollection.mockReturnValue({
      items: mockItems,
      loading: false,
      error: null,
      pagination: { currentPage: 1, pageSize: 10, totalItems: 2, searchQuery: '', sortConfig: null },
      isInitialized: true,
      setCmsItems: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      setPagination: jest.fn()
    })
    
    mockedUseCmsData.mockReturnValue({
      items: mockItems,
      loading: false,
      error: null,
      pagination: { currentPage: 1, pageSize: 10, totalItems: 2, searchQuery: '', sortConfig: null },
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

  describe('Onboarding to CMS Data Flow Integration', () => {
    it('should complete onboarding flow and initialize CMS data access', async () => {
      const user = userEvent.setup()
      
      render(<OnboardingFlow />)
      
      // Step 1: API Key validation
      const apiKeyInput = screen.getByLabelText(/webflow api key/i)
      await user.type(apiKeyInput, mockApiKey)
      
      const validateButton = screen.getByRole('button', { name: /validate/i })
      await user.click(validateButton)
      
      await waitFor(() => {
        expect(mockedWebflowActions.validateWebflowApiKey).toHaveBeenCalledWith(mockApiKey)
      })
      
      // Step 2: Site selection
      await waitFor(() => {
        expect(screen.getByText(/select your site/i)).toBeInTheDocument()
      })
      
      const siteOption = await screen.findByText('Test Site')
      await user.click(siteOption)
      
      // Step 3: Connection test
      const testConnectionButton = screen.getByRole('button', { name: /test connection/i })
      await user.click(testConnectionButton)
      
      await waitFor(() => {
        expect(mockedWebflowActions.getWebflowSites).toHaveBeenCalledWith(mockApiKey)
      })
      
      // Step 4: Completion - should enable CMS access
      await waitFor(() => {
        expect(screen.getByText(/setup complete/i)).toBeInTheDocument()
      })
      
      // Verify API key is stored for subsequent CMS operations
      expect(localStorage.getItem('webflow_api_key')).toBe(mockApiKey)
    })

    it('should handle API validation errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock API validation failure
      mockedWebflowActions.validateWebflowApiKey.mockResolvedValue({
        valid: false,
        error: 'Invalid API key format'
      })
      
      render(<OnboardingFlow />)
      
      const apiKeyInput = screen.getByLabelText(/webflow api key/i)
      await user.type(apiKeyInput, 'invalid-key')
      
      const validateButton = screen.getByRole('button', { name: /validate/i })
      await user.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByText(/invalid api key format/i)).toBeInTheDocument()
      })
      
      // Should not proceed to next step
      expect(screen.queryByText(/select your site/i)).not.toBeInTheDocument()
    })
  })

  describe('CMS Data Operations Integration', () => {
    it('should integrate hook state management with API operations', async () => {
      const user = userEvent.setup()
      const mockFetchItems = jest.fn()
      const mockCreateItem = jest.fn()
      const mockUpdateItem = jest.fn()
      const mockDeleteItem = jest.fn()
      
      mockedUseCmsData.mockReturnValue({
        ...mockedUseCmsData.mock.results[0].value,
        fetchItems: mockFetchItems,
        createItem: mockCreateItem,
        updateItem: mockUpdateItem,
        deleteItem: mockDeleteItem
      })
      
      render(<CmsDataTable collection={mockCollection} apiKey={mockApiKey} />)
      
      // Verify initial data load
      expect(mockFetchItems).toHaveBeenCalled()
      
      // Test create operation
      const createButton = screen.getByRole('button', { name: /create/i })
      await user.click(createButton)
      
      // Fill in form (simplified)
      const nameInput = screen.getByLabelText(/name/i)
      await user.type(nameInput, 'New Product')
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockCreateItem).toHaveBeenCalledWith({ name: 'New Product' })
      })
    })

    it('should handle optimistic updates correctly', async () => {
      const user = userEvent.setup()
      const mockOptimisticOperations = [
        {
          id: 'optimistic-123',
          type: 'create' as const,
          collectionId: mockCollection.id,
          item: {
            id: 'optimistic-123',
            cid: 'optimistic-123',
            createdOn: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            lastPublished: null,
            isDraft: true,
            isArchived: false,
            fieldData: { name: 'Optimistic Product', price: 199.99 }
          },
          timestamp: new Date().toISOString()
        }
      ]
      
      mockedUseCmsData.mockReturnValue({
        ...mockedUseCmsData.mock.results[0].value,
        optimisticOperations: mockOptimisticOperations
      })
      
      render(<CmsDataTable collection={mockCollection} apiKey={mockApiKey} />)
      
      // Should display optimistic item with loading indicator
      expect(screen.getByText('Optimistic Product')).toBeInTheDocument()
      expect(screen.getByTestId('optimistic-indicator')).toBeInTheDocument()
    })

    it('should sync pagination state across operations', async () => {
      const user = userEvent.setup()
      const mockHandlePageChange = jest.fn()
      const mockHandleSearch = jest.fn()
      
      mockedUseCmsData.mockReturnValue({
        ...mockedUseCmsData.mock.results[0].value,
        handlePageChange: mockHandlePageChange,
        handleSearch: mockHandleSearch,
        pagination: { currentPage: 2, pageSize: 10, totalItems: 25, searchQuery: 'test', sortConfig: null }
      })
      
      render(<CmsDataTable collection={mockCollection} apiKey={mockApiKey} />)
      
      // Test pagination
      const nextPageButton = screen.getByRole('button', { name: /next page/i })
      await user.click(nextPageButton)
      
      expect(mockHandlePageChange).toHaveBeenCalledWith(3)
      
      // Test search
      const searchInput = screen.getByRole('textbox', { name: /search/i })
      await user.clear(searchInput)
      await user.type(searchInput, 'new search')
      
      // Debounced search should trigger
      await waitFor(() => {
        expect(mockHandleSearch).toHaveBeenCalledWith('new search')
      }, { timeout: 2000 })
    })
  })

  describe('Error Handling Integration', () => {
    it('should propagate API errors through the component hierarchy', async () => {
      const user = userEvent.setup()
      
      // Mock API error
      mockedWebflowActions.getCmsItems.mockResolvedValue({
        success: false,
        error: 'Network timeout error'
      })
      
      mockedUseCmsData.mockReturnValue({
        ...mockedUseCmsData.mock.results[0].value,
        error: 'Network timeout error',
        loading: false
      })
      
      render(<CmsDataTable collection={mockCollection} apiKey={mockApiKey} />)
      
      // Should display error state
      expect(screen.getByText(/network timeout error/i)).toBeInTheDocument()
      
      // Should show retry option
      const retryButton = screen.getByRole('button', { name: /retry/i })
      expect(retryButton).toBeInTheDocument()
      
      await user.click(retryButton)
      
      // Should attempt to clear error and refetch
      expect(mockedUseCmsData.mock.results[0].value.clearError).toHaveBeenCalled()
    })

    it('should handle concurrent operation conflicts', async () => {
      const user = userEvent.setup()
      const mockUpdateItem = jest.fn()
      
      // Simulate concurrent update scenario
      mockedUseCmsData.mockReturnValue({
        ...mockedUseCmsData.mock.results[0].value,
        updateItem: mockUpdateItem,
        optimisticOperations: [
          {
            id: 'update-1',
            type: 'update' as const,
            collectionId: mockCollection.id,
            itemId: 'item-1',
            item: { ...mockItems[0], fieldData: { ...mockItems[0].fieldData, name: 'Updated Name' } },
            originalItem: mockItems[0],
            timestamp: new Date().toISOString()
          }
        ]
      })
      
      render(<CmsDataTable collection={mockCollection} apiKey={mockApiKey} />)
      
      // Should show optimistic update state
      expect(screen.getByText('Updated Name')).toBeInTheDocument()
      expect(screen.getByTestId('optimistic-indicator')).toBeInTheDocument()
      
      // Attempting another update should be handled gracefully
      const editButton = screen.getAllByRole('button', { name: /edit/i })[0]
      await user.click(editButton)
      
      // Should indicate operation in progress
      expect(screen.getByText(/operation in progress/i)).toBeInTheDocument()
    })
  })

  describe('State Management Integration', () => {
    it('should maintain state consistency across multiple components', async () => {
      const mockSetCmsItems = jest.fn()
      const mockSetLoading = jest.fn()
      
      mockedUseCmsCollection.mockReturnValue({
        ...mockedUseCmsCollection.mock.results[0].value,
        setCmsItems: mockSetCmsItems,
        setLoading: mockSetLoading
      })
      
      // Render multiple components that use the same collection
      const { rerender } = render(
        <div>
          <CmsDataTable collection={mockCollection} apiKey={mockApiKey} />
          <CmsDataTable collection={mockCollection} apiKey={mockApiKey} />
        </div>
      )
      
      // Both components should use the same store state
      expect(mockedUseCmsCollection).toHaveBeenCalledTimes(2)
      expect(mockedUseCmsCollection).toHaveBeenCalledWith(mockCollection.id)
      
      // State updates should affect both components
      rerender(
        <div>
          <CmsDataTable collection={mockCollection} apiKey={mockApiKey} />
          <CmsDataTable collection={mockCollection} apiKey={mockApiKey} />
        </div>
      )
      
      // Verify shared state management
      expect(screen.getAllByText('Test Product 1')).toHaveLength(2)
    })

    it('should isolate state between different collections', async () => {
      const secondCollection: WebflowCollection = {
        ...mockCollection,
        id: 'different-collection-456',
        displayName: 'Different Collection'
      }
      
      render(
        <div>
          <CmsDataTable collection={mockCollection} apiKey={mockApiKey} />
          <CmsDataTable collection={secondCollection} apiKey={mockApiKey} />
        </div>
      )
      
      // Should call store with different collection IDs
      expect(mockedUseCmsCollection).toHaveBeenCalledWith(mockCollection.id)
      expect(mockedUseCmsCollection).toHaveBeenCalledWith(secondCollection.id)
      expect(mockedUseCmsCollection).toHaveBeenCalledTimes(2)
    })
  })

  describe('Performance Integration', () => {
    it('should efficiently handle large datasets with pagination', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        ...mockItems[0],
        id: `item-${i}`,
        fieldData: { ...mockItems[0].fieldData, name: `Product ${i}` }
      }))
      
      mockedUseCmsData.mockReturnValue({
        ...mockedUseCmsData.mock.results[0].value,
        items: largeDataset.slice(0, 10), // First page
        pagination: { currentPage: 1, pageSize: 10, totalItems: 100, searchQuery: '', sortConfig: null }
      })
      
      render(<CmsDataTable collection={mockCollection} apiKey={mockApiKey} />)
      
      // Should only render current page items
      expect(screen.getAllByTestId('cms-item-row')).toHaveLength(10)
      
      // Should show pagination controls
      expect(screen.getByText('Page 1 of 10')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument()
    })

    it('should debounce search operations', async () => {
      jest.useFakeTimers()
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      const mockHandleSearch = jest.fn()
      
      mockedUseCmsData.mockReturnValue({
        ...mockedUseCmsData.mock.results[0].value,
        handleSearch: mockHandleSearch
      })
      
      render(<CmsDataTable collection={mockCollection} apiKey={mockApiKey} />)
      
      const searchInput = screen.getByRole('textbox', { name: /search/i })
      
      // Type rapidly
      await user.type(searchInput, 'search')
      
      // Should not trigger immediately
      expect(mockHandleSearch).not.toHaveBeenCalled()
      
      // Advance timers to trigger debounce
      jest.advanceTimersByTime(500)
      
      expect(mockHandleSearch).toHaveBeenCalledWith('search')
      expect(mockHandleSearch).toHaveBeenCalledTimes(1)
      
      jest.useRealTimers()
    })
  })
})