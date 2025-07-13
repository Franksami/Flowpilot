/**
 * Site Selection Step
 * Allow users to choose which Webflow site to manage
 */

'use client'

import { ExternalLink, Globe, Calendar } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { WebflowSite } from '@/lib/types/webflow'

interface SiteSelectionStepProps {
  sites: WebflowSite[]
  onNext: (selectedSite: WebflowSite) => void
  onError: (error: string) => void
}

export function SiteSelectionStep({ sites, onNext, onError }: SiteSelectionStepProps) {
  const [selectedSite, setSelectedSite] = useState<WebflowSite | null>(null)

  const handleSiteSelect = (site: WebflowSite) => {
    setSelectedSite(site)
  }

  const handleContinue = () => {
    if (!selectedSite) {
      onError('Please select a site to continue')
      return
    }

    onNext(selectedSite)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (sites.length === 0) {
    return (
      <div className="text-center space-y-4">
        <div className="p-8">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Sites Found</h3>
          <p className="text-gray-600 text-sm mb-4">
            We couldn't find any sites in your Webflow account. Make sure you have at least one site created.
          </p>
          <Button
            variant="outline"
            onClick={() => window.open('https://webflow.com/dashboard', '_blank')}
          >
            Open Webflow Dashboard
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Choose Your Site</h3>
        <p className="text-gray-600 text-sm">
          Select the Webflow site you want to manage with FlowPilot
        </p>
      </div>

      {/* Sites Grid */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sites.map((site) => (
          <Card
            key={site.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedSite?.id === site.id
                ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50'
                : 'hover:border-gray-300'
            }`}
            onClick={() => handleSiteSelect(site)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-semibold text-gray-900">{site.name}</h4>
                  {site.publishedOn && (
                    <Badge variant="secondary" className="text-xs">
                      Published
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Globe className="h-3 w-3" />
                    <span>{site.defaultDomain}</span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Created {formatDate(site.createdOn)}</span>
                    </div>
                    
                    {site.lastUpdated && (
                      <div className="text-xs text-gray-500">
                        Updated {formatDate(site.lastUpdated)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Selection Indicator */}
              <div className="flex-shrink-0 ml-4">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedSite?.id === site.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedSite?.id === site.id && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              </div>
            </div>

            {/* Preview Link */}
            {site.previewUrl && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(site.previewUrl, '_blank')
                  }}
                >
                  Preview Site
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Selected Site Info */}
      {selectedSite && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-1">Selected Site</h5>
          <p className="text-blue-700 text-sm">
            You'll be managing <strong>{selectedSite.name}</strong> with FlowPilot.
            You can change this later in your settings.
          </p>
        </div>
      )}

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        className="w-full"
        disabled={!selectedSite}
      >
        Continue with {selectedSite?.name || 'Selected Site'}
      </Button>

      {/* Multiple Sites Notice */}
      {sites.length > 1 && (
        <div className="text-center text-xs text-gray-500">
          Don't worry - you can manage multiple sites by switching between them later
        </div>
      )}
    </div>
  )
}