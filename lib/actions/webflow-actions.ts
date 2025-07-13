/**
 * Webflow Server Actions
 * Secure server-side actions for Webflow API integration
 * These actions run on the server to prevent API key exposure
 */

'use server'

import { z } from 'zod'

import type { ApiKeyValidationResult, WebflowSite, WebflowCollection } from '../types/webflow'
import { createWebflowClient } from '../webflow-client'

// Input validation schemas
const apiKeySchema = z.string().min(1, 'API key is required')
const siteIdSchema = z.string().min(1, 'Site ID is required')

/**
 * Validate Webflow API key and get user info
 */
export async function validateWebflowApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
  try {
    // Validate input
    const validatedApiKey = apiKeySchema.parse(apiKey)
    
    // Create client and validate
    const client = createWebflowClient(validatedApiKey)
    const result = await client.validateApiKey()
    
    return result
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    }
  }
}

/**
 * Get user's Webflow sites
 */
export async function getWebflowSites(apiKey: string): Promise<{
  success: boolean
  sites?: WebflowSite[]
  error?: string
}> {
  try {
    const validatedApiKey = apiKeySchema.parse(apiKey)
    
    const client = createWebflowClient(validatedApiKey)
    const response = await client.getSites()
    
    if (response.success && response.data) {
      return {
        success: true,
        sites: response.data,
      }
    }
    
    return {
      success: false,
      error: response.error?.message || 'Failed to fetch sites',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sites',
    }
  }
}

/**
 * Get collections for a specific site
 */
export async function getWebflowCollections(
  apiKey: string, 
  siteId: string
): Promise<{
  success: boolean
  collections?: WebflowCollection[]
  error?: string
}> {
  try {
    const validatedApiKey = apiKeySchema.parse(apiKey)
    const validatedSiteId = siteIdSchema.parse(siteId)
    
    const client = createWebflowClient(validatedApiKey)
    const response = await client.getCollections(validatedSiteId)
    
    if (response.success && response.data) {
      return {
        success: true,
        collections: response.data,
      }
    }
    
    return {
      success: false,
      error: response.error?.message || 'Failed to fetch collections',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch collections',
    }
  }
}

/**
 * Get details for a specific site
 */
export async function getWebflowSite(
  apiKey: string, 
  siteId: string
): Promise<{
  success: boolean
  site?: WebflowSite
  error?: string
}> {
  try {
    const validatedApiKey = apiKeySchema.parse(apiKey)
    const validatedSiteId = siteIdSchema.parse(siteId)
    
    const client = createWebflowClient(validatedApiKey)
    const response = await client.getSite(validatedSiteId)
    
    if (response.success && response.data) {
      return {
        success: true,
        site: response.data,
      }
    }
    
    return {
      success: false,
      error: response.error?.message || 'Failed to fetch site details',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch site details',
    }
  }
}