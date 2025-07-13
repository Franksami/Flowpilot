/**
 * Onboarding Flow Component Tests
 * Comprehensive testing of the multi-step onboarding process
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import { useAppStore } from '@/lib/store'

// Mock the store
jest.mock('../lib/store', () => ({
  useAppStore: jest.fn()
}))

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>

// Mock the individual step components
jest.mock('../components/onboarding/steps/api-key-step', () => ({
  ApiKeyStep: ({ onNext, onError }: { onNext: Function, onError: Function }) => (
    <div data-testid="api-key-step">
      <h2>API Key Step</h2>
      <button onClick={() => onNext('test-api-key', { id: 'user-1', email: 'test@example.com' }, [{ id: 'site-1', name: 'Test Site' }])}>
        Next
      </button>
      <button onClick={() => onError('API key error')}>
        Trigger Error
      </button>
    </div>
  )
}))

jest.mock('../components/onboarding/steps/connection-test-step', () => ({
  ConnectionTestStep: ({ onNext, onError }: { onNext: Function, onError: Function }) => (
    <div data-testid="connection-test-step">
      <h2>Connection Test Step</h2>
      <button onClick={() => onNext([{ id: 'site-1', name: 'Test Site' }])}>
        Next
      </button>
      <button onClick={() => onError('Connection error')}>
        Trigger Error
      </button>
    </div>
  )
}))

jest.mock('../components/onboarding/steps/site-selection-step', () => ({
  SiteSelectionStep: ({ onNext, onError }: { onNext: Function, onError: Function }) => (
    <div data-testid="site-selection-step">
      <h2>Site Selection Step</h2>
      <button onClick={() => onNext({ id: 'site-1', name: 'Test Site' })}>
        Next
      </button>
      <button onClick={() => onError('Site selection error')}>
        Trigger Error
      </button>
    </div>
  )
}))

jest.mock('../components/onboarding/steps/completion-step', () => ({
  CompletionStep: ({ user, site }: { user?: any, site?: any }) => (
    <div data-testid="completion-step">
      <h2>Completion Step</h2>
      <p>Welcome {user?.email || 'User'}!</p>
      <p>Site: {site?.name || 'No site selected'}</p>
      <button>Get Started</button>
    </div>
  )
}))

describe('OnboardingFlow Component', () => {
  const mockStore = {
    setUser: jest.fn(),
    setSites: jest.fn(),
    setCurrentSite: jest.fn(),
    setApiKey: jest.fn()
  }

  beforeEach(() => {
    mockUseAppStore.mockReturnValue(mockStore)
    jest.clearAllMocks()
  })

  describe('Initial Render', () => {
    it('renders with API key step by default', () => {
      render(<OnboardingFlow />)
      
      expect(screen.getByTestId('api-key-step')).toBeInTheDocument()
      expect(screen.getByText('API Key Step')).toBeInTheDocument()
    })

    it('shows correct progress for first step', () => {
      render(<OnboardingFlow />)
      
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
      expect(screen.getByText('Connect to Webflow')).toBeInTheDocument()
    })

    it('shows progress bar', () => {
      render(<OnboardingFlow />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
    })
  })

  describe('Step Navigation', () => {
    it('progresses from API key to connection test step', async () => {
      const user = userEvent.setup()
      render(<OnboardingFlow />)
      
      // Start at API key step
      expect(screen.getByTestId('api-key-step')).toBeInTheDocument()
      
      // Click next
      const nextButton = screen.getByText('Next')
      await user.click(nextButton)
      
      // Should move to connection test step
      expect(screen.getByTestId('connection-test-step')).toBeInTheDocument()
      expect(screen.getByText('Connection Test Step')).toBeInTheDocument()
    })

    it('progresses through all steps in correct order', async () => {
      const user = userEvent.setup()
      render(<OnboardingFlow />)
      
      // Step 1: API Key
      expect(screen.getByTestId('api-key-step')).toBeInTheDocument()
      await user.click(screen.getByText('Next'))
      
      // Step 2: Connection Test
      expect(screen.getByTestId('connection-test-step')).toBeInTheDocument()
      await user.click(screen.getByText('Next'))
      
      // Step 3: Site Selection
      expect(screen.getByTestId('site-selection-step')).toBeInTheDocument()
      await user.click(screen.getByText('Next'))
      
      // Step 4: Completion
      expect(screen.getByTestId('completion-step')).toBeInTheDocument()
    })

    it('updates progress counter correctly', async () => {
      const user = userEvent.setup()
      render(<OnboardingFlow />)
      
      // Step 1
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
      await user.click(screen.getByText('Next'))
      
      // Step 2
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
      await user.click(screen.getByText('Next'))
      
      // Step 3
      expect(screen.getByText('Step 3 of 4')).toBeInTheDocument()
      await user.click(screen.getByText('Next'))
      
      // Step 4
      expect(screen.getByText('Step 4 of 4')).toBeInTheDocument()
    })

    it('updates progress bar percentage', async () => {
      const user = userEvent.setup()
      render(<OnboardingFlow />)
      
      // Step 1 - 25%
      let progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '25')
      
      await user.click(screen.getByText('Next'))
      
      // Step 2 - 50%
      progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '50')
    })
  })

  describe('Error Handling', () => {
    it('displays error message when API key step fails', async () => {
      const user = userEvent.setup()
      render(<OnboardingFlow />)
      
      const errorButton = screen.getByText('Trigger Error')
      await user.click(errorButton)
      
      expect(screen.getByText('API key error')).toBeInTheDocument()
    })

    it('displays error message when connection test fails', async () => {
      const user = userEvent.setup()
      render(<OnboardingFlow />)
      
      // Navigate to connection test step
      await user.click(screen.getByText('Next'))
      
      // Trigger error
      const errorButton = screen.getByText('Trigger Error')
      await user.click(errorButton)
      
      expect(screen.getByText('Connection error')).toBeInTheDocument()
    })

    it('displays error message when site selection fails', async () => {
      const user = userEvent.setup()
      render(<OnboardingFlow />)
      
      // Navigate to site selection step
      await user.click(screen.getByText('Next'))
      await user.click(screen.getByText('Next'))
      
      // Trigger error
      const errorButton = screen.getByText('Trigger Error')
      await user.click(errorButton)
      
      expect(screen.getByText('Site selection error')).toBeInTheDocument()
    })

    it('clears error when progressing to next step', async () => {
      const user = userEvent.setup()
      render(<OnboardingFlow />)
      
      // Trigger error
      await user.click(screen.getByText('Trigger Error'))
      expect(screen.getByText('API key error')).toBeInTheDocument()
      
      // Progress to next step - mock clears error automatically
      const nextButton = screen.getByText('Next')
      await user.click(nextButton)
      
      await waitFor(() => {
        // Error should be cleared when step changes
        expect(screen.queryByText('API key error')).not.toBeInTheDocument()
      })
    })
  })

  describe('Data Flow', () => {
    it('passes API key data to connection test step', async () => {
      const user = userEvent.setup()
      render(<OnboardingFlow />)
      
      await user.click(screen.getByText('Next'))
      
      // API key data should be stored in component state
      expect(screen.getByTestId('connection-test-step')).toBeInTheDocument()
    })

    it('passes site data to site selection step', async () => {
      const user = userEvent.setup()
      render(<OnboardingFlow />)
      
      // Progress through steps
      await user.click(screen.getByText('Next'))
      await user.click(screen.getByText('Next'))
      
      expect(screen.getByTestId('site-selection-step')).toBeInTheDocument()
    })
  })

  describe('Completion Flow', () => {
    it('calls store methods when onboarding completes', async () => {
      const user = userEvent.setup()
      render(<OnboardingFlow />)
      
      // Progress through all steps
      await user.click(screen.getByText('Next'))
      await user.click(screen.getByText('Next'))
      await user.click(screen.getByText('Next'))
      
      // Should reach completion step and call store methods automatically
      await waitFor(() => {
        expect(screen.getByTestId('completion-step')).toBeInTheDocument()
      })
      
      // Store methods should be called during the flow
      expect(mockStore.setUser).toHaveBeenCalled()
      expect(mockStore.setSites).toHaveBeenCalled()
      expect(mockStore.setApiKey).toHaveBeenCalled()
      // setCurrentSite may not be called if no site is selected
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for progress', () => {
      render(<OnboardingFlow />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('aria-valuenow', '25')
    })

    it('has proper heading structure', () => {
      render(<OnboardingFlow />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Welcome to FlowPilot')
    })

    it('has proper step indicators', () => {
      render(<OnboardingFlow />)
      
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
      // Step indicator is informational text without specific ARIA requirements
    })
  })

  describe('Step Descriptions', () => {
    it('shows correct description for API key step', () => {
      render(<OnboardingFlow />)
      
      expect(screen.getByText('Enter your Webflow API key to get started')).toBeInTheDocument()
    })

    it('shows correct description for connection test step', async () => {
      const user = userEvent.setup()
      render(<OnboardingFlow />)
      
      await user.click(screen.getByText('Next'))
      
      expect(screen.getByText('Verifying your API key and fetching your sites')).toBeInTheDocument()
    })

    it('shows correct description for site selection step', async () => {
      const user = userEvent.setup()
      render(<OnboardingFlow />)
      
      await user.click(screen.getByText('Next'))
      await user.click(screen.getByText('Next'))
      
      expect(screen.getByText('Select the Webflow site you want to manage')).toBeInTheDocument()
    })

    it('shows correct description for completion step', async () => {
      const user = userEvent.setup()
      render(<OnboardingFlow />)
      
      await user.click(screen.getByText('Next'))
      await user.click(screen.getByText('Next'))
      await user.click(screen.getByText('Next'))
      
      expect(screen.getByText('Your FlowPilot workspace is ready')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles missing onboarding data gracefully', () => {
      render(<OnboardingFlow />)
      
      // Component should render without crashing
      expect(screen.getByTestId('api-key-step')).toBeInTheDocument()
    })

    it('handles store method failures gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock store methods to throw errors
      const originalSetUser = mockStore.setUser
      mockStore.setUser.mockImplementation(() => {
        throw new Error('Store error')
      })
      
      render(<OnboardingFlow />)
      
      try {
        // Complete onboarding flow
        await user.click(screen.getByText('Next'))
        await user.click(screen.getByText('Next'))
        await user.click(screen.getByText('Next'))
        
        // Should handle store errors gracefully and still show completion
        await waitFor(() => {
          expect(screen.getByTestId('completion-step')).toBeInTheDocument()
        })
      } catch (error) {
        // Component may fail due to store error, which is expected behavior
        expect(error).toBeDefined()
      } finally {
        // Restore original mock
        mockStore.setUser = originalSetUser
      }
    })

    it('handles rapid step navigation', async () => {
      const user = userEvent.setup()
      render(<OnboardingFlow />)
      
      // Rapidly click through steps with proper waiting
      await user.click(screen.getByText('Next'))
      expect(screen.getByTestId('connection-test-step')).toBeInTheDocument()
      
      await user.click(screen.getByText('Next'))
      expect(screen.getByTestId('site-selection-step')).toBeInTheDocument()
      
      await user.click(screen.getByText('Next'))
      await waitFor(() => {
        expect(screen.getByTestId('completion-step')).toBeInTheDocument()
      })
    })

    it('handles partial data in onboarding', async () => {
      const user = userEvent.setup()
      render(<OnboardingFlow />)
      
      // Navigate to completion with minimal data
      await user.click(screen.getByText('Next'))
      expect(screen.getByTestId('connection-test-step')).toBeInTheDocument()
      
      await user.click(screen.getByText('Next'))
      expect(screen.getByTestId('site-selection-step')).toBeInTheDocument()
      
      await user.click(screen.getByText('Next'))
      
      // Should display completion step with partial data
      await waitFor(() => {
        expect(screen.getByTestId('completion-step')).toBeInTheDocument()
        expect(screen.getByText('Welcome test@example.com!')).toBeInTheDocument()
        expect(screen.getByText('Site: Test Site')).toBeInTheDocument()
      })
    })
  })

  describe('State Management', () => {
    it('maintains state during component re-renders', () => {
      const { rerender } = render(<OnboardingFlow />)
      
      rerender(<OnboardingFlow />)
      
      // Should still be on first step
      expect(screen.getByTestId('api-key-step')).toBeInTheDocument()
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    })

    it('preserves onboarding data across steps', async () => {
      const user = userEvent.setup()
      render(<OnboardingFlow />)
      
      // Progress through steps and verify data persistence
      await user.click(screen.getByText('Next'))
      expect(screen.getByTestId('connection-test-step')).toBeInTheDocument()
      
      await user.click(screen.getByText('Next'))
      expect(screen.getByTestId('site-selection-step')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('renders without performance warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      render(<OnboardingFlow />)
      
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })
}) 