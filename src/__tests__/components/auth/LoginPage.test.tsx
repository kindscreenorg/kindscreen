import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Use vi.hoisted so the state object is available inside the hoisted vi.mock factory
const mockState = vi.hoisted(() => ({ suspend: true }))

vi.mock('@/app/(auth)/login/LoginForm', () => {
  const neverResolves = new Promise<void>(() => {})
  return {
    default: function MockLoginForm() {
      if (mockState.suspend) throw neverResolves
      return React.createElement('div', { 'data-testid': 'login-form' }, 'Login Form')
    },
  }
})

import LoginPage from '@/app/(auth)/login/page'

describe('LoginPage', () => {
  it('shows skeleton fallback while LoginForm is loading', () => {
    mockState.suspend = true
    render(<LoginPage />)
    // LoginSkeleton renders with animate-pulse class
    expect(document.querySelector('.animate-pulse')).not.toBeNull()
  })

  it('renders LoginForm when not suspended', () => {
    mockState.suspend = false
    render(<LoginPage />)
    expect(screen.getByTestId('login-form')).toBeInTheDocument()
  })
})
