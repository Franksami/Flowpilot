/**
 * Completion Step
 * Shows successful onboarding completion and next steps
 */

'use client'

import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { WebflowUser, WebflowSite } from '@/lib/types/webflow'

interface CompletionStepProps {
  user?: WebflowUser
  site?: WebflowSite
}

export function CompletionStep({ user, site }: CompletionStepProps) {
  const handleGetStarted = () => {
    // Navigate to main app - in a real app this would be router.push('/dashboard')
    window.location.href = '/dashboard'
  }

  return (
    <div className="text-center space-y-6">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Success Message */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          You&apos;re All Set!
        </h3>
        <p className="text-gray-600">
          FlowPilot is now connected to your Webflow account and ready to help you manage your content.
        </p>
      </div>

      {/* Account Summary */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h4 className="font-semibold text-gray-900 mb-3">Setup Summary</h4>
        
        <div className="space-y-3 text-left">
          {user && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Account</span>
              <span className="text-sm font-medium">{user.email}</span>
            </div>
          )}
          
          {site && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Site</span>
              <span className="text-sm font-medium">{site.name}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700">Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="text-left bg-blue-50 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-3">What&apos;s Next?</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start space-x-2">
            <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Explore your site's collections and content</span>
          </li>
          <li className="flex items-start space-x-2">
            <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Use AI to generate and optimize your content</span>
          </li>
          <li className="flex items-start space-x-2">
            <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Manage your CMS items with powerful tools</span>
          </li>
          <li className="flex items-start space-x-2">
            <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Schedule and automate content updates</span>
          </li>
        </ul>
      </div>

      {/* Get Started Button */}
      <Button
        onClick={handleGetStarted}
        size="lg"
        className="w-full"
      >
        Enter FlowPilot Dashboard
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>

      {/* Help Notice */}
      <p className="text-xs text-gray-500">
        Need help getting started? Check out our{' '}
        <button className="text-blue-600 hover:underline">
          quick start guide
        </button>{' '}
        or{' '}
        <button className="text-blue-600 hover:underline">
          contact support
        </button>
      </p>
    </div>
  )
}