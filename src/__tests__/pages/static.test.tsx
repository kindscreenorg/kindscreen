import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { strings } from '@/lib/i18n/strings'

vi.mock('@/lib/i18n/server', () => ({ getT: vi.fn().mockResolvedValue(strings.en) }))

const { mockCreateClient } = vi.hoisted(() => ({ mockCreateClient: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mockCreateClient }))

function mockAuth(user: object | null) {
  mockCreateClient.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    }),
  })
}

import NotFound from '@/app/not-found'
import HomePage from '@/app/page'
import SignupConfirmPage from '@/app/(auth)/signup/confirm/page'

describe('NotFound page', () => {
  it('renders the 404 page with link back to home', async () => {
    const jsx = await NotFound()
    render(jsx as React.ReactElement)
    expect(screen.getByText(/page not found/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to kindscreen/i })).toBeInTheDocument()
  })
})

describe('HomePage', () => {
  it('shows auth links when logged out', async () => {
    mockAuth(null)
    render(await HomePage() as React.ReactElement)
    expect(screen.getByRole('link', { name: /browse videos/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /become a reviewer/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument()
  })

  it('shows Dashboard and hides auth links when logged in', async () => {
    mockAuth({ id: 'u1', email: 'user@example.com' })
    render(await HomePage() as React.ReactElement)
    expect(screen.getByRole('link', { name: /go to dashboard/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /become a reviewer/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /log in/i })).not.toBeInTheDocument()
  })
})

describe('SignupConfirmPage', () => {
  it('renders the email confirmation page', async () => {
    const jsx = await SignupConfirmPage()
    render(jsx as React.ReactElement)
    expect(screen.getByText(/check your inbox/i)).toBeInTheDocument()
    expect(screen.getByText(/confirmation link/i)).toBeInTheDocument()
  })
})
