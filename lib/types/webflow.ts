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
  slug: string
  type: string
  required: boolean
  editable: boolean
  archived: boolean
}

export interface WebflowUser {
  id: string
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