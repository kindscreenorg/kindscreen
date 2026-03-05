import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

const mockPush = vi.fn()
const mockRefresh = vi.fn()
const mockGet = vi.fn().mockReturnValue(null)

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => ({ get: mockGet }),
}))

const mockSignIn = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithPassword: mockSignIn },
  }),
}))

import LoginForm from '@/app/(auth)/login/LoginForm'

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockReturnValue(null)
  })

  it('renders the form fields', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('shows validation error when submitting empty form', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.click(screen.getByRole('button', { name: /log in/i }))
    expect(screen.getByText(/please enter your email and password/i)).toBeInTheDocument()
  })

  it('shows callback error when ?error= param is present', () => {
    mockGet.mockReturnValue('auth_callback_failed')
    render(<LoginForm />)
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('shows auth error on failed sign-in', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ data: {}, error: { message: 'Invalid credentials' } })
    render(<LoginForm />)
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /log in/i }))
    await waitFor(() => {
      expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument()
    })
  })

  it('redirects to /reviewer after successful login with no next param', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ data: {}, error: null })
    mockGet.mockReturnValue(null)
    render(<LoginForm />)
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /log in/i }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/reviewer')
    })
  })

  it('redirects to safe ?next= param after successful login', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ data: {}, error: null })
    mockGet.mockImplementation((key: string) => key === 'next' ? '/reviewer' : null)
    render(<LoginForm />)
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /log in/i }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/reviewer')
    })
  })

  it('redirects to /reviewer when ?next= is an absolute URL (open redirect guard)', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ data: {}, error: null })
    mockGet.mockImplementation((key: string) => key === 'next' ? 'http://evil.com' : null)
    render(<LoginForm />)
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /log in/i }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/reviewer')
    })
  })

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup()
    let resolve: (v: unknown) => void
    mockSignIn.mockReturnValue(new Promise((r) => { resolve = r }))
    render(<LoginForm />)
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /log in/i }))
    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled()
    resolve!({ data: {}, error: null })
  })
})
