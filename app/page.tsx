'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import { useAppStore } from '@/lib/store'


export default function Home() {
  const router = useRouter()
  const { isAuthenticated, currentSite } = useAppStore()

  useEffect(() => {
    // Redirect authenticated users with a selected site to CMS hub
    if (isAuthenticated && currentSite) {
      router.push('/cms')
    }
  }, [isAuthenticated, currentSite, router])

  // Show onboarding for unauthenticated users or users without a site
  return <OnboardingFlow />
}
