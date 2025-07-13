/**
 * CMS Item Dialog Component
 * Modal dialog for creating, editing, and viewing CMS items
 */

'use client'

import { Trash2, Eye, Edit } from 'lucide-react'
import { useState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { WebflowCollection, WebflowCmsItem } from '@/lib/types/webflow'

import { CmsItemForm } from './cms-item-form'

interface CmsItemDialogProps {
  collection: WebflowCollection
  item?: WebflowCmsItem
  mode: 'create' | 'edit' | 'view' | 'delete'
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSave?: (data: Record<string, unknown>) => Promise<void>
  onDelete?: () => Promise<void>
}

export function CmsItemDialog({
  collection,
  item,
  mode,
  trigger,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: CmsItemDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dialogOpen = open !== undefined ? open : isOpen
  const setDialogOpen = onOpenChange || setIsOpen

  const handleSave = async (data: Record<string, unknown>) => {
    if (!onSave) return

    setLoading(true)
    setError(null)

    try {
      await onSave(data)
      setDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return

    setLoading(true)
    setError(null)

    try {
      await onDelete()
      setDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getDialogTitle = () => {
    switch (mode) {
      case 'create':
        return `Create New ${collection.singularName}`
      case 'edit':
        return `Edit ${collection.singularName}`
      case 'view':
        return `View ${collection.singularName}`
      case 'delete':
        return `Delete ${collection.singularName}`
      default:
        return collection.singularName
    }
  }

  const getDialogDescription = () => {
    switch (mode) {
      case 'create':
        return `Create a new item in the ${collection.name} collection.`
      case 'edit':
        return `Edit the details of this ${collection.singularName}.`
      case 'view':
        return `View the details of this ${collection.singularName}.`
      case 'delete':
        return `Are you sure you want to delete this ${collection.singularName}? This action cannot be undone.`
      default:
        return ''
    }
  }

  const renderContent = () => {
    if (error) {
      return (
        <Alert variant='destructive' className='mb-4'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )
    }

    switch (mode) {
      case 'create':
      case 'edit':
        return (
          <CmsItemForm
            collection={collection}
            item={item}
            onSubmit={handleSave}
            onCancel={() => setDialogOpen(false)}
            loading={loading}
          />
        )

      case 'view':
        return (
          <div className='space-y-4'>
            {collection.fields
              .filter((field) => !field.archived)
              .map((field) => {
                const value = item?.fieldData[field.slug]

                return (
                  <div key={field.id} className='grid grid-cols-3 gap-4'>
                    <div className='text-muted-foreground text-sm font-medium'>{field.name}</div>
                    <div className='col-span-2 text-sm'>{value ? String(value) : '-'}</div>
                  </div>
                )
              })}

            <div className='flex justify-end border-t pt-4'>
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
            </div>
          </div>
        )

      case 'delete':
        return (
          <div className='space-y-4'>
            <Alert variant='destructive'>
              <AlertDescription>
                This action cannot be undone. The item will be permanently deleted from your Webflow
                site.
              </AlertDescription>
            </Alert>

            {item && (
              <div className='bg-muted rounded-lg p-4'>
                <div className='text-sm font-medium'>Item Details:</div>
                <div className='text-muted-foreground mt-1 text-sm'>ID: {item.id}</div>
                <div className='text-muted-foreground text-sm'>
                  Created: {new Date(item.createdOn).toLocaleDateString()}
                </div>
                <div className='text-muted-foreground text-sm'>
                  Last Updated: {new Date(item.lastUpdated).toLocaleDateString()}
                </div>
              </div>
            )}

            <div className='flex justify-end space-x-2 border-t pt-4'>
              <Button variant='outline' onClick={() => setDialogOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button variant='destructive' onClick={handleDelete} disabled={loading}>
                {loading ? 'Deleting...' : 'Delete Item'}
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getDefaultTrigger = () => {
    switch (mode) {
      case 'create':
        return <Button>Create New {collection.singularName}</Button>
      case 'edit':
        return (
          <Button variant='outline' size='sm'>
            <Edit className='mr-1 h-4 w-4' />
            Edit
          </Button>
        )
      case 'view':
        return (
          <Button variant='outline' size='sm'>
            <Eye className='mr-1 h-4 w-4' />
            View
          </Button>
        )
      case 'delete':
        return (
          <Button variant='outline' size='sm'>
            <Trash2 className='mr-1 h-4 w-4' />
            Delete
          </Button>
        )
      default:
        return <Button>Open</Button>
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>{getDefaultTrigger()}</DialogTrigger>
      )}

      <DialogContent
        className={
          mode === 'create' || mode === 'edit'
            ? 'max-h-[90vh] max-w-2xl overflow-y-auto'
            : 'max-w-lg'
        }
      >
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
