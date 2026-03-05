import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const mockSignUp = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signUp: mockSignUp },
  }),
}))

import SignupPage from '@/app/(auth)/signup/page'

async function fillForm(overrides: Partial<{
  email: string
  username: string
  password: string
  confirm: string
}> = {}) {
  const {
    email = 'user@example.com',
    username = 'valid_user',
    password = 'Password123',
    confirm = 'Password123',
  } = overrides
  const user = userEvent.setup()
  render(<SignupPage />)
  if (email) await user.type(screen.getByLabelText(/^email/i), email)
  if (username) {
    await user.type(screen.getByLabelText(/^username/i), username)
    // Trigger blur to check username
    await user.tab()
  }
  if (password) await user.type(screen.getByLabelText(/^password$/i), password)
  if (confirm) await user.type(screen.getByLabelText(/confirm password/i), confirm)
  return user
}

describe('SignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: username available
    mockFetch.mockResolvedValue({ json: async () => ({ available: true }) })
  })

  it('renders all form fields', () => {
    render(<SignupPage />)
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup()
    render(<SignupPage />)
    await user.click(screen.getByRole('button', { name: /create account/i }))
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
  })

  it('shows username format error for invalid username', async () => {
    const user = userEvent.setup()
    render(<SignupPage />)
    await user.type(screen.getByLabelText(/^email/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^username/i), 'BAD!!')
    await user.type(screen.getByLabelText(/^password$/i), 'Password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    expect(screen.getByText(/3–30 characters/i)).toBeInTheDocument()
  })

  it('shows taken error when username is unavailable', async () => {
    mockFetch.mockResolvedValue({ json: async () => ({ available: false }) })
    const user = userEvent.setup()
    render(<SignupPage />)
    const usernameInput = screen.getByLabelText(/^username/i)
    await user.type(usernameInput, 'takenuser')
    await user.tab() // triggers blur → checkUsername
    await waitFor(() => {
      expect(screen.getByText(/already taken/i)).toBeInTheDocument()
    })
  })

  it('clears username error when username becomes available', async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({ available: true }) })
    const user = userEvent.setup()
    render(<SignupPage />)
    const usernameInput = screen.getByLabelText(/^username/i)
    await user.type(usernameInput, 'freeuser')
    await user.tab()
    await waitFor(() => {
      expect(screen.queryByText(/already taken/i)).not.toBeInTheDocument()
    })
  })

  it('shows password mismatch error', async () => {
    const user = userEvent.setup()
    render(<SignupPage />)
    await user.type(screen.getByLabelText(/^email/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^username/i), 'valid_user')
    await user.type(screen.getByLabelText(/^password$/i), 'Password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'Different123')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    expect(screen.getByText(/do not match/i)).toBeInTheDocument()
  })

  it('navigates to /signup/confirm on success', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    mockFetch.mockResolvedValue({ json: async () => ({ available: true }) })
    const user = userEvent.setup()
    render(<SignupPage />)
    await user.type(screen.getByLabelText(/^email/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^username/i), 'valid_user')
    await user.tab()
    await user.type(screen.getByLabelText(/^password$/i), 'Password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/signup/confirm')
    })
  })

  it('shows error when email is already registered', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'User already registered' } })
    mockFetch.mockResolvedValue({ json: async () => ({ available: true }) })
    const user = userEvent.setup()
    render(<SignupPage />)
    await user.type(screen.getByLabelText(/^email/i), 'existing@test.com')
    await user.type(screen.getByLabelText(/^username/i), 'valid_user')
    await user.tab()
    await user.type(screen.getByLabelText(/^password$/i), 'Password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    })
  })

  it('shows username taken error from supabase auth error', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'username already taken in db' } })
    mockFetch.mockResolvedValue({ json: async () => ({ available: true }) })
    const user = userEvent.setup()
    render(<SignupPage />)
    await user.type(screen.getByLabelText(/^email/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^username/i), 'valid_user')
    await user.tab()
    await user.type(screen.getByLabelText(/^password$/i), 'Password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText(/already taken/i)).toBeInTheDocument()
    })
  })

  it('shows generic error for unknown auth errors', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'Unknown error occurred' } })
    mockFetch.mockResolvedValue({ json: async () => ({ available: true }) })
    const user = userEvent.setup()
    render(<SignupPage />)
    await user.type(screen.getByLabelText(/^email/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^username/i), 'valid_user')
    await user.tab()
    await user.type(screen.getByLabelText(/^password$/i), 'Password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
  })

  it('blocks submit when username is known to be taken', async () => {
    mockFetch.mockResolvedValue({ json: async () => ({ available: false }) })
    const user = userEvent.setup()
    render(<SignupPage />)
    await user.type(screen.getByLabelText(/^email/i), 'test@test.com')
    const usernameInput = screen.getByLabelText(/^username/i)
    await user.type(usernameInput, 'takenuser')
    await user.tab()
    await waitFor(() => {
      expect(screen.getByText(/already taken/i)).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText(/^password$/i), 'Password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('handles network error during username check gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<SignupPage />)
    const usernameInput = screen.getByLabelText(/^username/i)
    await user.type(usernameInput, 'valid_user')
    await user.tab()
    // Should not show an error — network errors are silently ignored
    await waitFor(() => {
      expect(screen.queryByText(/already taken/i)).not.toBeInTheDocument()
    })
  })

  it('does not re-check username when same value blurred again', async () => {
    mockFetch.mockResolvedValue({ json: async () => ({ available: true }) })
    const user = userEvent.setup()
    render(<SignupPage />)
    const usernameInput = screen.getByLabelText(/^username/i)
    await user.type(usernameInput, 'sameuser')
    await user.tab()
    await user.click(usernameInput)
    await user.tab()
    // Fetch should only have been called once
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('handles response without available field gracefully', async () => {
    // json.available is undefined → ?? null → usernameAvailable stays null
    mockFetch.mockResolvedValue({ json: async () => ({}) })
    const user = userEvent.setup()
    render(<SignupPage />)
    const usernameInput = screen.getByLabelText(/^username/i)
    await user.type(usernameInput, 'someuser')
    await user.tab()
    await waitFor(() => {
      // No error should appear — null means "unknown" state
      expect(screen.queryByText(/already taken/i)).not.toBeInTheDocument()
    })
  })
})
