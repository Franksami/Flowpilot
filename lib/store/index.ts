/**
 * FlowPilot Simple Store
 * Minimal viable state management - expand as needed
 */

import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

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
          error: null
        }),
      }),
      {
        name: 'flowpilot-store',
        // Only persist user auth and API key
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          apiKey: state.apiKey,
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