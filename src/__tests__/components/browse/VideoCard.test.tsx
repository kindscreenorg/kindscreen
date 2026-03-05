import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import VideoCard from '@/app/(public)/browse/VideoCard'
import type { VideoWithChannel } from '@/app/(public)/browse/page'

function makeVideo(overrides: Partial<VideoWithChannel> = {}): VideoWithChannel {
  return {
    id: 'v1',
    youtube_id: 'dQw4w9WgXcQ',
    title: 'Fun Kids Video',
    thumbnail_url: 'https://example.com/thumb.jpg',
    age_band: '3-5',
    category: 'educational',
    status: 'approved',
    submitted_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    channel_id: null,
    channels: { name: 'Fun Channel', youtube_channel_id: 'UC123' },
    ...overrides,
  } as VideoWithChannel
}

describe('VideoCard', () => {
  it('renders video title', () => {
    render(<VideoCard video={makeVideo()} onClick={vi.fn()} />)
    expect(screen.getByText('Fun Kids Video')).toBeInTheDocument()
  })

  it('renders thumbnail image when thumbnail_url is present', () => {
    render(<VideoCard video={makeVideo()} onClick={vi.fn()} />)
    const img = screen.getByAltText('Fun Kids Video')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg')
  })

  it('renders youtube fallback thumbnail when thumbnail_url is null', () => {
    render(<VideoCard video={makeVideo({ thumbnail_url: null, youtube_id: 'dQw4w9WgXcQ' })} onClick={vi.fn()} />)
    const img = screen.getByAltText('Fun Kids Video')
    expect(img).toHaveAttribute('src', expect.stringContaining('dQw4w9WgXcQ'))
  })

  it('renders age band badge', () => {
    render(<VideoCard video={makeVideo()} onClick={vi.fn()} />)
    expect(screen.getByText('3-5')).toBeInTheDocument()
  })

  it('does not render age band badge when age_band is null', () => {
    render(<VideoCard video={makeVideo({ age_band: null })} onClick={vi.fn()} />)
    expect(screen.queryByText('3-5')).not.toBeInTheDocument()
  })

  it('renders category badge', () => {
    render(<VideoCard video={makeVideo()} onClick={vi.fn()} />)
    expect(screen.getByText('educational')).toBeInTheDocument()
  })

  it('renders channel name', () => {
    render(<VideoCard video={makeVideo()} onClick={vi.fn()} />)
    expect(screen.getByText('Fun Channel')).toBeInTheDocument()
  })

  it('does not render channel name when channels is null', () => {
    render(<VideoCard video={makeVideo({ channels: null })} onClick={vi.fn()} />)
    expect(screen.queryByText('Fun Channel')).not.toBeInTheDocument()
  })

  it('calls onClick when card is clicked', async () => {
    const user = userEvent.setup()
    const mockOnClick = vi.fn()
    render(<VideoCard video={makeVideo()} onClick={mockOnClick} />)
    await user.click(screen.getByRole('button'))
    expect(mockOnClick).toHaveBeenCalledOnce()
  })
})
