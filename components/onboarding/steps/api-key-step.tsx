/**
 * API Key Input Step
 * Secure input and validation of Webflow API key
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateWebflowApiKey } from '@/lib/actions/webflow-actions'
import { TokenStorage } from '@/lib/auth/token-storage'
import type { WebflowUser, WebflowSite } from '@/lib/types/webflow'

const apiKeySchema = z.object({
  apiKey: z
    .string()
    .min(1, 'API key is required')
    .regex(/^[a-f0-9]{64}$/, 'Invalid API key format')
})

type FormData = z.infer<typeof apiKeySchema>

interface ApiKeyStepProps {
  onNext: (apiKey: string, user: WebflowUser, sites: WebflowSite[]) => void
  onError: (error: string) => void
}

export function ApiKeyStep({ onNext, onError }: ApiKeyStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: TokenStorage.retrieve() || '', // Pre-fill if exists
    },
  })

  const apiKeyValue = watch('apiKey')

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    onError('') // Clear previous errors

    try {
      const result = await validateWebflowApiKey(data.apiKey)

      if (result.valid && result.user && result.sites) {
        // Store the API key securely
        TokenStorage.store(data.apiKey)
        
        // Proceed to next step
        onNext(data.apiKey, result.user, result.sites)
      } else {
        onError(result.error || 'Invalid API key')
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Validation failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Instructions */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Enter Your Webflow API Key</h3>
          <p className="text-gray-600 text-sm">
            Your API key allows FlowPilot to securely connect to your Webflow account.
            We use industry-standard encryption to protect your credentials.
          </p>
        </div>

        {/* How to get API key */}
        <Alert>
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Need an API key?</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to your Webflow Account Settings</li>
                <li>Navigate to the "API Access" section</li>
                <li>Generate a new API key with the required permissions</li>
                <li>Copy and paste it below</li>
              </ol>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="p-0 h-auto"
                onClick={() => window.open('https://webflow.com/dashboard/account/general', '_blank')}
              >
                Open Webflow Account Settings
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>

      {/* API Key Input */}
      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key</Label>
        <div className="relative">
          <Input
            id="apiKey"
            type={showApiKey ? 'text' : 'password'}
            placeholder="Enter your 64-character API key"
            className="pr-10"
            {...register('apiKey')}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {errors.apiKey && (
          <p className="text-sm text-red-600">{errors.apiKey.message}</p>
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900">Secure Storage</h4>
            <p className="text-sm text-blue-700">
              Your API key is encrypted and stored securely. We never transmit it to external services 
              and use server-side proxies to protect your credentials.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !apiKeyValue}
      >
        {isLoading ? 'Validating...' : 'Connect to Webflow'}
      </Button>
    </form>
  )
}