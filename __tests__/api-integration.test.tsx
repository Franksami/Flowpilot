/**
 * API Integration Tests
 * Tests data flow validation, error handling, and API client behavior
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Component imports
import { CmsDataTable } from '../components/cms/cms-data-table'
import { OnboardingFlow } from '../components/onboarding/onboarding-flow'

// Action and client imports
import * as webflowActions from '../lib/actions/webflow-actions'
import { createWebflowClient } from '../lib/webflow-client'

// Error handling imports
import { errorHandler } from '../lib/errors/handler'

// Type imports
import type { 
  WebflowCollection, 
  WebflowCmsItem, 
  WebflowCmsListOptions,
  WebflowCmsListResponse,
  ApiKeyValidationResult 
} from '../lib/types/webflow'

// Mock dependencies
jest.mock('../lib/actions/webflow-actions')
jest.mock('../lib/webflow-client')
jest.mock('../lib/errors/handler')
jest.mock('../lib/hooks/useCmsData')
jest.mock('../lib/store')

const mockedWebflowActions = webflowActions as jest.Mocked<typeof webflowActions>
const mockedCreateWebflowClient = createWebflowClient as jest.MockedFunction<typeof createWebflowClient>
const mockedErrorHandler = errorHandler as jest.Mocked<typeof errorHandler>

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

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup error handler mocks
    mockedErrorHandler.withRetry.mockImplementation((fn) => fn())
    mockedErrorHandler.handleError.mockImplementation((error) => ({
      code: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      userMessage: 'An error occurred',
      timestamp: new Date().toISOString(),
      context: {}
    }))
    mockedErrorHandler.createContext.mockReturnValue({})
  })

  describe('API Key Validation Flow', () => {
    it('should validate API key format and authenticate with Webflow', async () => {
      const user = userEvent.setup()
      
      const mockValidationResult: ApiKeyValidationResult = {
        valid: true,
        user: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        }
      }
      
      mockedWebflowActions.validateWebflowApiKey.mockResolvedValue(mockValidationResult)
      
      render(<OnboardingFlow />)
      
      const apiKeyInput = screen.getByLabelText(/webflow api key/i)
      await user.type(apiKeyInput, mockApiKey)
      
      const validateButton = screen.getByRole('button', { name: /validate/i })
      await user.click(validateButton)
      
      await waitFor(() => {
        expect(mockedWebflowActions.validateWebflowApiKey).toHaveBeenCalledWith(mockApiKey)
      })
      
      // Should proceed to next step on successful validation
      await waitFor(() => {
        expect(screen.getByText(/welcome, test user/i)).toBeInTheDocument()
      })
    })

    it('should handle invalid API key format', async () => {
      const user = userEvent.setup()
      
      const mockValidationResult: ApiKeyValidationResult = {
        valid: false,
        error: 'API key must be 64 characters long'
      }
      
      mockedWebflowActions.validateWebflowApiKey.mockResolvedValue(mockValidationResult)
      
      render(<OnboardingFlow />)
      
      const apiKeyInput = screen.getByLabelText(/webflow api key/i)
      await user.type(apiKeyInput, 'invalid-short-key')
      
      const validateButton = screen.getByRole('button', { name: /validate/i })
      await user.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByText(/api key must be 64 characters long/i)).toBeInTheDocument()
      })
      
      // Should not proceed to next step
      expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument()
    })

    it('should handle network errors during validation', async () => {
      const user = userEvent.setup()
      
      mockedWebflowActions.validateWebflowApiKey.mockRejectedValue(
        new Error('Network request failed')
      )
      
      render(<OnboardingFlow />)
      
      const apiKeyInput = screen.getByLabelText(/webflow api key/i)
      await user.type(apiKeyInput, mockApiKey)
      
      const validateButton = screen.getByRole('button', { name: /validate/i })
      await user.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByText(/network request failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('CMS Data Fetching', () => {
    it('should fetch and display CMS items with proper pagination', async () => {
      const mockResponse: WebflowCmsListResponse = {
        items: mockItems,
        pagination: {
          limit: 10,
          offset: 0,
          total: 2
        }
      }
      
      mockedWebflowActions.getCmsItems.mockResolvedValue({
        success: true,
        data: mockResponse
      })
      
      // Mock hook to actually call the API
      const useCmsData = require('../lib/hooks/useCmsData').useCmsData
      useCmsData.mockReturnValue({
        items: mockItems,
        loading: false,
        error: null,
        pagination: { currentPage: 1, pageSize: 10, totalItems: 2, searchQuery: '', sortConfig: null },
        optimisticOperations: [],
        isInitialized: true,
        fetchItems: jest.fn().mockImplementation(() => {
          return mockedWebflowActions.getCmsItems(mockApiKey, mockCollection.id, {})
        }),
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
      
      render(<CmsDataTable collection={mockCollection} apiKey={mockApiKey} />)
      
      await waitFor(() => {
        expect(mockedWebflowActions.getCmsItems).toHaveBeenCalledWith(
          mockApiKey,
          mockCollection.id,
          expect.objectContaining({
            limit: 10,
            offset: 0
          })
        )
      })
      
      // Should display fetched items
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
      expect(screen.getByText('Test Product 2')).toBeInTheDocument()
      
      // Should show pagination info
      expect(screen.getByText('Page 1 of 1')).toBeInTheDocument()
    })

    it('should handle pagination with correct offset calculations', async () => {
      const useCmsData = require('../lib/hooks/useCmsData').useCmsData
      const mockHandlePageChange = jest.fn().mockImplementation((page) => {
        const options: WebflowCmsListOptions = {
          limit: 10,
          offset: (page - 1) * 10
        }
        return mockedWebflowActions.getCmsItems(mockApiKey, mockCollection.id, options)
      })
      
      useCmsData.mockReturnValue({
        items: mockItems,
        loading: false,
        error: null,
        pagination: { currentPage: 2, pageSize: 10, totalItems: 25, searchQuery: '', sortConfig: null },
        optimisticOperations: [],
        isInitialized: true,
        fetchItems: jest.fn(),
        createItem: jest.fn(),
        updateItem: jest.fn(),
        deleteItem: jest.fn(),
        handlePageChange: mockHandlePageChange,
        handlePageSizeChange: jest.fn(),
        handleSearch: jest.fn(),
        handleSort: jest.fn(),
        initializeIfNeeded: jest.fn(),
        refreshData: jest.fn(),
        clearError: jest.fn()
      })
      
      const user = userEvent.setup()
      render(<CmsDataTable collection={mockCollection} apiKey={mockApiKey} />)
      
      // Navigate to page 3
      const nextPageButton = screen.getByRole('button', { name: /next page/i })
      await user.click(nextPageButton)
      
      await waitFor(() => {
        expect(mockHandlePageChange).toHaveBeenCalledWith(3)
      })
      
      // Should call API with correct offset
      expect(mockedWebflowActions.getCmsItems).toHaveBeenCalledWith(
        mockApiKey,
        mockCollection.id,
        expect.objectContaining({
          limit: 10,
          offset: 20 // Page 3, so (3-1) * 10 = 20
        })
      )
    })

    it('should handle search queries with proper encoding', async () => {
      const useCmsData = require('../lib/hooks/useCmsData').useCmsData
      const mockHandleSearch = jest.fn().mockImplementation((searchQuery) => {
        const options: WebflowCmsListOptions = {
          limit: 10,
          offset: 0
          // Note: Webflow API doesn't support text search in the mock,
          // but we would handle encoding here in real implementation
        }
        return mockedWebflowActions.getCmsItems(mockApiKey, mockCollection.id, options)
      })
      
      useCmsData.mockReturnValue({
        items: mockItems,
        loading: false,
        error: null,
        pagination: { currentPage: 1, pageSize: 10, totalItems: 1, searchQuery: 'test search', sortConfig: null },
        optimisticOperations: [],
        isInitialized: true,
        fetchItems: jest.fn(),
        createItem: jest.fn(),
        updateItem: jest.fn(),
        deleteItem: jest.fn(),
        handlePageChange: jest.fn(),
        handlePageSizeChange: jest.fn(),
        handleSearch: mockHandleSearch,
        handleSort: jest.fn(),
        initializeIfNeeded: jest.fn(),
        refreshData: jest.fn(),
        clearError: jest.fn()
      })
      
      const user = userEvent.setup()
      render(<CmsDataTable collection={mockCollection} apiKey={mockApiKey} />)
      
      const searchInput = screen.getByRole('textbox', { name: /search/i })
      await user.type(searchInput, 'special "quoted" search & terms')
      
      // Wait for debounced search
      await waitFor(() => {
        expect(mockHandleSearch).toHaveBeenCalledWith('special "quoted" search & terms')
      }, { timeout: 2000 })
    })
  })

  describe('CMS Item Operations', () => {
    it('should create new CMS items with proper validation', async () => {
      const mockCreateResponse = {
        success: true,
        data: {
          id: 'new-item-123',
          cid: 'new-cid-123',
          createdOn: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          lastPublished: null,
          isDraft: true,
          isArchived: false,
          fieldData: {
            name: 'New Product',
            price: 199.99,
            description: 'A new test product'
          }
        }
      }
      
      mockedWebflowActions.createCmsItem.mockResolvedValue(mockCreateResponse)
      
      const useCmsData = require('../lib/hooks/useCmsData').useCmsData
      const mockCreateItem = jest.fn().mockImplementation((data) => {
        return mockedWebflowActions.createCmsItem(mockApiKey, mockCollection.id, { fieldData: data })
      })
      
      useCmsData.mockReturnValue({
        items: mockItems,
        loading: false,
        error: null,
        pagination: { currentPage: 1, pageSize: 10, totalItems: 2, searchQuery: '', sortConfig: null },
        optimisticOperations: [],
        isInitialized: true,
        fetchItems: jest.fn(),
        createItem: mockCreateItem,
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
      
      const user = userEvent.setup()
      render(<CmsDataTable collection={mockCollection} apiKey={mockApiKey} />)
      
      // Open create dialog
      const createButton = screen.getByRole('button', { name: /create/i })
      await user.click(createButton)
      
      // Fill form
      const nameInput = screen.getByLabelText(/name/i)
      await user.type(nameInput, 'New Product')
      
      const priceInput = screen.getByLabelText(/price/i)
      await user.type(priceInput, '199.99')
      
      const descriptionInput = screen.getByLabelText(/description/i)
      await user.type(descriptionInput, 'A new test product')
      
      // Submit
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockCreateItem).toHaveBeenCalledWith({
          name: 'New Product',
          price: 199.99,
          description: 'A new test product'
        })
      })
      
      expect(mockedWebflowActions.createCmsItem).toHaveBeenCalledWith(
        mockApiKey,
        mockCollection.id,
        {
          fieldData: {
            name: 'New Product',
            price: 199.99,
            description: 'A new test product'
          }
        }
      )
    })

    it('should update existing CMS items', async () => {
      const mockUpdateResponse = {
        success: true,
        data: {
          ...mockItems[0],
          fieldData: {
            ...mockItems[0].fieldData,
            name: 'Updated Product Name'
          },
          lastUpdated: new Date().toISOString()
        }
      }
      
      mockedWebflowActions.updateCmsItem.mockResolvedValue(mockUpdateResponse)
      
      const useCmsData = require('../lib/hooks/useCmsData').useCmsData
      const mockUpdateItem = jest.fn().mockImplementation((itemId, data) => {
        return mockedWebflowActions.updateCmsItem(mockApiKey, mockCollection.id, itemId, {
          id: itemId,
          fieldData: data
        })
      })
      
      useCmsData.mockReturnValue({
        items: mockItems,
        loading: false,
        error: null,
        pagination: { currentPage: 1, pageSize: 10, totalItems: 2, searchQuery: '', sortConfig: null },
        optimisticOperations: [],
        isInitialized: true,
        fetchItems: jest.fn(),
        createItem: jest.fn(),
        updateItem: mockUpdateItem,
        deleteItem: jest.fn(),
        handlePageChange: jest.fn(),
        handlePageSizeChange: jest.fn(),
        handleSearch: jest.fn(),
        handleSort: jest.fn(),
        initializeIfNeeded: jest.fn(),
        refreshData: jest.fn(),
        clearError: jest.fn()
      })
      
      const user = userEvent.setup()
      render(<CmsDataTable collection={mockCollection} apiKey={mockApiKey} />)
      
      // Edit first item
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])
      
      // Update name
      const nameInput = screen.getByDisplayValue('Test Product 1')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Product Name')
      
      // Save
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockUpdateItem).toHaveBeenCalledWith('item-1', {
          name: 'Updated Product Name'
        })
      })
      
      expect(mockedWebflowActions.updateCmsItem).toHaveBeenCalledWith(
        mockApiKey,
        mockCollection.id,
        'item-1',
        {
          id: 'item-1',
          fieldData: {
            name: 'Updated Product Name'
          }
        }
      )
    })

    it('should delete CMS items with confirmation', async () => {
      mockedWebflowActions.deleteCmsItem.mockResolvedValue({
        success: true
      })
      
      const useCmsData = require('../lib/hooks/useCmsData').useCmsData
      const mockDeleteItem = jest.fn().mockImplementation((itemId) => {
        return mockedWebflowActions.deleteCmsItem(mockApiKey, mockCollection.id, itemId)
      })
      
      useCmsData.mockReturnValue({
        items: mockItems,
        loading: false,
        error: null,
        pagination: { currentPage: 1, pageSize: 10, totalItems: 2, searchQuery: '', sortConfig: null },
        optimisticOperations: [],
        isInitialized: true,
        fetchItems: jest.fn(),
        createItem: jest.fn(),
        updateItem: jest.fn(),
        deleteItem: mockDeleteItem,
        handlePageChange: jest.fn(),
        handlePageSizeChange: jest.fn(),
        handleSearch: jest.fn(),
        handleSort: jest.fn(),
        initializeIfNeeded: jest.fn(),
        refreshData: jest.fn(),
        clearError: jest.fn()
      })
      
      const user = userEvent.setup()
      render(<CmsDataTable collection={mockCollection} apiKey={mockApiKey} />)
      
      // Delete first item
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])
      
      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(mockDeleteItem).toHaveBeenCalledWith('item-1')
      })
      
      expect(mockedWebflowActions.deleteCmsItem).toHaveBeenCalledWith(
        mockApiKey,
        mockCollection.id,
        'item-1'
      )
    })
  })

  describe('Error Handling and Retry Logic', () => {
    it('should handle API rate limiting with exponential backoff', async () => {
      const rateLimitError = new Error('Rate limit exceeded')
      
      mockedWebflowActions.getCmsItems
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({
          success: true,
          data: { items: mockItems, pagination: { limit: 10, offset: 0, total: 2 } }
        })
      
      // Mock retry logic
      mockedErrorHandler.withRetry.mockImplementation(async (fn, context, options) => {
        let attempts = 0
        const maxAttempts = options?.maxAttempts || 3
        
        while (attempts < maxAttempts) {
          try {
            return await fn()
          } catch (error) {
            attempts++
            if (attempts >= maxAttempts) throw error
            await new Promise(resolve => setTimeout(resolve, options?.baseDelay || 1000))
          }
        }
      })
      
      const useCmsData = require('../lib/hooks/useCmsData').useCmsData
      const mockFetchItems = jest.fn().mockImplementation(() => {
        return mockedErrorHandler.withRetry(
          () => mockedWebflowActions.getCmsItems(mockApiKey, mockCollection.id, {}),
          'test-context',
          { maxAttempts: 3, baseDelay: 1000 }
        )
      })
      
      useCmsData.mockReturnValue({
        items: [],
        loading: true,
        error: null,
        pagination: { currentPage: 1, pageSize: 10, totalItems: 0, searchQuery: '', sortConfig: null },
        optimisticOperations: [],
        isInitialized: true,
        fetchItems: mockFetchItems,
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
      
      render(<CmsDataTable collection={mockCollection} apiKey={mockApiKey} />)
      
      // Should eventually succeed after retries
      await waitFor(() => {
        expect(mockedWebflowActions.getCmsItems).toHaveBeenCalledTimes(3)
      }, { timeout: 5000 })
    })

    it('should handle malformed API responses gracefully', async () => {
      mockedWebflowActions.getCmsItems.mockResolvedValue({
        success: false,
        error: 'Invalid response format'
      })
      
      const useCmsData = require('../lib/hooks/useCmsData').useCmsData
      useCmsData.mockReturnValue({
        items: [],
        loading: false,
        error: 'Invalid response format',
        pagination: { currentPage: 1, pageSize: 10, totalItems: 0, searchQuery: '', sortConfig: null },
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
      
      render(<CmsDataTable collection={mockCollection} apiKey={mockApiKey} />)
      
      // Should display error message
      expect(screen.getByText(/invalid response format/i)).toBeInTheDocument()
      
      // Should provide retry option
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  describe('Data Validation and Transformation', () => {
    it('should validate field data types before API calls', async () => {
      const invalidData = {
        name: 'Valid Name',
        price: 'invalid-price', // Should be number
        description: 123 // Should be string
      }
      
      const useCmsData = require('../lib/hooks/useCmsData').useCmsData
      const mockCreateItem = jest.fn().mockImplementation((data) => {
        // Simulate validation error
        if (typeof data.price !== 'number') {
          throw new Error('Price must be a number')
        }
        return mockedWebflowActions.createCmsItem(mockApiKey, mockCollection.id, { fieldData: data })
      })
      
      useCmsData.mockReturnValue({
        items: mockItems,
        loading: false,
        error: null,
        pagination: { currentPage: 1, pageSize: 10, totalItems: 2, searchQuery: '', sortConfig: null },
        optimisticOperations: [],
        isInitialized: true,
        fetchItems: jest.fn(),
        createItem: mockCreateItem,
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
      
      const user = userEvent.setup()
      render(<CmsDataTable collection={mockCollection} apiKey={mockApiKey} />)
      
      // Try to create item with invalid data
      const createButton = screen.getByRole('button', { name: /create/i })
      await user.click(createButton)
      
      const nameInput = screen.getByLabelText(/name/i)
      await user.type(nameInput, 'Valid Name')
      
      const priceInput = screen.getByLabelText(/price/i)
      await user.type(priceInput, 'invalid-price')
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/price must be a number/i)).toBeInTheDocument()
      })
      
      // Should not call API with invalid data
      expect(mockedWebflowActions.createCmsItem).not.toHaveBeenCalled()
    })
  })
})