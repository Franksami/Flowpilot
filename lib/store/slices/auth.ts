/**
 * Auth Slice
 * Handles user authentication state
 */

import { StateCreator } from 'zustand'
import type { AuthSlice, User, AppStore } from '../types'

export const createAuthSlice: StateCreator<
  AppStore,
  [],
  [],
  AuthSlice
> = (set, get) => ({
  user: null,
  isAuthenticated: false,
  
  setUser: (user) => {
    set({ 
      user, 
      isAuthenticated: !!user 
    })
  },
  
  logout: () => {
    // Clear all state on logout
    set({
      // Auth state
      user: null,
      isAuthenticated: false,
      
      // Webflow state
      currentSite: null,
      sites: [],
      collections: [],
      apiKey: null,
      isConnected: false,
      
      // UI state
      error: null,
      
      // CMS state
      activeCollection: null,
      cmsCollections: {},
      optimisticOperations: []
    })
  }
})