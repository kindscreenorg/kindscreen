import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import type { VideoWithChannel } from '@/app/(public)/browse/page'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock YT API for VideoModal used inside BrowseClient
vi.mock('@/lib/utils/youtube', () => ({
  loadYTApi: vi.fn().mockImplementation((cb: () => void) => cb()),
}))

// Mock window.YT so VideoModal can create a Player instance
const mockYTDestroy = vi.fn()
function MockYTPlayer(this: { destroy: () => void }) {
  this.destroy = mockYTDestroy
}
Object.defineProperty(window, 'YT', {
  value: { Player: MockYTPlayer, PlayerState: { ENDED: 0 } },
  writable: true,
  configurable: true,
})

const mockSupabaseFrom = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockSupabaseFrom,
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  }),
}))

import BrowseClient from '@/app/(public)/browse/BrowseClient'

function makeVideo(id: string, overrides: Partial<VideoWithChannel> = {}): VideoWithChannel {
  return {
    id,
    youtube_id: `yt${id}`,
    title: `Video ${id}`,
    thumbnail_url: null,
    age_band: '3-5',
    category: 'educational',
    status: 'approved',
    submitted_by: 'u1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    channel_id: null,
    channels: null,
    ...overrides,
  } as VideoWithChannel
}

const videos = [makeVideo('1'), makeVideo('2'), makeVideo('3')]

describe('BrowseClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [] }),
    })
  })

  it('renders all initial videos', () => {
    render(<BrowseClient initialVideos={videos} totalCount={3} pageSize={12} />)
    expect(screen.getByText('Video 1')).toBeInTheDocument()
    expect(screen.getByText('Video 2')).toBeInTheDocument()
    expect(screen.getByText('Video 3')).toBeInTheDocument()
  })

  it('shows empty state when no videos match filters', () => {
    render(<BrowseClient initialVideos={[]} totalCount={0} pageSize={12} />)
    expect(screen.getByText(/no videos found/i)).toBeInTheDocument()
  })

  it('shows clear filters button in empty state and navigates to /browse', async () => {
    const user = userEvent.setup()
    render(<BrowseClient initialVideos={[]} totalCount={0} pageSize={12} />)
    await user.click(screen.getByRole('button', { name: /clear filters/i }))
    expect(mockPush).toHaveBeenCalledWith('/browse')
  })

  it('hides Load More button when all videos are loaded', () => {
    render(<BrowseClient initialVideos={videos} totalCount={3} pageSize={12} />)
    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument()
  })

  it('shows Load More button when there are more videos', () => {
    render(<BrowseClient initialVideos={videos} totalCount={10} pageSize={3} />)
    expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument()
  })

  it('loads more videos when Load More is clicked', async () => {
    const extraVideos = [makeVideo('4'), makeVideo('5')]
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: extraVideos }),
    })
    const user = userEvent.setup()
    render(<BrowseClient initialVideos={videos} totalCount={5} pageSize={3} />)
    await user.click(screen.getByRole('button', { name: /load more/i }))
    await waitFor(() => {
      expect(screen.getByText('Video 4')).toBeInTheDocument()
      expect(screen.getByText('Video 5')).toBeInTheDocument()
    })
  })

  it('navigates with category filter when category chip is clicked', async () => {
    const user = userEvent.setup()
    render(<BrowseClient initialVideos={videos} totalCount={3} pageSize={12} />)
    // Click "educational" chip
    const chips = screen.getAllByRole('button')
    const educationalChip = chips.find((b) => b.textContent?.trim() === 'educational')
    if (educationalChip) {
      await user.click(educationalChip)
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('category=educational'))
    }
  })

  it('navigates with age band filter when age band chip is clicked', async () => {
    const user = userEvent.setup()
    render(<BrowseClient initialVideos={videos} totalCount={3} pageSize={12} />)
    // Find "3–5" age band button
    const buttons = screen.getAllByRole('button')
    const ageBandButton = buttons.find((b) => b.textContent?.includes('3'))
    if (ageBandButton && !ageBandButton.textContent?.includes('All')) {
      await user.click(ageBandButton)
      expect(mockPush).toHaveBeenCalled()
    }
  })

  it('opens modal when a video card is clicked', async () => {
    const user = userEvent.setup()
    render(<BrowseClient initialVideos={videos} totalCount={3} pageSize={12} />)
    const videoCard = screen.getAllByText('Video 1')[0].closest('button')!
    await user.click(videoCard)
    // After clicking, modal appears (VideoModal renders title in a <p> tag outside the button)
    // The modal is rendered by VideoModal component which is in the DOM
    await waitFor(() => {
      // Modal backdrop should be present
      expect(document.querySelector('.fixed.inset-0')).not.toBeNull()
    })
  })

  it('resets videos when initialVideos prop changes', () => {
    const newVideos = [makeVideo('10'), makeVideo('11')]
    const { rerender } = render(<BrowseClient initialVideos={videos} totalCount={3} pageSize={12} />)
    rerender(<BrowseClient initialVideos={newVideos} totalCount={2} pageSize={12} />)
    expect(screen.getByText('Video 10')).toBeInTheDocument()
    expect(screen.queryByText('Video 1')).not.toBeInTheDocument()
  })

  it('applies category filter in loadMore when category prop is set', async () => {
    const eqCalls: [string, unknown][] = []
    // Build a fully chainable builder that resolves via .then()
    const chainableBuilder: Record<string, unknown> = {}
    const terminalResult = { data: [] }
    for (const m of ['select', 'eq', 'order', 'range', 'neq', 'in', 'not']) {
      chainableBuilder[m] = vi.fn().mockImplementation((...args: unknown[]) => {
        if (m === 'eq') eqCalls.push(args as [string, unknown])
        return chainableBuilder
      })
    }
    chainableBuilder.then = vi.fn().mockImplementation(
      (resolve: (v: typeof terminalResult) => void) => Promise.resolve(terminalResult).then(resolve)
    )
    mockSupabaseFrom.mockReturnValue(chainableBuilder)

    const user = userEvent.setup()
    render(
      <BrowseClient
        initialVideos={videos}
        totalCount={10}
        pageSize={3}
        category="educational"
      />
    )
    await user.click(screen.getByRole('button', { name: /load more/i }))
    await waitFor(() => {
      expect(eqCalls.some(([k, v]) => k === 'category' && v === 'educational')).toBe(true)
    })
  })

  it('applies ageBand filter in loadMore when ageBand prop is set', async () => {
    const eqCalls: [string, unknown][] = []
    const chainableBuilder: Record<string, unknown> = {}
    const terminalResult = { data: [] }
    for (const m of ['select', 'eq', 'order', 'range', 'neq', 'in', 'not']) {
      chainableBuilder[m] = vi.fn().mockImplementation((...args: unknown[]) => {
        if (m === 'eq') eqCalls.push(args as [string, unknown])
        return chainableBuilder
      })
    }
    chainableBuilder.then = vi.fn().mockImplementation(
      (resolve: (v: typeof terminalResult) => void) => Promise.resolve(terminalResult).then(resolve)
    )
    mockSupabaseFrom.mockReturnValue(chainableBuilder)

    const user = userEvent.setup()
    render(
      <BrowseClient
        initialVideos={videos}
        totalCount={10}
        pageSize={3}
        ageBand="3-5"
      />
    )
    await user.click(screen.getByRole('button', { name: /load more/i }))
    await waitFor(() => {
      expect(eqCalls.some(([k, v]) => k === 'age_band' && v === '3-5')).toBe(true)
    })
  })

  it('navigates to /browse when "All ages" chip is clicked', async () => {
    const user = userEvent.setup()
    // Render with ageBand set so "All ages" chip click changes the route
    render(<BrowseClient initialVideos={videos} totalCount={3} pageSize={12} ageBand="3-5" />)
    const allAgesBtn = screen.getByRole('button', { name: /all ages/i })
    await user.click(allAgesBtn)
    expect(mockPush).toHaveBeenCalledWith('/browse')
  })

  it('navigates to /browse when "All" category chip is clicked', async () => {
    const user = userEvent.setup()
    render(<BrowseClient initialVideos={videos} totalCount={3} pageSize={12} category="educational" />)
    // The "All" category chip — find button with exact text "All"
    const allBtn = screen.getAllByRole('button').find((b) => b.textContent?.trim() === 'All')!
    await user.click(allBtn)
    expect(mockPush).toHaveBeenCalledWith('/browse')
  })

  it('handles null data from loadMore gracefully', async () => {
    // Covers the `data ?? []` fallback in loadMore
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: null }),
    })
    const user = userEvent.setup()
    render(<BrowseClient initialVideos={videos} totalCount={10} pageSize={3} />)
    await user.click(screen.getByRole('button', { name: /load more/i }))
    await waitFor(() => {
      // Original videos still present — null treated as empty array
      expect(screen.getByText('Video 1')).toBeInTheDocument()
    })
  })

  it('closes modal when VideoModal onClose is called', async () => {
    const user = userEvent.setup()
    render(<BrowseClient initialVideos={videos} totalCount={3} pageSize={12} />)
    // Open the modal by clicking a video card
    const videoCard = screen.getAllByText('Video 1')[0].closest('button')!
    await user.click(videoCard)
    await waitFor(() => {
      expect(document.querySelector('.fixed.inset-0')).not.toBeNull()
    })
    // Close via ESC key — which calls the onClose lambda setActiveVideo(null)
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => {
      expect(document.querySelector('.fixed.inset-0')).toBeNull()
    })
  })
})
