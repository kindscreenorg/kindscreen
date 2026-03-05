import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}))

const mockGetSession = vi.fn()
const mockUpdateUser = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      updateUser: mockUpdateUser,
    },
  }),
}))

import ResetPasswordPage from '@/app/(auth)/reset-password/page'

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    mockGetSession.mockReturnValue(new Promise(() => {}))
    render(<ResetPasswordPage />)
    expect(screen.getByText(/verifying link/i)).toBeInTheDocument()
  })

  it('redirects to /forgot-password when no session exists', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    render(<ResetPasswordPage />)
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/forgot-password')
    })
  })

  it('shows form when session exists', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    render(<ResetPasswordPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('New password')).toBeInTheDocument()
    })
  })

  it('shows error when new password is empty', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    const user = userEvent.setup()
    render(<ResetPasswordPage />)
    await waitFor(() => screen.getByRole('button', { name: /update password/i }))
    await user.click(screen.getByRole('button', { name: /update password/i }))
    expect(screen.getByText(/please enter a new password/i)).toBeInTheDocument()
  })

  it('shows error when password is too short', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    const user = userEvent.setup()
    render(<ResetPasswordPage />)
    await waitFor(() => screen.getByLabelText('New password'))
    await user.type(screen.getByLabelText('New password'), 'short')
    await user.click(screen.getByRole('button', { name: /update password/i }))
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
  })

  it('shows error when passwords do not match', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    const user = userEvent.setup()
    render(<ResetPasswordPage />)
    await waitFor(() => screen.getByLabelText('New password'))
    await user.type(screen.getByLabelText('New password'), 'Password123')
    await user.type(screen.getByLabelText('Confirm new password'), 'Different123')
    await user.click(screen.getByRole('button', { name: /update password/i }))
    expect(screen.getByText(/do not match/i)).toBeInTheDocument()
  })

  it('shows error when updateUser fails', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    mockUpdateUser.mockResolvedValue({ data: {}, error: { message: 'Token expired' } })
    const user = userEvent.setup()
    render(<ResetPasswordPage />)
    await waitFor(() => screen.getByLabelText('New password'))
    await user.type(screen.getByLabelText('New password'), 'Password123')
    await user.type(screen.getByLabelText('Confirm new password'), 'Password123')
    await user.click(screen.getByRole('button', { name: /update password/i }))
    await waitFor(() => {
      expect(screen.getByText(/could not update password/i)).toBeInTheDocument()
    })
  })

  it('redirects to / on successful password update', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    mockUpdateUser.mockResolvedValue({ data: {}, error: null })
    const user = userEvent.setup()
    render(<ResetPasswordPage />)
    await waitFor(() => screen.getByLabelText('New password'))
    await user.type(screen.getByLabelText('New password'), 'NewPassword123')
    await user.type(screen.getByLabelText('Confirm new password'), 'NewPassword123')
    await user.click(screen.getByRole('button', { name: /update password/i }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })
})
