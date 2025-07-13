/**
 * Webflow Server Actions
 * Secure server-side actions for Webflow API integration
 * These actions run on the server to prevent API key exposure
 */

'use server'

import { z } from 'zod'

import type {
  ApiKeyValidationResult,
  WebflowSite,
  WebflowCollection,
  WebflowCmsItem,
  WebflowCmsCreateRequest,
  WebflowCmsUpdateRequest,
  WebflowCmsListOptions,
  WebflowCmsListResponse,
} from '../types/webflow'
import { createWebflowClient } from '../webflow-client'

// Input validation schemas
const apiKeySchema = z.string().min(1, 'API key is required')
const siteIdSchema = z.string().min(1, 'Site ID is required')
const collectionIdSchema = z.string().min(1, 'Collection ID is required')
const itemIdSchema = z.string().min(1, 'Item ID is required')

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

// CMS Actions

/**
 * Get CMS items from a collection
 */
export async function getCmsItems(
  apiKey: string,
  collectionId: string,
  options: WebflowCmsListOptions = {}
): Promise<{
  success: boolean
  data?: WebflowCmsListResponse
  error?: string
}> {
  try {
    const validatedApiKey = apiKeySchema.parse(apiKey)
    const validatedCollectionId = collectionIdSchema.parse(collectionId)

    const client = createWebflowClient(validatedApiKey)
    const response = await client.getCmsItems(validatedCollectionId, options)

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data,
      }
    }

    return {
      success: false,
      error: response.error?.message || 'Failed to fetch CMS items',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch CMS items',
    }
  }
}

/**
 * Get a single CMS item
 */
export async function getCmsItem(
  apiKey: string,
  collectionId: string,
  itemId: string
): Promise<{
  success: boolean
  data?: WebflowCmsItem
  error?: string
}> {
  try {
    const validatedApiKey = apiKeySchema.parse(apiKey)
    const validatedCollectionId = collectionIdSchema.parse(collectionId)
    const validatedItemId = itemIdSchema.parse(itemId)

    const client = createWebflowClient(validatedApiKey)
    const response = await client.getCmsItem(validatedCollectionId, validatedItemId)

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data,
      }
    }

    return {
      success: false,
      error: response.error?.message || 'Failed to fetch CMS item',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch CMS item',
    }
  }
}

/**
 * Create a new CMS item
 */
export async function createCmsItem(
  apiKey: string,
  collectionId: string,
  data: WebflowCmsCreateRequest
): Promise<{
  success: boolean
  data?: WebflowCmsItem
  error?: string
}> {
  try {
    const validatedApiKey = apiKeySchema.parse(apiKey)
    const validatedCollectionId = collectionIdSchema.parse(collectionId)

    const client = createWebflowClient(validatedApiKey)
    const response = await client.createCmsItem(validatedCollectionId, data)

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data,
      }
    }

    return {
      success: false,
      error: response.error?.message || 'Failed to create CMS item',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create CMS item',
    }
  }
}

/**
 * Update an existing CMS item
 */
export async function updateCmsItem(
  apiKey: string,
  collectionId: string,
  itemId: string,
  data: WebflowCmsUpdateRequest
): Promise<{
  success: boolean
  data?: WebflowCmsItem
  error?: string
}> {
  try {
    const validatedApiKey = apiKeySchema.parse(apiKey)
    const validatedCollectionId = collectionIdSchema.parse(collectionId)
    const validatedItemId = itemIdSchema.parse(itemId)

    const client = createWebflowClient(validatedApiKey)
    const response = await client.updateCmsItem(validatedCollectionId, validatedItemId, data)

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data,
      }
    }

    return {
      success: false,
      error: response.error?.message || 'Failed to update CMS item',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update CMS item',
    }
  }
}

/**
 * Delete a CMS item
 */
export async function deleteCmsItem(
  apiKey: string,
  collectionId: string,
  itemId: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const validatedApiKey = apiKeySchema.parse(apiKey)
    const validatedCollectionId = collectionIdSchema.parse(collectionId)
    const validatedItemId = itemIdSchema.parse(itemId)

    const client = createWebflowClient(validatedApiKey)
    const response = await client.deleteCmsItem(validatedCollectionId, validatedItemId)

    if (response.success) {
      return {
        success: true,
      }
    }

    return {
      success: false,
      error: response.error?.message || 'Failed to delete CMS item',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete CMS item',
    }
  }
}

/**
 * Publish site with updated content
 */
export async function publishSite(
  apiKey: string,
  siteId: string,
  domains?: string[]
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const validatedApiKey = apiKeySchema.parse(apiKey)
    const validatedSiteId = siteIdSchema.parse(siteId)

    const client = createWebflowClient(validatedApiKey)
    const response = await client.publishSite(validatedSiteId, domains)

    if (response.success) {
      return {
        success: true,
      }
    }

    return {
      success: false,
      error: response.error?.message || 'Failed to publish site',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish site',
    }
  }
}

/**
 * Bulk delete CMS items
 * Processes deletions in batches to respect API rate limits
 */
export async function bulkDeleteCmsItems(
  apiKey: string,
  collectionId: string,
  itemIds: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<{
  success: boolean
  deleted: string[]
  failed: Array<{ itemId: string; error: string }>
  error?: string
}> {
  try {
    const validatedApiKey = apiKeySchema.parse(apiKey)
    const validatedCollectionId = collectionIdSchema.parse(collectionId)

    const client = createWebflowClient(validatedApiKey)
    const deleted: string[] = []
    const failed: Array<{ itemId: string; error: string }> = []

    // Process in batches of 25 to avoid rate limits
    const batchSize = 25
    const batches = []
    for (let i = 0; i < itemIds.length; i += batchSize) {
      batches.push(itemIds.slice(i, i + batchSize))
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]

      // Process batch items in parallel
      const batchPromises = batch.map(async (itemId) => {
        try {
          const response = await client.deleteCmsItem(validatedCollectionId, itemId)
          if (response.success) {
            deleted.push(itemId)
          } else {
            failed.push({
              itemId,
              error: response.error?.message || 'Failed to delete item',
            })
          }
        } catch (error) {
          failed.push({
            itemId,
            error: error instanceof Error ? error.message : 'Failed to delete item',
          })
        }
      })

      await Promise.all(batchPromises)

      // Report progress
      if (onProgress) {
        const completed = (batchIndex + 1) * batchSize
        onProgress(Math.min(completed, itemIds.length), itemIds.length)
      }

      // Add delay between batches to respect rate limits
      if (batchIndex < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return {
      success: failed.length === 0,
      deleted,
      failed,
      error: failed.length > 0 ? `Failed to delete ${failed.length} items` : undefined,
    }
  } catch (error) {
    return {
      success: false,
      deleted: [],
      failed: [],
      error: error instanceof Error ? error.message : 'Failed to delete items',
    }
  }
}
