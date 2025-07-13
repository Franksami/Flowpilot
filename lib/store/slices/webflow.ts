/**
 * Webflow Slice
 * Handles Webflow API connection and site data
 */

import { StateCreator } from 'zustand'
import type { WebflowSlice, AppStore } from '../types'

export const createWebflowSlice: StateCreator<
  AppStore,
  [],
  [],
  WebflowSlice
> = (set) => ({
  currentSite: null,
  sites: [],
  collections: [],
  apiKey: null,
  isConnected: false,
  
  setSites: (sites) => {
    set({ sites })
  },
  
  setCurrentSite: (currentSite) => {
    set({ currentSite })
  },
  
  setCollections: (collections) => {
    set({ collections })
  },
  
  setApiKey: (apiKey) => {
    set({ 
      apiKey,
      isConnected: !!apiKey 
    })
  },
  
  setConnected: (isConnected) => {
    set({ isConnected })
  }
})