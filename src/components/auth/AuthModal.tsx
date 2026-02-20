'use client'

import { useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { useAuth } from './AuthProvider'
import type { AuthModalTab } from './AuthProvider'
import { SignupForm } from './SignupForm'
import { LoginForm } from './LoginForm'
import { OAuthButtons } from './OAuthButtons'
import { MagicLinkForm } from './MagicLinkForm'

const tabs: { id: AuthModalTab; label: string }[] = [
  { id: 'login', label: 'Sign In' },
  { id: 'signup', label: 'Sign Up' },
  { id: 'magic-link', label: 'Magic Link' },
]

/**
 * Auth modal with tabbed navigation for Sign In, Sign Up, and Magic Link.
 * Controls its own visibility via AuthContext.
 *
 * Features:
 * - Click outside to close
 * - Escape key to close
 * - Focus trapping for accessibility
 * - Tab navigation between auth methods
 */
export function AuthModal(): React.ReactElement | null {
  const { isModalOpen, modalTab, closeAuthModal, openAuthModal } = useAuth()
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Store the previously focused element to restore on close
  useEffect(() => {
    if (isModalOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
    } else if (previousActiveElement.current) {
      previousActiveElement.current.focus()
      previousActiveElement.current = null
    }
  }, [isModalOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isModalOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAuthModal()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isModalOpen, closeAuthModal])

  // Focus trapping - keep focus within modal
  useEffect(() => {
    if (!isModalOpen || !modalRef.current) return

    const modal = modalRef.current
    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

    const getFocusableElements = () =>
      modal.querySelectorAll<HTMLElement>(focusableSelector)

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleTab)

    // Focus first focusable element on open
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    return () => document.removeEventListener('keydown', handleTab)
  }, [isModalOpen])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isModalOpen])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        closeAuthModal()
      }
    },
    [closeAuthModal]
  )

  if (!isModalOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-white dark:bg-black rounded-3xl shadow-2xl max-w-lg w-full border border-neutral-200 dark:border-neutral-800 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors focus:outline-none z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Section */}
        <div className="pt-10 px-8 pb-2 text-center">
          <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
            <div className="h-6 w-6 rounded-md bg-emerald-500" />
          </div>
          <h2
            id="auth-modal-title"
            className="text-2xl font-light tracking-tight text-neutral-900 dark:text-white mb-2"
          >
            Welcome to Algority
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-light">
            Sign in to track your progress and master algorithms.
          </p>
        </div>

        {/* Tab content */}
        <div className="px-8 pb-10">
          {/* Custom Tab Switcher */}
          <div className="flex p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => openAuthModal(tab.id)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${modalTab === tab.id
                  ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {modalTab === 'login' && (
            <div className="space-y-6">
              <OAuthButtons />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest">
                  <span className="px-2 bg-white dark:bg-black text-neutral-400">
                    or
                  </span>
                </div>
              </div>
              <LoginForm />
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('signup')}
                  className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-500 dark:hover:text-emerald-400 text-sm font-medium focus:outline-none transition-colors"
                >
                  Don&apos;t have an account? <span className="underline decoration-emerald-500/30 underline-offset-4">Sign up</span>
                </button>
              </div>
            </div>
          )}

          {modalTab === 'signup' && (
            <div className="space-y-6">
              <OAuthButtons />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest">
                  <span className="px-2 bg-white dark:bg-black text-neutral-400">
                    or
                  </span>
                </div>
              </div>
              <SignupForm />
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-500 dark:hover:text-emerald-400 text-sm font-medium focus:outline-none transition-colors"
                >
                  Already have an account? <span className="underline decoration-emerald-500/30 underline-offset-4">Sign in</span>
                </button>
              </div>
            </div>
          )}

          {modalTab === 'magic-link' && (
            <div className="space-y-6">
              <MagicLinkForm />
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white text-sm font-medium focus:outline-none transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  ← Back to sign in
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
