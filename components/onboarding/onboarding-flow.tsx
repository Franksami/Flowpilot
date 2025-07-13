/**
 * Onboarding Flow Component
 * Multi-step secure onboarding process for Webflow API connection
 */

'use client'

import { AlertCircle, CheckCircle } from 'lucide-react'
import { useState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'
import type { WebflowSite, WebflowUser } from '@/lib/types/webflow'

import { ApiKeyStep } from './steps/api-key-step'
import { CompletionStep } from './steps/completion-step'
import { ConnectionTestStep } from './steps/connection-test-step'
import { SiteSelectionStep } from './steps/site-selection-step'

export type OnboardingStep = 'api-key' | 'connection' | 'site-selection' | 'completion'

interface OnboardingData {
  apiKey: string
  user?: WebflowUser
  sites: WebflowSite[]
  selectedSite?: WebflowSite
}

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('api-key')
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    apiKey: '',
    sites: [],
  })
  const [error, setError] = useState<string | null>(null)

  const { setUser, setSites, setCurrentSite, setApiKey } = useAppStore()

  const steps: Record<OnboardingStep, { title: string; description: string }> = {
    'api-key': {
      title: 'Connect to Webflow',
      description: 'Enter your Webflow API key to get started',
    },
    connection: {
      title: 'Testing Connection',
      description: 'Verifying your API key and fetching your sites',
    },
    'site-selection': {
      title: 'Choose Your Site',
      description: 'Select the Webflow site you want to manage',
    },
    completion: {
      title: 'All Set!',
      description: 'Your FlowPilot workspace is ready',
    },
  }

  const stepOrder: OnboardingStep[] = ['api-key', 'connection', 'site-selection', 'completion']
  const currentStepIndex = stepOrder.indexOf(currentStep)
  const progress = ((currentStepIndex + 1) / stepOrder.length) * 100

  const updateOnboardingData = (updates: Partial<OnboardingData>) => {
    setOnboardingData((prev) => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < stepOrder.length) {
      setCurrentStep(stepOrder[nextIndex])
    }
  }

  const completeOnboarding = () => {
    // Save data to global store
    if (onboardingData.user) {
      setUser({
        id: onboardingData.user.id,
        email: onboardingData.user.email,
        name: `${onboardingData.user.firstName || ''} ${onboardingData.user.lastName || ''}`.trim(),
      })
    }

    setSites(onboardingData.sites)
    setApiKey(onboardingData.apiKey)

    if (onboardingData.selectedSite) {
      setCurrentSite(onboardingData.selectedSite)
    }

    setCurrentStep('completion')
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'api-key':
        return (
          <ApiKeyStep
            onNext={(apiKey, user, sites) => {
              updateOnboardingData({ apiKey, user, sites })
              nextStep()
            }}
            onError={setError}
          />
        )

      case 'connection':
        return (
          <ConnectionTestStep apiKey={onboardingData.apiKey} onNext={nextStep} onError={setError} />
        )

      case 'site-selection':
        return (
          <SiteSelectionStep
            sites={onboardingData.sites}
            onNext={(selectedSite) => {
              updateOnboardingData({ selectedSite })
              completeOnboarding()
            }}
            onError={setError}
          />
        )

      case 'completion':
        return <CompletionStep user={onboardingData.user} site={onboardingData.selectedSite} />

      default:
        return null
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4'>
      <div className='w-full max-w-2xl'>
        <Card className='p-8'>
          {/* Header */}
          <div className='mb-8 text-center'>
            <h1 className='mb-2 text-3xl font-bold text-gray-900'>Welcome to FlowPilot</h1>
            <p className='text-gray-600'>Let&apos;s connect your Webflow account to get started</p>
          </div>

          {/* Progress */}
          <div className='mb-8'>
            <div className='mb-2 flex items-center justify-between'>
              <span className='text-sm font-medium text-gray-700'>{steps[currentStep].title}</span>
              <span className='text-sm text-gray-500'>
                Step {currentStepIndex + 1} of {stepOrder.length}
              </span>
            </div>
            <Progress value={progress} className='mb-2' />
            <p className='text-sm text-gray-600'>{steps[currentStep].description}</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant='destructive' className='mb-6'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Current Step */}
          <div className='min-h-[300px]'>{renderStep()}</div>
        </Card>

        {/* Security Notice */}
        <div className='mt-6 text-center'>
          <div className='inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm text-gray-600 shadow-sm'>
            <CheckCircle className='mr-2 h-4 w-4 text-green-500' />
            Your API key is encrypted and stored securely
          </div>
        </div>
      </div>
    </div>
  )
}
