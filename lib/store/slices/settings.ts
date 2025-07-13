/**
 * Settings Slice
 * Handles user preferences and app settings
 */

import { StateCreator } from 'zustand'
import type { SettingsSlice, AppStore } from '../types'

export const createSettingsSlice: StateCreator<
  AppStore,
  [],
  [],
  SettingsSlice
> = (set) => ({
  theme: 'system',
  defaultPageSize: 25,
  autoSave: true,
  
  setTheme: (theme) => {
    set({ theme })
  },
  
  setDefaultPageSize: (defaultPageSize) => {
    set({ defaultPageSize })
  },
  
  setAutoSave: (autoSave) => {
    set({ autoSave })
  }
})