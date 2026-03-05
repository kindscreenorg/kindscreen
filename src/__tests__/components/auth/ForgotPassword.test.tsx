import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

const mockResetPassword = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { resetPasswordForEmail: mockResetPassword },
  }),
}))

// window.location.origin is used in the component
Object.defineProperty(window, 'location', {
  value: { origin: 'http://localhost' },
  writable: true,
})

import ForgotPasswordPage from '@/app/(auth)/forgot-password/page'

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockResetPassword.mockResolvedValue({ data: {}, error: null })
  })

  it('renders email input and submit button', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })

  it('shows error when email is empty and form submitted', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordPage />)
    await user.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(screen.getByText(/please enter your email/i)).toBeInTheDocument()
  })

  it('always shows sent state after valid submission (no enumeration)', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordPage />)
    await user.type(screen.getByLabelText(/email/i), 'any@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() => {
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument()
    })
    expect(mockResetPassword).toHaveBeenCalledWith(
      'any@example.com',
      expect.objectContaining({ redirectTo: expect.stringContaining('/reset-password') })
    )
  })

  it('shows sent state even when supabase returns an error (no enumeration)', async () => {
    mockResetPassword.mockResolvedValue({ data: {}, error: { message: 'not found' } })
    const user = userEvent.setup()
    render(<ForgotPasswordPage />)
    await user.type(screen.getByLabelText(/email/i), 'nonexistent@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() => {
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument()
    })
  })

  it('disables button while submitting', async () => {
    let resolve: (v: unknown) => void
    mockResetPassword.mockReturnValue(new Promise((r) => { resolve = r }))
    const user = userEvent.setup()
    render(<ForgotPasswordPage />)
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled()
    resolve!({ data: {}, error: null })
  })
})
