import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { createMockSupabaseClient } from '@/__mocks__/supabase'

const { mockRedirect } = vi.hoisted(() => ({ mockRedirect: vi.fn() }))

vi.mock('next/navigation', () => ({ redirect: mockRedirect }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Stub ReviewerList — we test it separately
vi.mock('@/app/(moderator)/moderator/reviewers/ReviewerList', () => ({
  default: ({ initialReviewers, currentIsAdmin }: { initialReviewers: { username: string }[]; currentIsAdmin: boolean }) =>
    React.createElement('div', { 'data-testid': 'reviewer-list', 'data-admin': String(currentIsAdmin) },
      initialReviewers.map((r) => r.username).join(',')
    ),
}))

import ManageReviewersPage from '@/app/(moderator)/moderator/reviewers/page'
import { createClient } from '@/lib/supabase/server'

const mockedCreateClient = vi.mocked(createClient)

function makeSupabase({
  user = { id: 'u1' },
  isMod = true,
  isAdmin = false,
  reviewers = [] as { id: string; username: string; review_count: number; is_trusted: boolean; is_moderator: boolean; is_admin: boolean }[],
} = {}) {
  const mock = createMockSupabaseClient()
  mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user }, error: null })
  mock.rpc = vi.fn()
    .mockResolvedValueOnce({ data: isMod, error: null })   // is_moderator
    .mockResolvedValueOnce({ data: isAdmin, error: null })  // is_admin
  mock.from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: reviewers, error: null }),
  })
  return mock
}

describe('ManageReviewersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedirect.mockImplementation((url: string) => { throw new Error(`REDIRECT:${url}`) })
  })

  it('redirects to /login when not authenticated', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    await expect(ManageReviewersPage()).rejects.toThrow('REDIRECT:/login?next=/moderator/reviewers')
  })

  it('redirects to /reviewer when not a moderator', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.rpc = vi.fn().mockResolvedValue({ data: false, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    await expect(ManageReviewersPage()).rejects.toThrow('REDIRECT:/reviewer')
  })

  it('renders reviewer count (plural)', async () => {
    const reviewers = [
      { id: 'r1', username: 'alice', review_count: 5, is_trusted: false, is_moderator: false, is_admin: false },
      { id: 'r2', username: 'bob', review_count: 3, is_trusted: false, is_moderator: false, is_admin: false },
    ]
    mockedCreateClient.mockResolvedValue(makeSupabase({ reviewers }) as never)
    const jsx = await ManageReviewersPage()
    render(jsx as React.ReactElement)
    expect(screen.getByText(/2 reviewers/i)).toBeInTheDocument()
  })

  it('renders singular reviewer count', async () => {
    const reviewers = [
      { id: 'r1', username: 'alice', review_count: 5, is_trusted: false, is_moderator: false, is_admin: false },
    ]
    mockedCreateClient.mockResolvedValue(makeSupabase({ reviewers }) as never)
    const jsx = await ManageReviewersPage()
    render(jsx as React.ReactElement)
    expect(screen.getByText(/1 reviewer[^s]/)).toBeInTheDocument()
  })

  it('shows admin-only copy when current user is admin', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabase({ isAdmin: true }) as never)
    const jsx = await ManageReviewersPage()
    render(jsx as React.ReactElement)
    expect(screen.getByText(/promote\/demote moderators/i)).toBeInTheDocument()
  })

  it('shows non-admin copy when current user is not admin', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabase({ isAdmin: false }) as never)
    const jsx = await ManageReviewersPage()
    render(jsx as React.ReactElement)
    expect(screen.getByText(/grant or revoke trusted status/i)).toBeInTheDocument()
  })

  it('handles null reviewers data gracefully', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.rpc = vi.fn()
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: false, error: null })
    mock.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const jsx = await ManageReviewersPage()
    render(jsx as React.ReactElement)
    expect(screen.getByText(/0 reviewers/i)).toBeInTheDocument()
  })

  it('passes reviewers and currentIsAdmin to ReviewerList', async () => {
    const reviewers = [
      { id: 'r1', username: 'charlie', review_count: 2, is_trusted: true, is_moderator: false, is_admin: false },
    ]
    mockedCreateClient.mockResolvedValue(makeSupabase({ reviewers, isAdmin: true }) as never)
    const jsx = await ManageReviewersPage()
    render(jsx as React.ReactElement)
    const list = screen.getByTestId('reviewer-list')
    expect(list).toHaveTextContent('charlie')
    expect(list).toHaveAttribute('data-admin', 'true')
  })
})
