/**
 * Webflow API Types
 * Type definitions for Webflow API responses
 */

export interface WebflowApiResponse<T = unknown> {
  data?: T
  error?: {
    message: string
    code: string
  }
  success: boolean
}

export interface WebflowSite {
  id: string
  name: string
  shortName: string
  defaultDomain: string
  previewUrl?: string
  timeZone?: string
  createdOn: string
  lastUpdated: string
  publishedOn?: string
}

export interface WebflowCollection {
  id: string
  name: string
  slug: string
  singularName: string
  siteId: string
  createdOn: string
  lastUpdated: string
  fields: WebflowField[]
}

export interface WebflowField {
  id: string
  name: string
  displayName?: string
  slug: string
  type: string
  required: boolean
  editable: boolean
  archived: boolean
}

export interface WebflowUser {
  id?: string
  email: string
  firstName?: string
  lastName?: string
}

// Validation schemas for API responses
export interface ApiKeyValidationResult {
  valid: boolean
  user?: WebflowUser
  sites?: WebflowSite[]
  error?: string
}

// CMS Item Types
export interface WebflowCmsItem {
  id: string
  cmsLocaleId?: string
  lastPublished?: string | null
  lastUpdated: string
  createdOn: string
  publishedOn?: string | null
  isArchived: boolean
  isDraft: boolean
  fieldData: Record<string, any>
}

export interface WebflowCmsCreateRequest {
  isArchived?: boolean
  isDraft?: boolean
  fieldData: Record<string, any>
}

export interface WebflowCmsUpdateRequest {
  id: string
  isArchived?: boolean
  isDraft?: boolean
  fieldData?: Record<string, any>
}

// Pagination and Filtering
export interface WebflowPaginationOptions {
  limit?: number
  offset?: number
}

export interface WebflowCmsListOptions extends WebflowPaginationOptions {
  filter?: Record<string, any>
  sort?: string[]
}

export interface WebflowCmsListResponse {
  items: WebflowCmsItem[]
  pagination: {
    limit: number
    offset: number
    total: number
  }
}