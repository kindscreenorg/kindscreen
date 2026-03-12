import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import SignOutButton from '@/components/SignOutButton'

const mockSignOut = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signOut: mockSignOut } }),
}))

const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

describe('SignOutButton', () => {
  beforeEach(() => {
    mockSignOut.mockReset()
    mockPush.mockReset()
    mockRefresh.mockReset()
    mockSignOut.mockResolvedValue({})
  })

  it('renders with the provided label', () => {
    render(<SignOutButton label="Sign out" />)
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('calls signOut, refresh, and push("/") when clicked', async () => {
    const user = userEvent.setup()
    render(<SignOutButton label="Sign out" />)
    await user.click(screen.getByRole('button'))
    expect(mockSignOut).toHaveBeenCalledOnce()
    expect(mockRefresh).toHaveBeenCalledOnce()
    expect(mockPush).toHaveBeenCalledWith('/')
  })
})
