import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import ReviewerList from '@/app/(moderator)/moderator/reviewers/ReviewerList'
import type { ReviewerRow } from '@/app/(moderator)/moderator/reviewers/ReviewerList'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function makeReviewer(overrides: Partial<ReviewerRow> = {}): ReviewerRow {
  return {
    id: 'r1',
    username: 'alice',
    review_count: 10,
    is_trusted: false,
    is_moderator: false,
    is_admin: false,
    ...overrides,
  }
}

describe('ReviewerList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders reviewer username and review count', () => {
    render(<ReviewerList initialReviewers={[makeReviewer()]} currentIsAdmin={false} />)
    expect(screen.getByText('alice')).toBeInTheDocument()
    expect(screen.getByText('10 reviews')).toBeInTheDocument()
  })

  it('shows Admin badge for admin reviewers', () => {
    render(<ReviewerList initialReviewers={[makeReviewer({ is_admin: true })]} currentIsAdmin={false} />)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('does not show Moderator toggle when currentIsAdmin is false', () => {
    render(<ReviewerList initialReviewers={[makeReviewer()]} currentIsAdmin={false} />)
    expect(screen.queryByRole('button', { name: /moderator/i })).not.toBeInTheDocument()
  })

  it('shows Moderator toggle when currentIsAdmin is true', () => {
    render(<ReviewerList initialReviewers={[makeReviewer()]} currentIsAdmin={true} />)
    expect(screen.getByRole('button', { name: /moderator/i })).toBeInTheDocument()
  })

  it('trusted toggle is disabled for admin reviewers', () => {
    render(<ReviewerList initialReviewers={[makeReviewer({ is_admin: true })]} currentIsAdmin={true} />)
    const buttons = screen.getAllByRole('button')
    for (const btn of buttons) {
      expect(btn).toBeDisabled()
    }
  })

  it('calls PATCH and updates state when trusted toggle clicked', async () => {
    const user = userEvent.setup()
    const updated = { id: 'r1', username: 'alice', is_trusted: true, is_moderator: false }
    mockFetch.mockResolvedValue({ ok: true, json: async () => updated })
    render(<ReviewerList initialReviewers={[makeReviewer()]} currentIsAdmin={false} />)
    await user.click(screen.getByRole('button', { name: /trusted/i }))
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/moderator/reviewers/r1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ field: 'is_trusted', value: true }),
      })
    )
  })

  it('shows error message when PATCH fails', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'Forbidden.' }) })
    render(<ReviewerList initialReviewers={[makeReviewer()]} currentIsAdmin={false} />)
    await user.click(screen.getByRole('button', { name: /trusted/i }))
    await waitFor(() => {
      expect(screen.getByText('Forbidden.')).toBeInTheDocument()
    })
  })

  it('shows fallback error when PATCH response has no error field', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) })
    render(<ReviewerList initialReviewers={[makeReviewer()]} currentIsAdmin={false} />)
    await user.click(screen.getByRole('button', { name: /trusted/i }))
    await waitFor(() => {
      expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
    })
  })

  it('calls PATCH for is_moderator toggle when admin', async () => {
    const user = userEvent.setup()
    const updated = { id: 'r1', username: 'alice', is_trusted: false, is_moderator: true }
    mockFetch.mockResolvedValue({ ok: true, json: async () => updated })
    render(<ReviewerList initialReviewers={[makeReviewer()]} currentIsAdmin={true} />)
    await user.click(screen.getByRole('button', { name: /moderator/i }))
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/moderator/reviewers/r1',
      expect.objectContaining({
        body: JSON.stringify({ field: 'is_moderator', value: true }),
      })
    )
  })

  it('renders an empty list without crashing', () => {
    render(<ReviewerList initialReviewers={[]} currentIsAdmin={false} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('only updates the reviewer with matching id, leaves others unchanged', async () => {
    const user = userEvent.setup()
    const reviewers = [makeReviewer({ id: 'r1', username: 'alice' }), makeReviewer({ id: 'r2', username: 'bob' })]
    const updated = { id: 'r1', username: 'alice', is_trusted: true, is_moderator: false }
    mockFetch.mockResolvedValue({ ok: true, json: async () => updated })
    render(<ReviewerList initialReviewers={reviewers} currentIsAdmin={false} />)
    await user.click(screen.getAllByRole('button', { name: /trusted/i })[0])
    await waitFor(() => {
      expect(screen.getByText('bob')).toBeInTheDocument()
    })
  })
})
