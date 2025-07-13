/**
 * Bulk Action Toolbar Component
 * Floating toolbar that appears when items are selected for bulk operations
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Archive, Edit, Copy, FileUp, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { WebflowCollection } from '@/lib/types/webflow'

interface BulkActionToolbarProps {
  collection: WebflowCollection
  selectedCount: number
  totalCount: number
  onDelete: () => Promise<void>
  onArchive?: () => Promise<void>
  onPublish?: () => Promise<void>
  onDuplicate?: () => Promise<void>
  onEdit?: () => void
  onClearSelection: () => void
}

interface BulkOperation {
  id: string
  type: 'delete' | 'archive' | 'publish' | 'duplicate'
  total: number
  completed: number
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  error?: string
}

export function BulkActionToolbar({
  collection,
  selectedCount,
  totalCount,
  onDelete,
  onArchive,
  onPublish,
  onDuplicate,
  onEdit,
  onClearSelection,
}: BulkActionToolbarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [operation, setOperation] = useState<BulkOperation | null>(null)

  const handleDelete = async () => {
    setShowDeleteDialog(false)
    setOperation({
      id: `delete-${Date.now()}`,
      type: 'delete',
      total: selectedCount,
      completed: 0,
      status: 'in-progress',
    })

    try {
      await onDelete()
      setOperation((prev) =>
        prev ? { ...prev, status: 'completed', completed: prev.total } : null
      )
      setTimeout(() => {
        setOperation(null)
        onClearSelection()
      }, 2000)
    } catch (error) {
      setOperation((prev) =>
        prev
          ? {
              ...prev,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Operation failed',
            }
          : null
      )
    }
  }

  const getOperationIcon = () => {
    if (!operation) return null

    switch (operation.status) {
      case 'in-progress':
        return <Loader2 className='h-4 w-4 animate-spin' />
      case 'completed':
        return <CheckCircle className='h-4 w-4 text-green-600' />
      case 'failed':
        return <XCircle className='h-4 w-4 text-red-600' />
      default:
        return null
    }
  }

  const getOperationMessage = () => {
    if (!operation) return ''

    const actionText = {
      delete: 'Deleting',
      archive: 'Archiving',
      publish: 'Publishing',
      duplicate: 'Duplicating',
    }[operation.type]

    switch (operation.status) {
      case 'in-progress':
        return `${actionText} ${operation.completed} of ${operation.total} items...`
      case 'completed':
        return `Successfully ${operation.type}d ${operation.total} items`
      case 'failed':
        return operation.error || `Failed to ${operation.type} items`
      default:
        return ''
    }
  }

  if (selectedCount === 0 && !operation) return null

  return (
    <>
      <AnimatePresence>
        {(selectedCount > 0 || operation) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className='fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform'
          >
            <div className='bg-background flex items-center gap-2 rounded-lg border p-2 shadow-lg'>
              {operation ? (
                // Operation in progress
                <div className='flex items-center gap-3 px-3 py-1'>
                  {getOperationIcon()}
                  <span className='text-sm font-medium'>{getOperationMessage()}</span>
                  {operation.status === 'in-progress' && (
                    <Progress
                      value={(operation.completed / operation.total) * 100}
                      className='w-32'
                    />
                  )}
                </div>
              ) : (
                // Action buttons
                <>
                  <div className='flex items-center gap-2 border-r px-3'>
                    <span className='text-sm font-medium'>
                      {selectedCount} of {totalCount} selected
                    </span>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={onClearSelection}
                      className='h-7 px-2 text-xs'
                    >
                      Clear
                    </Button>
                  </div>

                  <div className='flex items-center gap-1 px-2'>
                    {onEdit && (
                      <Button variant='ghost' size='sm' onClick={onEdit} className='h-8 gap-2'>
                        <Edit className='h-4 w-4' />
                        Edit
                      </Button>
                    )}

                    {onDuplicate && (
                      <Button variant='ghost' size='sm' onClick={onDuplicate} className='h-8 gap-2'>
                        <Copy className='h-4 w-4' />
                        Duplicate
                      </Button>
                    )}

                    {onArchive && (
                      <Button variant='ghost' size='sm' onClick={onArchive} className='h-8 gap-2'>
                        <Archive className='h-4 w-4' />
                        Archive
                      </Button>
                    )}

                    {onPublish && (
                      <Button variant='ghost' size='sm' onClick={onPublish} className='h-8 gap-2'>
                        <FileUp className='h-4 w-4' />
                        Publish
                      </Button>
                    )}

                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setShowDeleteDialog(true)}
                      className='h-8 gap-2 text-red-600 hover:bg-red-50 hover:text-red-700'
                    >
                      <Trash2 className='h-4 w-4' />
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} items?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedCount} {collection.name} items. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className='bg-red-600 hover:bg-red-700'>
              Delete Items
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
