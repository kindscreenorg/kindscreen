import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import FlaggedVideos from '@/app/(moderator)/moderator/FlaggedVideos'
import type { FlaggedVideo } from '@/app/(moderator)/moderator/FlaggedVideos'

function makeVideo(id: string, overrides: Partial<FlaggedVideo> = {}): FlaggedVideo {
  return {
    id,
    title: `Video ${id}`,
    youtube_id: `yt${id}`,
    thumbnail_url: null,
    status: 'approved',
    flags: [{ id: `flag-${id}`, reason: 'Inappropriate content', created_at: '2024-01-01T00:00:00Z' }],
    ...overrides,
  }
}

describe('FlaggedVideos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state when no videos are flagged', () => {
    render(<FlaggedVideos initialVideos={[]} />)
    expect(screen.getByText(/all clear/i)).toBeInTheDocument()
  })

  it('renders flagged video list', () => {
    const videos = [makeVideo('1'), makeVideo('2')]
    render(<FlaggedVideos initialVideos={videos} />)
    expect(screen.getByText('Video 1')).toBeInTheDocument()
    expect(screen.getByText('Video 2')).toBeInTheDocument()
  })

  it('renders flag reasons', () => {
    const video = makeVideo('1', {
      flags: [
        { id: 'f1', reason: 'Contains violence', created_at: '2024-01-01T00:00:00Z' },
      ],
    })
    render(<FlaggedVideos initialVideos={[video]} />)
    expect(screen.getByText(/contains violence/i)).toBeInTheDocument()
  })

  it('shows fallback emoji when thumbnail_url is null', () => {
    render(<FlaggedVideos initialVideos={[makeVideo('1')]} />)
    expect(screen.getByText('📺')).toBeInTheDocument()
  })

  it('shows thumbnail image when thumbnail_url is set', () => {
    const video = makeVideo('1', { thumbnail_url: 'https://example.com/thumb.jpg' })
    render(<FlaggedVideos initialVideos={[video]} />)
    expect(screen.getByAltText('Video 1')).toBeInTheDocument()
  })

  it('removes video from list after successful reject action', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ id: '1', status: 'rejected' }) })
    const user = userEvent.setup()
    render(<FlaggedVideos initialVideos={[makeVideo('1'), makeVideo('2')]} />)
    const rejectButtons = screen.getAllByRole('button', { name: /remove from catalog/i })
    await user.click(rejectButtons[0])
    await waitFor(() => {
      expect(screen.queryByText('Video 1')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Video 2')).toBeInTheDocument()
  })

  it('removes video from list after successful restore action', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ id: '1', status: 'approved' }) })
    const user = userEvent.setup()
    render(<FlaggedVideos initialVideos={[makeVideo('1')]} />)
    await user.click(screen.getByRole('button', { name: /clear flags & restore/i }))
    await waitFor(() => {
      expect(screen.queryByText('Video 1')).not.toBeInTheDocument()
    })
  })

  it('shows empty state after last video is removed', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ id: '1', status: 'rejected' }) })
    const user = userEvent.setup()
    render(<FlaggedVideos initialVideos={[makeVideo('1')]} />)
    await user.click(screen.getByRole('button', { name: /remove from catalog/i }))
    await waitFor(() => {
      expect(screen.getByText(/all clear/i)).toBeInTheDocument()
    })
  })

  it('shows per-video error when action fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'Permission denied' }) })
    const user = userEvent.setup()
    render(<FlaggedVideos initialVideos={[makeVideo('1')]} />)
    await user.click(screen.getByRole('button', { name: /remove from catalog/i }))
    await waitFor(() => {
      expect(screen.getByText('Permission denied')).toBeInTheDocument()
    })
    // Video should still be in list
    expect(screen.getByText('Video 1')).toBeInTheDocument()
  })

  it('shows per-video error when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<FlaggedVideos initialVideos={[makeVideo('1')]} />)
    await user.click(screen.getByRole('button', { name: /remove from catalog/i }))
    await waitFor(() => {
      expect(screen.getByText(/could not reach the server/i)).toBeInTheDocument()
    })
  })

  it('disables action buttons while request is pending', async () => {
    let resolve: (v: unknown) => void
    mockFetch.mockReturnValue(new Promise((r) => { resolve = r }))
    const user = userEvent.setup()
    render(<FlaggedVideos initialVideos={[makeVideo('1')]} />)
    const rejectBtn = screen.getByRole('button', { name: /remove from catalog/i })
    await user.click(rejectBtn)
    expect(rejectBtn).toBeDisabled()
    resolve!({ ok: true, json: async () => ({ id: '1', status: 'rejected' }) })
  })

  it('shows flag count pluralization', () => {
    const videoWithMultipleFlags = makeVideo('1', {
      flags: [
        { id: 'f1', reason: 'Reason 1', created_at: '2024-01-01T00:00:00Z' },
        { id: 'f2', reason: 'Reason 2', created_at: '2024-01-01T00:00:00Z' },
      ],
    })
    render(<FlaggedVideos initialVideos={[videoWithMultipleFlags]} />)
    expect(screen.getByText(/2 open flags/i)).toBeInTheDocument()
  })

  it('shows singular "flag" for 1 flag', () => {
    render(<FlaggedVideos initialVideos={[makeVideo('1')]} />)
    expect(screen.getByText(/1 open flag/i)).toBeInTheDocument()
  })

  it('shows fallback error when response body has no error field', async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) })
    const user = userEvent.setup()
    render(<FlaggedVideos initialVideos={[makeVideo('1')]} />)
    await user.click(screen.getByRole('button', { name: /remove from catalog/i }))
    await waitFor(() => {
      expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
    })
  })
})
