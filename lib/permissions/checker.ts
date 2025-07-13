/**
 * Permission Checker System
 * Core logic for checking user permissions and access control
 */

import { ROLES, hasRolePermission } from './roles'
import type {
  Permission,
  PermissionContext,
  PermissionResult,
  PermissionCondition,
  UserWithPermissions,
  PermissionConfig,
  PermissionAction,
  PermissionResource,
  CmsPermissions
} from './types'

// Default configuration
const DEFAULT_CONFIG: PermissionConfig = {
  strictMode: true, // Deny by default
  cachePermissions: true,
  logPermissionChecks: false,
  inheritanceEnabled: true,
  customPermissionEnabled: true
}

export class PermissionChecker {
  private config: PermissionConfig
  private permissionCache: Map<string, PermissionResult> = new Map()

  constructor(config: Partial<PermissionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Main permission check method
   */
  checkPermission(
    user: UserWithPermissions,
    action: PermissionAction,
    resource: PermissionResource,
    context?: Partial<PermissionContext>
  ): PermissionResult {
    const fullContext: PermissionContext = {
      user: {
        id: user.id,
        email: user.email,
        siteId: user.siteAccess?.[0]?.siteId,
        collectionIds: user.siteAccess?.flatMap(sa => sa.collections || [])
      },
      action,
      resource: {
        type: resource,
        ...context?.resource
      },
      metadata: context?.metadata
    }

    // Check cache first
    if (this.config.cachePermissions) {
      const cacheKey = this.getCacheKey(user.id, action, resource, fullContext)
      const cached = this.permissionCache.get(cacheKey)
      if (cached) {
        return cached
      }
    }

    const result = this.performPermissionCheck(user, fullContext)

    // Cache result
    if (this.config.cachePermissions) {
      const cacheKey = this.getCacheKey(user.id, action, resource, fullContext)
      this.permissionCache.set(cacheKey, result)
    }

    // Log if enabled
    if (this.config.logPermissionChecks) {
      console.log('Permission Check:', {
        user: user.email,
        action,
        resource,
        result: result.allowed,
        reason: result.reason
      })
    }

    return result
  }

  /**
   * Perform the actual permission check
   */
  private performPermissionCheck(
    user: UserWithPermissions,
    context: PermissionContext
  ): PermissionResult {
    // Check if user is active
    if (!user.isActive) {
      return {
        allowed: false,
        reason: 'User account is inactive'
      }
    }

    // Check role-based permissions first
    const roleResult = this.checkRolePermission(user, context)
    if (roleResult.allowed) {
      return roleResult
    }

    // Check custom permissions if enabled
    if (this.config.customPermissionEnabled && user.customPermissions) {
      const customResult = this.checkCustomPermissions(user.customPermissions, context)
      if (customResult.allowed) {
        return { ...customResult, grantedBy: 'custom' }
      }
    }

    // Check ownership-based permissions
    const ownershipResult = this.checkOwnershipPermission(user, context)
    if (ownershipResult.allowed) {
      return { ...ownershipResult, grantedBy: 'ownership' }
    }

    // Check site/collection access restrictions
    const accessResult = this.checkAccessRestrictions(user, context)
    if (!accessResult.allowed) {
      return accessResult
    }

    // Default deny in strict mode
    if (this.config.strictMode) {
      return {
        allowed: false,
        reason: 'Permission denied by default (strict mode)',
        requiredPermissions: [{
          id: `${context.resource?.type}_${context.action}`,
          action: context.action,
          resource: context.resource?.type || 'cms_items'
        }]
      }
    }

    return { allowed: true }
  }

  /**
   * Check role-based permissions
   */
  private checkRolePermission(
    user: UserWithPermissions,
    context: PermissionContext
  ): PermissionResult {
    const hasPermission = hasRolePermission(
      user.role,
      context.resource?.type || 'cms_items',
      context.action
    )

    if (hasPermission) {
      return {
        allowed: true,
        grantedBy: 'role'
      }
    }

    const role = ROLES[user.role]
    return {
      allowed: false,
      reason: `Role '${role?.name}' does not have permission for '${context.action}' on '${context.resource?.type}'`
    }
  }

  /**
   * Check custom permissions
   */
  private checkCustomPermissions(
    permissions: Permission[],
    context: PermissionContext
  ): PermissionResult {
    for (const permission of permissions) {
      if (
        permission.action === context.action &&
        permission.resource === context.resource?.type
      ) {
        // Check conditions if any
        if (permission.conditions) {
          const conditionResult = this.checkConditions(permission.conditions, context)
          if (conditionResult) {
            return { allowed: true }
          }
        } else {
          return { allowed: true }
        }
      }
    }

    return {
      allowed: false,
      reason: 'No matching custom permissions found'
    }
  }

  /**
   * Check ownership-based permissions
   */
  private checkOwnershipPermission(
    user: UserWithPermissions,
    context: PermissionContext
  ): PermissionResult {
    // Only allow ownership checks for read/update/delete operations
    if (!['read', 'update', 'delete'].includes(context.action)) {
      return { allowed: false }
    }

    // Check if user owns the resource
    if (context.resource?.ownerId === user.id) {
      return {
        allowed: true,
        reason: 'User owns this resource'
      }
    }

    return { allowed: false }
  }

  /**
   * Check site and collection access restrictions
   */
  private checkAccessRestrictions(
    user: UserWithPermissions,
    context: PermissionContext
  ): PermissionResult {
    // Check site access
    if (context.resource?.siteId && user.siteAccess) {
      const hasAccessToSite = user.siteAccess.some(
        access => access.siteId === context.resource?.siteId
      )

      if (!hasAccessToSite) {
        return {
          allowed: false,
          reason: 'User does not have access to this site'
        }
      }

      // Check collection access within site
      if (context.resource?.collectionId) {
        const siteAccess = user.siteAccess.find(
          access => access.siteId === context.resource?.siteId
        )

        if (siteAccess?.collections && siteAccess.collections.length > 0) {
          const hasAccessToCollection = siteAccess.collections.includes(
            context.resource.collectionId
          )

          if (!hasAccessToCollection) {
            return {
              allowed: false,
              reason: 'User does not have access to this collection'
            }
          }
        }
      }
    }

    return { allowed: true }
  }

  /**
   * Check permission conditions
   */
  private checkConditions(
    conditions: PermissionCondition[],
    context: PermissionContext
  ): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'ownership':
          return context.resource?.ownerId === context.user.id

        case 'site_access':
          return context.user.siteId === context.resource?.siteId

        case 'collection_access':
          return context.user.collectionIds?.includes(context.resource?.collectionId || '') ?? false

        case 'custom':
          return condition.customCheck ? condition.customCheck(context) : false

        default:
          return false
      }
    })
  }

  /**
   * Generate cache key for permission check
   */
  private getCacheKey(
    userId: string,
    action: PermissionAction,
    resource: PermissionResource,
    context: PermissionContext
  ): string {
    return `${userId}:${action}:${resource}:${context.resource?.id || 'global'}`
  }

  /**
   * Clear permission cache
   */
  clearCache(): void {
    this.permissionCache.clear()
  }

  /**
   * Clear cache for specific user
   */
  clearUserCache(userId: string): void {
    for (const [key] of this.permissionCache) {
      if (key.startsWith(`${userId}:`)) {
        this.permissionCache.delete(key)
      }
    }
  }
}

/**
 * Create CMS-specific permission checker
 */
export function createCmsPermissions(
  user: UserWithPermissions,
  checker: PermissionChecker
): CmsPermissions {
  return {
    canCreateItems: (collectionId: string) => {
      return checker.checkPermission(user, 'create', 'cms_items', {
        resource: { type: 'cms_items', collectionId }
      }).allowed
    },

    canReadItems: (collectionId: string) => {
      return checker.checkPermission(user, 'read', 'cms_items', {
        resource: { type: 'cms_items', collectionId }
      }).allowed
    },

    canUpdateItems: (collectionId: string, itemId?: string) => {
      return checker.checkPermission(user, 'update', 'cms_items', {
        resource: { type: 'cms_items', collectionId, id: itemId }
      }).allowed
    },

    canDeleteItems: (collectionId: string, itemId?: string) => {
      return checker.checkPermission(user, 'delete', 'cms_items', {
        resource: { type: 'cms_items', collectionId, id: itemId }
      }).allowed
    },

    canPublishItems: (collectionId: string) => {
      return checker.checkPermission(user, 'publish', 'cms_items', {
        resource: { type: 'cms_items', collectionId }
      }).allowed
    },

    canArchiveItems: (collectionId: string) => {
      return checker.checkPermission(user, 'archive', 'cms_items', {
        resource: { type: 'cms_items', collectionId }
      }).allowed
    },

    canAccessCollection: (collectionId: string) => {
      return checker.checkPermission(user, 'read', 'collections', {
        resource: { type: 'collections', id: collectionId }
      }).allowed
    },

    canManageCollection: (collectionId: string) => {
      return checker.checkPermission(user, 'update', 'collections', {
        resource: { type: 'collections', id: collectionId }
      }).allowed
    },

    canExportData: () => {
      return checker.checkPermission(user, 'export', 'cms_items').allowed
    },

    canImportData: () => {
      return checker.checkPermission(user, 'import', 'cms_items').allowed
    }
  }
}

// Default permission checker instance
export const defaultPermissionChecker = new PermissionChecker()

// Helper function to check a single permission
export function checkPermission(
  user: UserWithPermissions,
  action: PermissionAction,
  resource: PermissionResource,
  context?: Partial<PermissionContext>
): boolean {
  return defaultPermissionChecker.checkPermission(user, action, resource, context).allowed
}