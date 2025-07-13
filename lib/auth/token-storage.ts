/**
 * Secure Token Storage
 * Handles secure storage of API keys using HTTP-only cookies (preferred)
 * or encrypted localStorage (fallback)
 */

import CryptoJS from 'crypto-js'
import Cookies from 'js-cookie'

import { env } from '../env'

const COOKIE_NAME = 'flowpilot_token'
const STORAGE_KEY = 'flowpilot_encrypted_token'
const COOKIE_OPTIONS = {
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  expires: 30, // 30 days
}

/**
 * Encrypt data for localStorage fallback
 */
function encrypt(text: string): string {
  if (!env.ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured')
  }
  return CryptoJS.AES.encrypt(text, env.ENCRYPTION_KEY).toString()
}

/**
 * Decrypt data from localStorage
 */
function decrypt(encryptedText: string): string {
  if (!env.ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured')
  }
  const bytes = CryptoJS.AES.decrypt(encryptedText, env.ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export const TokenStorage = {
  /**
   * Store API token securely
   * Prefers HTTP-only cookies, falls back to encrypted localStorage
   */
  store(token: string): void {
    try {
      // Try to use HTTP-only cookies first (more secure)
      Cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)
    } catch {
      console.warn('Cookie storage failed, using encrypted localStorage fallback')

      // Fallback to encrypted localStorage
      if (typeof window !== 'undefined' && env.ENCRYPTION_KEY) {
        const encrypted = encrypt(token)
        localStorage.setItem(STORAGE_KEY, encrypted)
      } else {
        throw new Error('Token storage failed: no secure storage available')
      }
    }
  },

  /**
   * Retrieve API token
   */
  retrieve(): string | null {
    try {
      // Try cookies first
      const cookieToken = Cookies.get(COOKIE_NAME)
      if (cookieToken) {
        return cookieToken
      }

      // Fallback to encrypted localStorage
      if (typeof window !== 'undefined') {
        const encrypted = localStorage.getItem(STORAGE_KEY)
        if (encrypted && env.ENCRYPTION_KEY) {
          return decrypt(encrypted)
        }
      }

      return null
    } catch (error) {
      console.error('Token retrieval failed:', error)
      return null
    }
  },

  /**
   * Remove stored token
   */
  remove(): void {
    try {
      // Remove from cookies
      Cookies.remove(COOKIE_NAME)

      // Remove from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (error) {
      console.error('Token removal failed:', error)
    }
  },

  /**
   * Check if token exists
   */
  exists(): boolean {
    return this.retrieve() !== null
  },
}

/**
 * Hook for React components to use token storage
 */
export function useTokenStorage() {
  return {
    storeToken: TokenStorage.store,
    getToken: TokenStorage.retrieve,
    removeToken: TokenStorage.remove,
    hasToken: TokenStorage.exists,
  }
}
