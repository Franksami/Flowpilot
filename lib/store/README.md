# FlowPilot Store Architecture

## Overview

The FlowPilot store uses Zustand with a modular slice pattern for better organization and maintainability.

## Structure

```
store/
├── index.ts          # Main store configuration
├── types.ts          # TypeScript type definitions
├── hooks.ts          # Convenient typed hooks
├── middleware.ts     # Store middleware (logging, error handling)
└── slices/           # Store slices
    ├── auth.ts       # Authentication state
    ├── ui.ts         # UI state (loading, errors)
    ├── webflow.ts    # Webflow API connection
    ├── cms.ts        # CMS data management
    └── settings.ts   # User preferences
```

## Features

### 1. Modular Slices
Each slice manages its own domain:
- **Auth**: User authentication and session
- **UI**: Loading states and error messages
- **Webflow**: API connection and site data
- **CMS**: Collection data and optimistic updates
- **Settings**: User preferences and app settings

### 2. TypeScript Support
- Fully typed store with proper inference
- Type-safe hooks for each slice
- Exported types for use in components

### 3. Middleware Stack
- **Immer**: Immutable updates with mutable syntax
- **DevTools**: Redux DevTools integration
- **Persist**: Local storage persistence
- **Logger**: Development logging
- **Error Boundary**: Safe error handling
- **Performance**: Performance monitoring

### 4. Optimistic Updates
The CMS slice supports optimistic updates:
```typescript
// Add optimistic operation
addOptimisticOperation({
  id: 'op-123',
  type: 'update',
  collectionId: 'coll-1',
  itemId: 'item-1',
  item: updatedItem,
  timestamp: new Date().toISOString()
})

// Combined items include optimistic changes
const items = getCombinedItems('coll-1')
```

### 5. Persistence
Only essential data is persisted:
- User authentication
- API key
- User preferences
- Active selections

## Usage Examples

### Basic Usage
```typescript
import { useAuth, useUI, useWebflow } from '@/lib/store'

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth()
  const { isLoading, setLoading } = useUI()
  const { apiKey, setApiKey } = useWebflow()
  
  // Use the store...
}
```

### Collection-Specific Hook
```typescript
import { useCmsCollection } from '@/lib/store'

function CollectionView({ collectionId }) {
  const {
    items,
    loading,
    error,
    pagination,
    setCmsItems,
    addCmsItem,
    updateCmsItem,
    removeCmsItem,
  } = useCmsCollection(collectionId)
  
  // Manage collection data...
}
```

### Pagination Hook
```typescript
import { useCmsPagination } from '@/lib/store'

function PaginationControls({ collectionId }) {
  const {
    currentPage,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = useCmsPagination(collectionId)
  
  // Control pagination...
}
```

### Settings Hook
```typescript
import { useSettings } from '@/lib/store'

function SettingsPanel() {
  const {
    theme,
    defaultPageSize,
    autoSave,
    setTheme,
    setDefaultPageSize,
    setAutoSave,
  } = useSettings()
  
  // Manage user preferences...
}
```

## Best Practices

1. **Use specific hooks** instead of accessing the entire store
2. **Leverage TypeScript** for type safety
3. **Keep slices focused** on their specific domain
4. **Use optimistic updates** for better UX
5. **Monitor performance** with the middleware in development

## Migration from Old Store

The new store maintains backward compatibility while adding:
- Better organization with slices
- Enhanced TypeScript support
- Development middleware
- User preferences
- Performance optimizations

Components using the old store patterns will continue to work, but should be gradually migrated to use the new hooks for better performance and developer experience.