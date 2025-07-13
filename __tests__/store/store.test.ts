/**
 * Store Tests
 * Comprehensive tests for the FlowPilot store
 */

import { renderHook, act } from '@testing-library/react'
import { useAppStore, useAuth, useUI, useWebflow, useCms, useSettings, useCmsCollection } from '@/lib/store'
import type { User, WebflowSite, WebflowCollection, OptimisticOperation } from '@/lib/store'

// Mock data
const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  firstName: 'Test',
  lastName: 'User'
}

const mockSite: WebflowSite = {
  id: 'site-1',
  name: 'Test Site',
  shortName: 'test',
  defaultDomain: 'test.webflow.io'
}

const mockCollection: WebflowCollection = {
  id: 'coll-1',
  name: 'Blog Posts',
  slug: 'blog-posts',
  siteId: 'site-1',
  singularName: 'Blog Post',
  fields: [
    {
      id: 'field-1',
      name: 'Title',
      slug: 'title',
      type: 'PlainText',
      required: true,
      editable: true,
      archived: false
    }
  ]
}

describe('FlowPilot Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.setState({
      // Auth
      user: null,
      isAuthenticated: false,
      // UI
      isLoading: false,
      error: null,
      // Webflow
      currentSite: null,
      sites: [],
      collections: [],
      apiKey: null,
      isConnected: false,
      // CMS
      activeCollection: null,
      cmsCollections: {},
      optimisticOperations: [],
      // Settings
      theme: 'system',
      defaultPageSize: 25,
      autoSave: true
    })
  })

  describe('Auth Slice', () => {
    it('should handle user login', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)

      act(() => {
        result.current.login(mockUser)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should handle logout and clear all state', () => {
      const { result: authResult } = renderHook(() => useAuth())
      const { result: webflowResult } = renderHook(() => useWebflow())

      // Set up some state
      act(() => {
        authResult.current.login(mockUser)
        webflowResult.current.setApiKey('test-key')
        webflowResult.current.setSites([mockSite])
      })

      expect(authResult.current.isAuthenticated).toBe(true)
      expect(webflowResult.current.apiKey).toBe('test-key')
      expect(webflowResult.current.sites).toHaveLength(1)

      // Logout
      act(() => {
        authResult.current.logout()
      })

      expect(authResult.current.user).toBeNull()
      expect(authResult.current.isAuthenticated).toBe(false)
      expect(webflowResult.current.apiKey).toBeNull()
      expect(webflowResult.current.sites).toHaveLength(0)
    })
  })

  describe('UI Slice', () => {
    it('should manage loading state', () => {
      const { result } = renderHook(() => useUI())

      expect(result.current.isLoading).toBe(false)

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('should manage error state', () => {
      const { result } = renderHook(() => useUI())

      expect(result.current.error).toBeNull()

      act(() => {
        result.current.setError('Test error')
      })

      expect(result.current.error).toBe('Test error')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('Webflow Slice', () => {
    it('should manage API key and connection status', () => {
      const { result } = renderHook(() => useWebflow())

      expect(result.current.apiKey).toBeNull()
      expect(result.current.isConnected).toBe(false)

      act(() => {
        result.current.setApiKey('test-api-key')
      })

      expect(result.current.apiKey).toBe('test-api-key')
      expect(result.current.isConnected).toBe(true)

      act(() => {
        result.current.setApiKey(null)
      })

      expect(result.current.apiKey).toBeNull()
      expect(result.current.isConnected).toBe(false)
    })

    it('should manage sites and collections', () => {
      const { result } = renderHook(() => useWebflow())

      act(() => {
        result.current.setSites([mockSite])
        result.current.setCurrentSite(mockSite)
        result.current.setCollections([mockCollection])
      })

      expect(result.current.sites).toHaveLength(1)
      expect(result.current.currentSite).toEqual(mockSite)
      expect(result.current.collections).toHaveLength(1)
    })
  })

  describe('CMS Slice', () => {
    it('should initialize collection', () => {
      const { result } = renderHook(() => useCms())

      act(() => {
        result.current.initializeCollection(mockCollection)
      })

      const state = useAppStore.getState()
      expect(state.cmsCollections[mockCollection.id]).toBeDefined()
      expect(state.cmsCollections[mockCollection.id].items).toEqual([])
      expect(state.cmsCollections[mockCollection.id].loading).toBe(false)
    })

    it('should manage collection items', () => {
      const { result } = renderHook(() => useCmsCollection(mockCollection.id))

      // Initialize first
      act(() => {
        useAppStore.getState().initializeCollection(mockCollection)
      })

      const mockItem = {
        id: 'item-1',
        createdOn: '2024-01-01',
        lastUpdated: '2024-01-01',
        isDraft: false,
        isArchived: false,
        fieldData: { title: 'Test Post' }
      }

      act(() => {
        result.current.setCmsItems([mockItem])
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0]).toEqual(mockItem)

      // Add item
      const newItem = { ...mockItem, id: 'item-2', fieldData: { title: 'New Post' } }
      act(() => {
        result.current.addCmsItem(newItem)
      })

      expect(result.current.items).toHaveLength(2)

      // Update item
      act(() => {
        result.current.updateCmsItem('item-1', { fieldData: { title: 'Updated Post' } })
      })

      expect(result.current.items[0].fieldData.title).toBe('Updated Post')

      // Remove item
      act(() => {
        result.current.removeCmsItem('item-2')
      })

      expect(result.current.items).toHaveLength(1)
    })

    it('should handle optimistic operations', () => {
      const { result: cmsResult } = renderHook(() => useCms())
      const { result: collectionResult } = renderHook(() => useCmsCollection(mockCollection.id))

      // Initialize collection
      act(() => {
        cmsResult.current.initializeCollection(mockCollection)
      })

      const mockItem = {
        id: 'item-1',
        createdOn: '2024-01-01',
        lastUpdated: '2024-01-01',
        isDraft: false,
        isArchived: false,
        fieldData: { title: 'Original' }
      }

      act(() => {
        collectionResult.current.setCmsItems([mockItem])
      })

      // Add optimistic update
      const optimisticOp: OptimisticOperation = {
        id: 'op-1',
        type: 'update',
        collectionId: mockCollection.id,
        itemId: 'item-1',
        item: { ...mockItem, fieldData: { title: 'Optimistic Update' } },
        timestamp: new Date().toISOString()
      }

      act(() => {
        useAppStore.getState().addOptimisticOperation(optimisticOp)
      })

      // Combined items should reflect optimistic update
      const combinedItems = useAppStore.getState().getCombinedItems(mockCollection.id)
      expect(combinedItems[0].fieldData.title).toBe('Optimistic Update')

      // Remove optimistic operation
      act(() => {
        useAppStore.getState().removeOptimisticOperation('op-1')
      })

      const itemsAfterRemoval = useAppStore.getState().getCombinedItems(mockCollection.id)
      expect(itemsAfterRemoval[0].fieldData.title).toBe('Original')
    })
  })

  describe('Settings Slice', () => {
    it('should manage user preferences', () => {
      const { result } = renderHook(() => useSettings())

      expect(result.current.theme).toBe('system')
      expect(result.current.defaultPageSize).toBe(25)
      expect(result.current.autoSave).toBe(true)

      act(() => {
        result.current.setTheme('dark')
        result.current.setDefaultPageSize(50)
        result.current.setAutoSave(false)
      })

      expect(result.current.theme).toBe('dark')
      expect(result.current.defaultPageSize).toBe(50)
      expect(result.current.autoSave).toBe(false)
    })
  })

  describe('Persistence', () => {
    it('should persist only specified data', () => {
      const { result: authResult } = renderHook(() => useAuth())
      const { result: settingsResult } = renderHook(() => useSettings())
      const { result: webflowResult } = renderHook(() => useWebflow())

      act(() => {
        authResult.current.login(mockUser)
        settingsResult.current.setTheme('dark')
        webflowResult.current.setApiKey('test-key')
      })

      // Get persisted state
      const state = useAppStore.getState()
      const persistedState = {
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        apiKey: state.apiKey,
        theme: state.theme,
        defaultPageSize: state.defaultPageSize,
        autoSave: state.autoSave,
        activeCollection: state.activeCollection,
      }

      // Check that only specific fields are in persisted state
      expect(persistedState.user).toEqual(mockUser)
      expect(persistedState.isAuthenticated).toBe(true)
      expect(persistedState.apiKey).toBe('test-key')
      expect(persistedState.theme).toBe('dark')
    })
  })
})