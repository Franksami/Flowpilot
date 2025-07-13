/**
 * Webflow API Client
 * Server-side only - handles secure API communications
 */

import { env } from './env'
import type { 
  WebflowApiResponse, 
  WebflowSite, 
  WebflowCollection, 
  WebflowUser,
  ApiKeyValidationResult 
} from './types/webflow'

export class WebflowClient {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string) {
    this.baseUrl = env.WEBFLOW_BASE_URL
    this.apiKey = apiKey
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<WebflowApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: {
            message: data.message || 'API request failed',
            code: data.code || response.status.toString(),
          },
        }
      }

      return {
        success: true,
        data,
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Network error',
          code: 'NETWORK_ERROR',
        },
      }
    }
  }

  async validateApiKey(): Promise<ApiKeyValidationResult> {
    try {
      // First, try to get user info to validate the API key
      const userResponse = await this.request<WebflowUser>('/user')
      
      if (!userResponse.success || !userResponse.data) {
        return {
          valid: false,
          error: userResponse.error?.message || 'Invalid API key',
        }
      }

      // If user info is successful, get the sites
      const sitesResponse = await this.request<{ sites: WebflowSite[] }>('/sites')
      
      return {
        valid: true,
        user: userResponse.data,
        sites: sitesResponse.success ? sitesResponse.data?.sites || [] : [],
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'API validation failed',
      }
    }
  }

  async getSites(): Promise<WebflowApiResponse<WebflowSite[]>> {
    const response = await this.request<{ sites: WebflowSite[] }>('/sites')
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.sites,
      }
    }
    
    return response as unknown as WebflowApiResponse<WebflowSite[]>
  }

  async getCollections(siteId: string): Promise<WebflowApiResponse<WebflowCollection[]>> {
    const response = await this.request<{ collections: WebflowCollection[] }>(
      `/sites/${siteId}/collections`
    )
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.collections,
      }
    }
    
    return response as unknown as WebflowApiResponse<WebflowCollection[]>
  }

  async getSite(siteId: string): Promise<WebflowApiResponse<WebflowSite>> {
    return this.request<WebflowSite>(`/sites/${siteId}`)
  }
}

// Utility function to create client instances
export const createWebflowClient = (apiKey: string) => {
  return new WebflowClient(apiKey)
}