export const useAppStore = jest.fn(() => ({
  user: null,
  isAuthenticated: false,
  currentSite: null,
  sites: [],
  apiKey: '',
  setUser: jest.fn(),
  setApiKey: jest.fn(),
  setSites: jest.fn(),
  setCurrentSite: jest.fn(),
}))
