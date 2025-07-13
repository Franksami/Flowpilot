/**
 * Permission and Role Types
 * Defines the role-based access control (RBAC) system for FlowPilot
 */

// Core permission actions
export type PermissionAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'publish'
  | 'archive'
  | 'export'
  | 'import'

// Resource types that can have permissions
export type PermissionResource = 
  | 'cms_items'
  | 'collections'
  | 'sites'
  | 'users'
  | 'settings'
  | 'api_keys'

// Permission levels
export type PermissionLevel = 'none' | 'read' | 'write' | 'admin'

// Individual permission definition
export interface Permission {
  id: string
  action: PermissionAction
  resource: PermissionResource
  conditions?: PermissionCondition[]
}

// Conditions for contextual permissions
export interface PermissionCondition {
  type: 'ownership' | 'site_access' | 'collection_access' | 'custom'
  field?: string
  operator?: 'equals' | 'contains' | 'in' | 'not_in'
  value?: unknown
  customCheck?: (context: PermissionContext) => boolean
}

// Context for permission checks
export interface PermissionContext {
  user: {
    id: string
    email: string
    siteId?: string
    collectionIds?: string[]
  }
  resource?: {
    id?: string
    type: PermissionResource
    ownerId?: string
    siteId?: string
    collectionId?: string
  }
  action: PermissionAction
  metadata?: Record<string, unknown>
}

// User roles with predefined permissions
export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer' | 'guest'

// Role definition with permissions
export interface Role {
  id: UserRole
  name: string
  description: string
  permissions: Permission[]
  level: PermissionLevel
  inherits?: UserRole[]
}

// User with role and permissions
export interface UserWithPermissions {
  id: string
  email: string
  name: string
  role: UserRole
  customPermissions?: Permission[]
  siteAccess?: {
    siteId: string
    collections?: string[]
    restrictions?: PermissionCondition[]
  }[]
  isActive: boolean
  lastLogin?: string
}

// Permission check result
export interface PermissionResult {
  allowed: boolean
  reason?: string
  requiredPermissions?: Permission[]
  grantedBy?: 'role' | 'custom' | 'ownership'
}

// CMS-specific permission checks
export interface CmsPermissions {
  canCreateItems: (collectionId: string) => boolean
  canReadItems: (collectionId: string) => boolean
  canUpdateItems: (collectionId: string, itemId?: string) => boolean
  canDeleteItems: (collectionId: string, itemId?: string) => boolean
  canPublishItems: (collectionId: string) => boolean
  canArchiveItems: (collectionId: string) => boolean
  canAccessCollection: (collectionId: string) => boolean
  canManageCollection: (collectionId: string) => boolean
  canExportData: () => boolean
  canImportData: () => boolean
}

// Permission configuration
export interface PermissionConfig {
  strictMode: boolean // Deny by default vs allow by default
  cachePermissions: boolean
  logPermissionChecks: boolean
  inheritanceEnabled: boolean
  customPermissionEnabled: boolean
}

// Audit log for permission changes
export interface PermissionAuditLog {
  id: string
  userId: string
  action: 'granted' | 'revoked' | 'checked'
  permission: Permission
  context: PermissionContext
  result: boolean
  timestamp: string
  ip?: string
  userAgent?: string
}

// Permission matrix for bulk operations
export type PermissionMatrix = Record<UserRole, Record<PermissionResource, PermissionAction[]>>

// Permission presets for common scenarios
export interface PermissionPreset {
  id: string
  name: string
  description: string
  permissions: Permission[]
  applicableRoles: UserRole[]
}