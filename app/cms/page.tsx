/**
 * CMS Hub Page
 * Main dashboard for managing Webflow CMS content
 * Integrated with centralized state management
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

import { CmsDataTable } from '@/components/cms/cms-data-table'
import { ErrorBoundary, PageErrorFallback } from '@/components/errors/error-boundary'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ToastProvider, useToast } from '@/components/ui/toast'
import { getWebflowCollections } from '@/lib/actions/webflow-actions'
import { errorHandler } from '@/lib/errors/handler'
import { useAppStore, useCms } from '@/lib/store'
import type { WebflowCollection } from '@/lib/types/webflow'

function CmsHubContent() {
  const { apiKey, currentSite, isAuthenticated } = useAppStore()
  const { activeCollection, setActiveCollection, initializeCollection } = useCms()
  const { addToast } = useToast()

  // Initialize error handler with toast function
  useEffect(() => {
    errorHandler.initialize(addToast)
  }, [addToast])

  const [collections, setCollections] = useState<WebflowCollection[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCollections = useCallback(async () => {
    if (!apiKey || !currentSite) return

    setLoading(true)
    setError(null)

    try {
      const response = await errorHandler.withRetry(
        async () => {
          const result = await getWebflowCollections(apiKey, currentSite.id)
          if (!result.success) {
            throw new Error(result.error || 'Failed to fetch collections')
          }
          return result
        },
        `fetch-collections-${currentSite.id}`,
        { maxAttempts: 3, baseDelay: 1000 }
      )

      if (response.collections) {
        setCollections(response.collections)
      }
    } catch (err) {
      const appError = errorHandler.handleError(err, {
        context: errorHandler.createContext({
          operation: 'fetchCollections',
          additionalData: { siteId: currentSite.id },
        }),
      })
      setError(appError.userMessage)
    } finally {
      setLoading(false)
    }
  }, [apiKey, currentSite])

  // Fetch collections on mount
  useEffect(() => {
    if (isAuthenticated && apiKey && currentSite) {
      fetchCollections()
    }
  }, [isAuthenticated, apiKey, currentSite, fetchCollections])

  // Handle collection selection
  const handleSelectCollection = useCallback(
    (collection: WebflowCollection) => {
      // Initialize collection in store if not already done
      initializeCollection(collection)
      // Set as active collection
      setActiveCollection(collection)
    },
    [initializeCollection, setActiveCollection]
  )

  // Redirect to onboarding if not authenticated
  if (!isAuthenticated || !apiKey || !currentSite) {
    return (
      <div className='container mx-auto p-6'>
        <Alert>
          <AlertDescription>
            Please complete the onboarding process to access the CMS hub.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className='container mx-auto p-6'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold'>CMS Hub</h1>
        <p className='text-muted-foreground mt-2'>
          Manage your Webflow CMS content for {currentSite.name}
        </p>
      </div>

      {error && (
        <Alert variant='destructive' className='mb-6'>
          <AlertDescription className='flex items-center justify-between'>
            <span>{error}</span>
            <div className='ml-4 flex gap-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => {
                  setError(null)
                  fetchCollections()
                }}
                disabled={loading}
              >
                Try Again
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() => {
                  setError(null)
                  setActiveCollection(null)
                  fetchCollections()
                }}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className='grid gap-6'>
        {/* Collections Section */}
        <Card>
          <CardHeader>
            <CardTitle>Collections</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !activeCollection && (
              <div className='py-4 text-center'>Loading collections...</div>
            )}

            {collections.length === 0 && !loading ? (
              <div className='text-muted-foreground py-4 text-center'>
                No collections found in this site.
              </div>
            ) : (
              <div className='grid gap-3'>
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      activeCollection?.id === collection.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <div>
                      <h3 className='font-medium'>{collection.name}</h3>
                      <p className='text-muted-foreground text-sm'>
                        {collection.singularName} • {collection.fields.length} fields
                      </p>
                    </div>
                    <Button
                      variant={activeCollection?.id === collection.id ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => handleSelectCollection(collection)}
                      disabled={loading}
                    >
                      {activeCollection?.id === collection.id ? 'Selected' : 'Select'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CMS Items Table */}
        {activeCollection && (
          <Card>
            <CardHeader>
              <CardTitle>{activeCollection.name} Items</CardTitle>
            </CardHeader>
            <CardContent>
              <CmsDataTable collection={activeCollection} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function CmsHubPage() {
  return (
    <ToastProvider>
      <ErrorBoundary level='page' fallback={PageErrorFallback}>
        <CmsHubContent />
      </ErrorBoundary>
    </ToastProvider>
  )
}
