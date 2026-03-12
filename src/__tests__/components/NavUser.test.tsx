import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import NavUser from '@/components/NavUser'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signOut: vi.fn().mockResolvedValue({}) } }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

describe('NavUser', () => {
  it('renders the greeting and sign-out button', () => {
    render(
      <NavUser username="alice" greeting="Hi, alice!" signOutLabel="Sign out" />
    )
    expect(screen.getAllByText(/alice/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('renders the greeting text on desktop span', () => {
    render(
      <NavUser username="alice" greeting="Hi, alice!" signOutLabel="Sign out" />
    )
    expect(screen.getByText('Hi, alice!')).toBeInTheDocument()
  })
})
