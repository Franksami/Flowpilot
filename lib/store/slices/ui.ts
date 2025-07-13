/**
 * UI Slice
 * Handles UI state like loading and errors
 */

import { StateCreator } from 'zustand'
import type { UISlice, AppStore } from '../types'

export const createUISlice: StateCreator<
  AppStore,
  [],
  [],
  UISlice
> = (set) => ({
  isLoading: false,
  error: null,
  
  setLoading: (isLoading) => {
    set({ isLoading })
  },
  
  setError: (error) => {
    set({ error })
  },
  
  clearError: () => {
    set({ error: null })
  }
})