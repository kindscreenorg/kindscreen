import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

const { mockRedirect, mockCreateClient } = vi.hoisted(() => ({
  mockRedirect: vi.fn(),
  mockCreateClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({ redirect: mockRedirect }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mockCreateClient }))

// Simplify FlaggedVideos for dashboard tests
vi.mock('@/app/(moderator)/moderator/FlaggedVideos', () => ({
  default: ({ initialVideos }: { initialVideos: { id: string; title: string; flags: unknown[] }[] }) =>
    React.createElement(
      'div',
      { 'data-testid': 'flagged-videos' },
      initialVideos.map((v) =>
        React.createElement('div', { key: v.id, 'data-testid': `video-${v.id}` }, v.title)
      )
    ),
}))

import ModeratorDashboard from '@/app/(moderator)/moderator/page'

type FlagRow = {
  id: string
  reason: string
  created_at: string
  video_id: string
  videos: {
    id: string
    title: string
    youtube_id: string
    thumbnail_url: string | null
    status: string
  } | null
}

function makeSupabaseMock({
  user = { id: 'mod-1' } as { id: string } | null,
  isMod = true,
  flags = [] as FlagRow[],
} = {}) {
  const createBuilder = (data: unknown) => {
    const builder: Record<string, unknown> = { data, error: null }
    for (const m of ['select', 'eq', 'order']) {
      builder[m] = vi.fn().mockReturnValue(builder)
    }
    builder.single = vi.fn().mockResolvedValue({ data, error: null })
    builder.maybeSingle = vi.fn().mockResolvedValue({ data, error: null })
    builder.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
      resolve({ data, error: null })
      return Promise.resolve({ data, error: null })
    })
    return builder
  }

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    rpc: vi.fn().mockResolvedValue({ data: isMod, error: null }),
    from: vi.fn().mockReturnValue(createBuilder(flags)),
  }
}

describe('ModeratorDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to login when user is not authenticated', async () => {
    mockRedirect.mockImplementation((url: string) => {
      throw Object.assign(new Error('redirect'), { url })
    })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: null }))
    await expect(ModeratorDashboard()).rejects.toThrow('redirect')
    expect(mockRedirect).toHaveBeenCalledWith('/login?next=/moderator')
  })

  it('redirects to /reviewer when user is not a moderator', async () => {
    mockRedirect.mockImplementation((url: string) => {
      throw Object.assign(new Error('redirect'), { url })
    })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ isMod: false }))
    await expect(ModeratorDashboard()).rejects.toThrow('redirect')
    expect(mockRedirect).toHaveBeenCalledWith('/reviewer')
  })

  it('renders "No flagged videos" when flags list is empty', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ flags: [] }))
    const jsx = await ModeratorDashboard()
    const { getByText } = render(jsx)
    expect(getByText(/no flagged videos/i)).toBeInTheDocument()
  })

  it('renders flagged video count when flags exist', async () => {
    const flags: FlagRow[] = [
      {
        id: 'flag-1',
        reason: 'Inappropriate',
        created_at: '2024-01-01T00:00:00Z',
        video_id: 'v1',
        videos: {
          id: 'v1',
          title: 'Bad Video',
          youtube_id: 'abc123',
          thumbnail_url: null,
          status: 'suspended',
        },
      },
    ]
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ flags }))
    const jsx = await ModeratorDashboard()
    const { getByText } = render(jsx)
    // Should show "1 video with open flags"
    expect(getByText(/1 video with open flags/i)).toBeInTheDocument()
  })

  it('renders plural "videos" when multiple flagged videos exist', async () => {
    const makeFlag = (id: string, videoId: string, title: string): FlagRow => ({
      id,
      reason: 'Test reason',
      created_at: '2024-01-01T00:00:00Z',
      video_id: videoId,
      videos: {
        id: videoId,
        title,
        youtube_id: `yt${videoId}`,
        thumbnail_url: null,
        status: 'suspended',
      },
    })
    const flags = [
      makeFlag('flag-1', 'v1', 'Video One'),
      makeFlag('flag-2', 'v2', 'Video Two'),
    ]
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ flags }))
    const jsx = await ModeratorDashboard()
    const { getByText } = render(jsx)
    expect(getByText(/2 videos with open flags/i)).toBeInTheDocument()
  })

  it('groups multiple flags for the same video', async () => {
    // Two flags for the same video — should group into one FlaggedVideo entry
    const flags: FlagRow[] = [
      {
        id: 'flag-1',
        reason: 'Reason 1',
        created_at: '2024-01-01T00:00:00Z',
        video_id: 'v1',
        videos: { id: 'v1', title: 'One Video', youtube_id: 'abc', thumbnail_url: null, status: 'suspended' },
      },
      {
        id: 'flag-2',
        reason: 'Reason 2',
        created_at: '2024-01-02T00:00:00Z',
        video_id: 'v1',
        videos: { id: 'v1', title: 'One Video', youtube_id: 'abc', thumbnail_url: null, status: 'suspended' },
      },
    ]
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ flags }))
    const jsx = await ModeratorDashboard()
    const { getByText } = render(jsx)
    // Grouped into 1 video with 2 flags → "1 video with open flags"
    expect(getByText(/1 video with open flags/i)).toBeInTheDocument()
  })

  it('handles null flagsRaw data gracefully', async () => {
    // Force the flags query to return data: null — covers the `flagsRaw ?? []` branch
    const nullFlagsClient = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'mod-1' } }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
          resolve({ data: null, error: null })
          return Promise.resolve({ data: null, error: null })
        }),
      }),
    }
    mockCreateClient.mockResolvedValue(nullFlagsClient)
    const jsx = await ModeratorDashboard()
    const { getByText } = render(jsx)
    expect(getByText(/no flagged videos/i)).toBeInTheDocument()
  })

  it('skips flags where videos field is null', async () => {
    const flags: FlagRow[] = [
      {
        id: 'flag-orphan',
        reason: 'Orphan flag',
        created_at: '2024-01-01T00:00:00Z',
        video_id: 'deleted-video',
        videos: null,
      },
    ]
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ flags }))
    const jsx = await ModeratorDashboard()
    const { getByText } = render(jsx)
    // No valid videos → shows "No flagged videos"
    expect(getByText(/no flagged videos/i)).toBeInTheDocument()
  })
})
