import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// vi.hoisted ensures these are available when vi.mock factories run (hoisted to top)
const { mockRedirect, mockCreateClient } = vi.hoisted(() => ({
  mockRedirect: vi.fn(),
  mockCreateClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

import ReviewerDashboard from '@/app/(reviewer)/reviewer/page'

function makeSupabaseMock({
  user = { id: 'user-1' } as { id: string } | null,
  reviewer = {
    username: 'testuser',
    review_count: 5,
    reputation_score: 10,
    is_trusted: false,
    is_moderator: false,
  } as {
    username: string
    review_count: number
    reputation_score: number
    is_trusted: boolean
    is_moderator: boolean
  } | null,
  reviews = [] as Array<{ video_id: string; verdict: string }>,
  impactCount = 0,
  queueCount = 3,
} = {}) {
  let fromCallCount = 0

  const createBuilder = (data: unknown, count?: number) => {
    const builder: Record<string, unknown> = {
      data,
      count: count ?? null,
      error: null,
    }
    for (const m of ['select', 'eq', 'neq', 'in', 'not', 'order', 'limit', 'range']) {
      builder[m] = vi.fn().mockReturnValue(builder)
    }
    builder.single = vi.fn().mockResolvedValue({ data, error: null })
    builder.maybeSingle = vi.fn().mockResolvedValue({ data, error: null })
    // Make the builder itself thenable (for await query)
    builder.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
      resolve({ data, count: count ?? null, error: null })
      return Promise.resolve({ data, count: count ?? null, error: null })
    })
    return builder
  }

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      fromCallCount++
      if (table === 'reviewers') return createBuilder(reviewer)
      if (table === 'reviews') return createBuilder(reviews)
      if (table === 'videos') {
        // videos is called twice: impact count and queue count
        if (fromCallCount <= 3) return createBuilder(null, impactCount)
        return createBuilder(null, queueCount)
      }
      return createBuilder(null)
    }),
  }
}

describe('ReviewerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to login when user is not authenticated', async () => {
    mockRedirect.mockImplementation((url: string) => {
      throw Object.assign(new Error('redirect'), { url })
    })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: null }))
    await expect(ReviewerDashboard()).rejects.toThrow('redirect')
    expect(mockRedirect).toHaveBeenCalledWith('/login?next=/reviewer')
  })

  it('renders reviewer username', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock())
    const jsx = await ReviewerDashboard()
    const { getByText } = render(jsx)
    expect(getByText(/testuser/i)).toBeInTheDocument()
  })

  it('renders review count stat', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock())
    const jsx = await ReviewerDashboard()
    const { getByText } = render(jsx)
    expect(getByText('5')).toBeInTheDocument()
  })

  it('shows Trusted Reviewer badge when is_trusted is true', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      reviewer: {
        username: 'trusteduser',
        review_count: 50,
        reputation_score: 100,
        is_trusted: true,
        is_moderator: false,
      },
    }))
    const jsx = await ReviewerDashboard()
    const { getAllByText } = render(jsx)
    // Multiple elements may say "Trusted Reviewer" (badge chip + badge list item)
    expect(getAllByText(/trusted reviewer/i).length).toBeGreaterThan(0)
  })

  it('shows Moderator Dashboard link when is_moderator is true', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      reviewer: {
        username: 'moduser',
        review_count: 20,
        reputation_score: 50,
        is_trusted: false,
        is_moderator: true,
      },
    }))
    const jsx = await ReviewerDashboard()
    const { getByText } = render(jsx)
    expect(getByText(/moderator dashboard/i)).toBeInTheDocument()
  })

  it('hides Moderator Dashboard link when is_moderator is false', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock())
    const jsx = await ReviewerDashboard()
    const { queryByText } = render(jsx)
    expect(queryByText(/moderator dashboard/i)).not.toBeInTheDocument()
  })

  it('shows approval rate when reviews exist', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      reviews: [
        { video_id: 'v1', verdict: 'approve' },
        { video_id: 'v2', verdict: 'reject' },
      ],
    }))
    const jsx = await ReviewerDashboard()
    const { getByText } = render(jsx)
    expect(getByText('50%')).toBeInTheDocument()
  })

  it('shows "—" for approval rate when no reviews', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ reviews: [] }))
    const jsx = await ReviewerDashboard()
    const { getByText } = render(jsx)
    expect(getByText('—')).toBeInTheDocument()
  })

  it('renders all 5 badges', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock())
    const jsx = await ReviewerDashboard()
    const { getByText } = render(jsx)
    expect(getByText('First Steps')).toBeInTheDocument()
    expect(getByText('10 Reviews')).toBeInTheDocument()
    expect(getByText('50 Reviews')).toBeInTheDocument()
    expect(getByText('Century')).toBeInTheDocument()
    expect(getByText('Trusted Reviewer')).toBeInTheDocument()
  })

  it('shows impact banner when impactCount > 0', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      reviews: [{ video_id: 'v1', verdict: 'approve' }],
      impactCount: 2,
    }))
    const jsx = await ReviewerDashboard()
    const { getByText } = render(jsx)
    expect(getByText(/your reviews have helped/i)).toBeInTheDocument()
  })

  it('falls back to "Reviewer" when reviewer row is null', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ reviewer: null }))
    const jsx = await ReviewerDashboard()
    const { getByRole } = render(jsx)
    expect(getByRole('heading', { name: /reviewer/i })).toBeInTheDocument()
  })

  it('shows singular "approved video" when impactCount is 1', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      reviews: [{ video_id: 'v1', verdict: 'approve' }],
      impactCount: 1,
    }))
    const jsx = await ReviewerDashboard()
    const { getByText } = render(jsx)
    expect(getByText(/approved video\./i)).toBeInTheDocument()
  })

  it('shows singular "video waiting" when queueCount is 1', async () => {
    // Must provide non-empty reviews so impact query fires (call 3) and queue is call 4
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      reviews: [{ video_id: 'v1', verdict: 'approve' }],
      queueCount: 1,
    }))
    const jsx = await ReviewerDashboard()
    const { getByText } = render(jsx)
    expect(getByText(/1 video waiting for review/i)).toBeInTheDocument()
  })

  it('handles null myReviews data gracefully', async () => {
    // Force reviews query to return null data — covers the ?? [] fallback on reviewedVideoIds
    const supabaseMock = makeSupabaseMock({ reviews: null as unknown as [] })
    mockCreateClient.mockResolvedValue(supabaseMock)
    const jsx = await ReviewerDashboard()
    const { queryByText } = render(jsx)
    // No impact banner — impactCount stays 0 when reviewedVideoIds is []
    expect(queryByText(/your reviews have helped/i)).not.toBeInTheDocument()
  })

  it('handles null count from videos impact query (covers count ?? 0)', async () => {
    // reviews non-empty so the impact query runs, but returns count: null
    const supabaseMock = makeSupabaseMock({
      reviews: [{ video_id: 'v1', verdict: 'approve' }],
      impactCount: null as unknown as number,
    })
    mockCreateClient.mockResolvedValue(supabaseMock)
    const jsx = await ReviewerDashboard()
    const { queryByText } = render(jsx)
    // impactCount falls back to 0, so no banner shown
    expect(queryByText(/your reviews have helped/i)).not.toBeInTheDocument()
  })
})
