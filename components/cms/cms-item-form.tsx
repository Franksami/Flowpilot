/**
 * CMS Item Form Component
 * Dynamic form for creating and editing CMS items based on collection fields
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { WebflowCollection, WebflowCmsItem, WebflowField } from '@/lib/types/webflow'

interface CmsItemFormProps {
  collection: WebflowCollection
  item?: WebflowCmsItem // For editing existing items
  onSubmit: (data: Record<string, unknown>) => void
  onCancel: () => void
  loading?: boolean
}

// Generate form schema based on collection fields
const generateFormSchema = (fields: WebflowField[]) => {
  const schemaFields: Record<string, z.ZodTypeAny> = {}

  fields.forEach((field) => {
    if (field.archived || !field.editable) return

    let fieldSchema: z.ZodTypeAny

    switch (field.type) {
      case 'PlainText':
      case 'Email':
      case 'Phone':
      case 'Link':
        fieldSchema = z.string()
        break
      case 'RichText':
        fieldSchema = z.string()
        break
      case 'Number':
        fieldSchema = z.coerce.number()
        break
      case 'Bool':
        fieldSchema = z.boolean()
        break
      case 'Date':
      case 'DateTime':
        fieldSchema = z.string()
        break
      case 'Option':
        fieldSchema = z.string()
        break
      case 'Color':
        fieldSchema = z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format')
        break
      default:
        fieldSchema = z.string()
    }

    // Make field required if specified
    if (field.required) {
      if ('min' in fieldSchema) {
        fieldSchema = (fieldSchema as z.ZodString).min(1, `${field.name} is required`)
      }
    } else {
      fieldSchema = fieldSchema.optional()
    }

    schemaFields[field.slug] = fieldSchema
  })

  return z.object(schemaFields)
}

// Generate default values for form
const generateDefaultValues = (fields: WebflowField[], item?: WebflowCmsItem) => {
  const defaultValues: Record<string, unknown> = {}

  fields.forEach((field) => {
    if (field.archived || !field.editable) return

    if (item?.fieldData[field.slug] !== undefined) {
      // Use existing value for editing
      defaultValues[field.slug] = item.fieldData[field.slug]
    } else {
      // Use appropriate default for new items
      switch (field.type) {
        case 'Number':
          defaultValues[field.slug] = 0
          break
        case 'Bool':
          defaultValues[field.slug] = false
          break
        case 'Date':
        case 'DateTime':
          defaultValues[field.slug] = new Date().toISOString().split('T')[0]
          break
        default:
          defaultValues[field.slug] = ''
      }
    }
  })

  return defaultValues
}

export function CmsItemForm({
  collection,
  item,
  onSubmit,
  onCancel,
  loading = false,
}: CmsItemFormProps) {
  const editableFields = collection.fields.filter((field) => !field.archived && field.editable)
  const formSchema = generateFormSchema(editableFields)
  const defaultValues = generateDefaultValues(editableFields, item)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const handleSubmit = (data: Record<string, unknown>) => {
    // Process form data based on field types
    const processedData: Record<string, unknown> = {}

    editableFields.forEach((field) => {
      const value = data[field.slug]

      if (value === undefined || value === null || value === '') {
        if (!field.required) {
          processedData[field.slug] = null
        }
        return
      }

      switch (field.type) {
        case 'Number':
          processedData[field.slug] = Number(value)
          break
        case 'Bool':
          processedData[field.slug] = Boolean(value)
          break
        case 'Date':
        case 'DateTime':
          processedData[field.slug] = new Date(value as string | number | Date).toISOString()
          break
        default:
          processedData[field.slug] = value
      }
    })

    onSubmit(processedData)
  }

  const renderField = (field: WebflowField) => {
    const fieldName = field.slug

    return (
      <FormField
        key={field.id}
        control={form.control}
        name={fieldName}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>
              {field.name}
              {field.required && <span className='ml-1 text-red-500'>*</span>}
            </FormLabel>
            <FormControl>
              {(() => {
                switch (field.type) {
                  case 'RichText':
                    return (
                      <Textarea
                        value={String(formField.value || '')}
                        onChange={formField.onChange}
                        onBlur={formField.onBlur}
                        name={formField.name}
                        ref={formField.ref}
                        placeholder={`Enter ${field.name.toLowerCase()}`}
                        rows={4}
                      />
                    )

                  case 'Number':
                    return (
                      <Input
                        value={String(formField.value || '')}
                        onChange={(e) => formField.onChange(e.target.value)}
                        onBlur={formField.onBlur}
                        name={formField.name}
                        ref={formField.ref}
                        type='number'
                        placeholder={`Enter ${field.name.toLowerCase()}`}
                      />
                    )

                  case 'Email':
                    return (
                      <Input
                        value={String(formField.value || '')}
                        onChange={formField.onChange}
                        onBlur={formField.onBlur}
                        name={formField.name}
                        ref={formField.ref}
                        type='email'
                        placeholder={`Enter ${field.name.toLowerCase()}`}
                      />
                    )

                  case 'Phone':
                    return (
                      <Input
                        value={String(formField.value || '')}
                        onChange={formField.onChange}
                        onBlur={formField.onBlur}
                        name={formField.name}
                        ref={formField.ref}
                        type='tel'
                        placeholder={`Enter ${field.name.toLowerCase()}`}
                      />
                    )

                  case 'Link':
                    return (
                      <Input
                        value={String(formField.value || '')}
                        onChange={formField.onChange}
                        onBlur={formField.onBlur}
                        name={formField.name}
                        ref={formField.ref}
                        type='url'
                        placeholder={`Enter ${field.name.toLowerCase()}`}
                      />
                    )

                  case 'Date':
                    return (
                      <Input
                        value={String(formField.value || '')}
                        onChange={formField.onChange}
                        onBlur={formField.onBlur}
                        name={formField.name}
                        ref={formField.ref}
                        type='date'
                      />
                    )

                  case 'DateTime':
                    return (
                      <Input
                        value={String(formField.value || '')}
                        onChange={(e) => formField.onChange(e.target.value)}
                        onBlur={formField.onBlur}
                        name={formField.name}
                        ref={formField.ref}
                        type='datetime-local'
                      />
                    )

                  case 'Bool':
                    return (
                      <Select
                        onValueChange={(value) => formField.onChange(value === 'true')}
                        value={String(formField.value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select option' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='false'>No</SelectItem>
                          <SelectItem value='true'>Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    )

                  case 'Color':
                    return (
                      <Input
                        value={String(formField.value || '')}
                        onChange={formField.onChange}
                        onBlur={formField.onBlur}
                        name={formField.name}
                        ref={formField.ref}
                        type='color'
                      />
                    )

                  default:
                    return (
                      <Input
                        value={String(formField.value || '')}
                        onChange={formField.onChange}
                        onBlur={formField.onBlur}
                        name={formField.name}
                        ref={formField.ref}
                        placeholder={`Enter ${field.name.toLowerCase()}`}
                      />
                    )
                }
              })()}
            </FormControl>
            {field.required && <FormDescription>This field is required</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
        <div className='grid gap-4'>{editableFields.map(renderField)}</div>

        <div className='flex justify-end space-x-2 border-t pt-4'>
          <Button type='button' variant='outline' onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type='submit' disabled={loading}>
            {loading ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
