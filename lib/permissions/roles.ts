/**
 * Role Definitions and Permission Matrices
 * Defines default roles and their associated permissions
 */

import type { Role, Permission, PermissionMatrix, UserRole, PermissionAction, PermissionResource } from './types'

// Default permission definitions for CMS operations
const createCmsPermissions = (resource: PermissionResource, actions: PermissionAction[]): Permission[] => {
  return actions.map(action => ({
    id: `${resource}_${action}`,
    action,
    resource
  }))
}

// Owner role - full access to everything
export const OWNER_ROLE: Role = {
  id: 'owner',
  name: 'Owner',
  description: 'Full access to all features and settings',
  level: 'admin',
  permissions: [
    ...createCmsPermissions('cms_items', ['create', 'read', 'update', 'delete', 'publish', 'archive']),
    ...createCmsPermissions('collections', ['create', 'read', 'update', 'delete']),
    ...createCmsPermissions('sites', ['create', 'read', 'update', 'delete']),
    ...createCmsPermissions('users', ['create', 'read', 'update', 'delete']),
    ...createCmsPermissions('settings', ['read', 'update']),
    ...createCmsPermissions('api_keys', ['create', 'read', 'update', 'delete']),
    {
      id: 'export_all',
      action: 'export',
      resource: 'cms_items'
    },
    {
      id: 'import_all',
      action: 'import',
      resource: 'cms_items'
    }
  ]
}

// Admin role - manage content and users, limited system settings
export const ADMIN_ROLE: Role = {
  id: 'admin',
  name: 'Administrator',
  description: 'Manage content, users, and most settings',
  level: 'admin',
  permissions: [
    ...createCmsPermissions('cms_items', ['create', 'read', 'update', 'delete', 'publish', 'archive']),
    ...createCmsPermissions('collections', ['read', 'update']),
    ...createCmsPermissions('sites', ['read']),
    ...createCmsPermissions('users', ['create', 'read', 'update']),
    ...createCmsPermissions('settings', ['read']),
    {
      id: 'export_content',
      action: 'export',
      resource: 'cms_items'
    },
    {
      id: 'import_content',
      action: 'import',
      resource: 'cms_items'
    }
  ]
}

// Editor role - create and manage content
export const EDITOR_ROLE: Role = {
  id: 'editor',
  name: 'Editor',
  description: 'Create and edit content, publish items',
  level: 'write',
  permissions: [
    ...createCmsPermissions('cms_items', ['create', 'read', 'update', 'delete', 'publish']),
    ...createCmsPermissions('collections', ['read']),
    ...createCmsPermissions('sites', ['read']),
    {
      id: 'export_own_content',
      action: 'export',
      resource: 'cms_items',
      conditions: [{
        type: 'ownership',
        field: 'createdBy'
      }]
    }
  ]
}

// Viewer role - read-only access
export const VIEWER_ROLE: Role = {
  id: 'viewer',
  name: 'Viewer',
  description: 'View content and collections without editing',
  level: 'read',
  permissions: [
    ...createCmsPermissions('cms_items', ['read']),
    ...createCmsPermissions('collections', ['read']),
    ...createCmsPermissions('sites', ['read'])
  ]
}

// Guest role - minimal access
export const GUEST_ROLE: Role = {
  id: 'guest',
  name: 'Guest',
  description: 'Limited read access to public content',
  level: 'read',
  permissions: [
    {
      id: 'read_public_content',
      action: 'read',
      resource: 'cms_items',
      conditions: [{
        type: 'custom',
        customCheck: (context) => {
          // Only allow reading published, non-archived items
          return context.resource?.type === 'cms_items'
        }
      }]
    }
  ]
}

// All defined roles
export const ROLES: Record<UserRole, Role> = {
  owner: OWNER_ROLE,
  admin: ADMIN_ROLE,
  editor: EDITOR_ROLE,
  viewer: VIEWER_ROLE,
  guest: GUEST_ROLE
}

// Permission matrix for quick reference
export const PERMISSION_MATRIX: PermissionMatrix = {
  owner: {
    cms_items: ['create', 'read', 'update', 'delete', 'publish', 'archive', 'export', 'import'],
    collections: ['create', 'read', 'update', 'delete'],
    sites: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    settings: ['read', 'update'],
    api_keys: ['create', 'read', 'update', 'delete']
  },
  admin: {
    cms_items: ['create', 'read', 'update', 'delete', 'publish', 'archive', 'export', 'import'],
    collections: ['read', 'update'],
    sites: ['read'],
    users: ['create', 'read', 'update'],
    settings: ['read'],
    api_keys: []
  },
  editor: {
    cms_items: ['create', 'read', 'update', 'delete', 'publish', 'export'],
    collections: ['read'],
    sites: ['read'],
    users: [],
    settings: [],
    api_keys: []
  },
  viewer: {
    cms_items: ['read'],
    collections: ['read'],
    sites: ['read'],
    users: [],
    settings: [],
    api_keys: []
  },
  guest: {
    cms_items: ['read'],
    collections: [],
    sites: [],
    users: [],
    settings: [],
    api_keys: []
  }
}

// Helper functions for role management
export const getRoleById = (roleId: UserRole): Role => {
  return ROLES[roleId]
}

export const getUserPermissions = (roleId: UserRole): Permission[] => {
  const role = getRoleById(roleId)
  return role ? role.permissions : []
}

export const hasRolePermission = (
  roleId: UserRole, 
  resource: PermissionResource, 
  action: PermissionAction
): boolean => {
  const permissions = PERMISSION_MATRIX[roleId]
  return permissions[resource]?.includes(action) ?? false
}

export const getAvailableRoles = (): Role[] => {
  return Object.values(ROLES)
}

export const isHigherRole = (roleA: UserRole, roleB: UserRole): boolean => {
  const hierarchy: Record<UserRole, number> = {
    guest: 0,
    viewer: 1,
    editor: 2,
    admin: 3,
    owner: 4
  }
  
  return hierarchy[roleA] > hierarchy[roleB]
}

export const getMinimumRoleForAction = (
  resource: PermissionResource, 
  action: PermissionAction
): UserRole | null => {
  const roles: UserRole[] = ['guest', 'viewer', 'editor', 'admin', 'owner']
  
  for (const role of roles) {
    if (hasRolePermission(role, resource, action)) {
      return role
    }
  }
  
  return null
}