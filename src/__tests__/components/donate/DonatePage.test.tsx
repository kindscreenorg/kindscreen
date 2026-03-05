import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

const { mockCreateAdminClient } = vi.hoisted(() => ({ mockCreateAdminClient: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mockCreateAdminClient,
}))

import DonatePage from '@/app/(public)/donate/page'

function makeAdminClient(approvedVideos = 10, reviewerCount = 5, reviewCount = 50) {
  const makeCountBuilder = (count: number) => {
    const b: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'from']) {
      b[m] = vi.fn().mockReturnValue(b)
    }
    b.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
      resolve({ count, error: null })
      return Promise.resolve({ count, error: null })
    })
    return b
  }

  let callCount = 0
  const counts = [approvedVideos, reviewerCount, reviewCount]
  return {
    from: vi.fn().mockImplementation(() => {
      const b: Record<string, unknown> = {}
      const c = counts[callCount++ % counts.length]
      for (const m of ['select', 'eq']) {
        b[m] = vi.fn().mockReturnValue(makeCountBuilder(c))
      }
      return makeCountBuilder(c)
    }),
  }
}

describe('DonatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear any previously set env var
    delete process.env.MONTHLY_DONATION_EUR
  })

  it('renders live stats', async () => {
    mockCreateAdminClient.mockReturnValue(makeAdminClient(10, 5, 50))
    const jsx = await DonatePage()
    render(jsx)
    expect(screen.getByText(/videos in catalog/i)).toBeInTheDocument()
    expect(screen.getByText(/parent reviewers/i)).toBeInTheDocument()
    expect(screen.getByText(/reviews submitted/i)).toBeInTheDocument()
  })

  it('renders milestones section', async () => {
    mockCreateAdminClient.mockReturnValue(makeAdminClient())
    const jsx = await DonatePage()
    render(jsx)
    expect(screen.getByText(/milestone roadmap/i)).toBeInTheDocument()
  })

  it('shows ✓ Reached badge for reached milestone when donation meets amount', async () => {
    process.env.MONTHLY_DONATION_EUR = '200'
    mockCreateAdminClient.mockReturnValue(makeAdminClient())
    const jsx = await DonatePage()
    render(jsx)
    // The €200 milestone should be reached
    expect(screen.getAllByText(/✓ Reached/).length).toBeGreaterThan(0)
  })

  it('shows monthly donation amount', async () => {
    process.env.MONTHLY_DONATION_EUR = '75'
    mockCreateAdminClient.mockReturnValue(makeAdminClient())
    const jsx = await DonatePage()
    render(jsx)
    expect(screen.getByText('€75')).toBeInTheDocument()
  })

  it('shows €0 when no donation env var is set', async () => {
    mockCreateAdminClient.mockReturnValue(makeAdminClient())
    const jsx = await DonatePage()
    render(jsx)
    expect(screen.getByText('€0')).toBeInTheDocument()
  })

  it('shows 0 for all stats when counts are null (covers ?? 0 fallbacks)', async () => {
    // Return null counts to trigger the ?? 0 fallback branches
    mockCreateAdminClient.mockReturnValue(makeAdminClient(null as unknown as number, null as unknown as number, null as unknown as number))
    const jsx = await DonatePage()
    render(jsx)
    // All three stat cards should show 0
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(3)
  })
})
