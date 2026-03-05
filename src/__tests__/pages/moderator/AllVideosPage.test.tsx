import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { createMockSupabaseClient } from '@/__mocks__/supabase'

const { mockRedirect } = vi.hoisted(() => ({ mockRedirect: vi.fn() }))

vi.mock('next/navigation', () => ({ redirect: mockRedirect }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Stub VideoList — tested separately
vi.mock('@/app/(moderator)/moderator/videos/VideoList', () => ({
  default: ({ initialVideos }: { initialVideos: { id: string; title: string }[] }) =>
    React.createElement(
      'div',
      { 'data-testid': 'video-list' },
      initialVideos.map((v) =>
        React.createElement('div', { key: v.id, 'data-testid': `video-${v.id}` }, v.title)
      )
    ),
}))

import AllVideosPage from '@/app/(moderator)/moderator/videos/page'
import { createClient } from '@/lib/supabase/server'

const mockedCreateClient = vi.mocked(createClient)

type VideoRow = {
  id: string
  title: string
  youtube_id: string
  thumbnail_url: string | null
  status: string
  category: string
  age_band: string
  approval_count: number
  rejection_count: number
}

function makeSupabase({
  user = { id: 'u1' } as { id: string } | null,
  isMod = true,
  videos = [] as VideoRow[],
} = {}) {
  const mock = createMockSupabaseClient()
  mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user }, error: null })
  mock.rpc = vi.fn().mockResolvedValue({ data: isMod, error: null })
  mock.from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: videos, error: null }),
  })
  return mock
}

describe('AllVideosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedirect.mockImplementation((url: string) => { throw new Error(`REDIRECT:${url}`) })
  })

  it('redirects to login when not authenticated', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabase({ user: null }) as never)
    await expect(AllVideosPage()).rejects.toThrow('REDIRECT:/login?next=/moderator/videos')
  })

  it('redirects to /reviewer when not a moderator', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabase({ isMod: false }) as never)
    await expect(AllVideosPage()).rejects.toThrow('REDIRECT:/reviewer')
  })

  it('renders video count (plural)', async () => {
    const videos: VideoRow[] = [
      { id: 'v1', title: 'Video 1', youtube_id: 'yt1', thumbnail_url: null, status: 'approved', category: 'education', age_band: '3-5', approval_count: 1, rejection_count: 0 },
      { id: 'v2', title: 'Video 2', youtube_id: 'yt2', thumbnail_url: null, status: 'pending', category: 'music', age_band: '6-8', approval_count: 0, rejection_count: 0 },
    ]
    mockedCreateClient.mockResolvedValue(makeSupabase({ videos }) as never)
    const jsx = await AllVideosPage()
    render(jsx as React.ReactElement)
    expect(screen.getByText(/2 videos total/i)).toBeInTheDocument()
  })

  it('renders singular video count', async () => {
    const videos: VideoRow[] = [
      { id: 'v1', title: 'Video 1', youtube_id: 'yt1', thumbnail_url: null, status: 'approved', category: 'education', age_band: '3-5', approval_count: 1, rejection_count: 0 },
    ]
    mockedCreateClient.mockResolvedValue(makeSupabase({ videos }) as never)
    const jsx = await AllVideosPage()
    render(jsx as React.ReactElement)
    expect(screen.getByText(/1 video total/i)).toBeInTheDocument()
  })

  it('passes videos to VideoList', async () => {
    const videos: VideoRow[] = [
      { id: 'v1', title: 'My Video', youtube_id: 'yt1', thumbnail_url: null, status: 'approved', category: 'education', age_band: '3-5', approval_count: 1, rejection_count: 0 },
    ]
    mockedCreateClient.mockResolvedValue(makeSupabase({ videos }) as never)
    const jsx = await AllVideosPage()
    render(jsx as React.ReactElement)
    expect(screen.getByTestId('video-list')).toBeInTheDocument()
    expect(screen.getByTestId('video-v1')).toHaveTextContent('My Video')
  })

  it('handles null videos data gracefully', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.rpc = vi.fn().mockResolvedValue({ data: true, error: null })
    mock.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const jsx = await AllVideosPage()
    render(jsx as React.ReactElement)
    expect(screen.getByText(/0 videos total/i)).toBeInTheDocument()
  })
})
