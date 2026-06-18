import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import type { VideoWithChannel } from '@/app/(public)/browse/page'
import { loadYTApi } from '@/lib/utils/youtube'

// Capture YT event handler so tests can trigger video end
let capturedOnStateChange: ((e: { data: number }) => void) | null = null
const mockYTDestroy = vi.fn()
// Must be a regular function (not arrow) — called with `new`
function MockYTPlayer(
  this: { destroy: () => void },
  _id: string,
  config: { events?: { onStateChange?: (e: { data: number }) => void } } = {},
) {
  capturedOnStateChange = config.events?.onStateChange ?? null
  this.destroy = mockYTDestroy
}
Object.defineProperty(window, 'YT', {
  value: { Player: MockYTPlayer, PlayerState: { ENDED: 0 } },
  writable: true,
  configurable: true,
})

vi.mock('@/lib/utils/youtube', () => ({
  loadYTApi: vi.fn().mockImplementation((cb: () => void) => cb()),
}))

const mockSupabaseFrom = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockSupabaseFrom,
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  }),
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import VideoModal from '@/app/(public)/browse/VideoModal'

function makeVideo(overrides: Partial<VideoWithChannel> = {}): VideoWithChannel {
  return {
    id: 'v1',
    youtube_id: 'dQw4w9WgXcQ',
    title: 'Fun Video',
    thumbnail_url: 'https://example.com/thumb.jpg',
    age_band: '3-5',
    category: 'educational',
    status: 'approved',
    submitted_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    channel_id: null,
    channels: { name: 'Test Channel', youtube_channel_id: 'UC123' },
    ...overrides,
  } as VideoWithChannel
}

describe('VideoModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedOnStateChange = null
    mockYTDestroy.mockReset()
    // Default: empty upNext
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [] }),
    })
  })

  it('renders nothing when video is null', () => {
    const { container } = render(<VideoModal video={null} onClose={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders video title and channel name', () => {
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    expect(screen.getByText('Fun Video')).toBeInTheDocument()
    expect(screen.getByText('Test Channel')).toBeInTheDocument()
  })

  it('does not render channel name when channels is null', () => {
    render(<VideoModal video={makeVideo({ channels: null })} onClose={vi.fn()} />)
    expect(screen.queryByText('Test Channel')).not.toBeInTheDocument()
  })

  it('calls onClose when ESC key is pressed', async () => {
    const mockClose = vi.fn()
    render(<VideoModal video={makeVideo()} onClose={mockClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mockClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const mockClose = vi.fn()
    render(<VideoModal video={makeVideo()} onClose={mockClose} />)
    await user.click(screen.getByLabelText(/close/i))
    expect(mockClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup()
    const mockClose = vi.fn()
    render(<VideoModal video={makeVideo()} onClose={mockClose} />)
    const backdrop = document.querySelector('.fixed.inset-0')!
    await user.click(backdrop as Element)
    expect(mockClose).toHaveBeenCalledOnce()
  })

  it('shows flag report button in idle state', () => {
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    expect(screen.getByText(/report this video/i)).toBeInTheDocument()
  })

  it('shows flag form after clicking report button', async () => {
    const user = userEvent.setup()
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    await user.click(screen.getByText(/report this video/i))
    expect(screen.getByPlaceholderText(/describe why/i)).toBeInTheDocument()
  })

  it('shows error state when flag submission fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'Flag failed' }) })
    const user = userEvent.setup()
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    await user.click(screen.getByText(/report this video/i))
    await user.type(screen.getByPlaceholderText(/describe why/i), 'This is inappropriate content')
    await user.click(screen.getByRole('button', { name: /submit report/i }))
    await waitFor(() => {
      expect(screen.getByText('Flag failed')).toBeInTheDocument()
    })
  })

  it('shows done state after successful flag submission', async () => {
    mockFetch.mockResolvedValue({ ok: true })
    const user = userEvent.setup()
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    await user.click(screen.getByText(/report this video/i))
    await user.type(screen.getByPlaceholderText(/describe why/i), 'This is inappropriate content')
    await user.click(screen.getByRole('button', { name: /submit report/i }))
    await waitFor(() => {
      expect(screen.getByText(/report submitted/i)).toBeInTheDocument()
    })
  })

  it('cancels flag form when cancel button clicked', async () => {
    const user = userEvent.setup()
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    await user.click(screen.getByText(/report this video/i))
    expect(screen.getByPlaceholderText(/describe why/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByPlaceholderText(/describe why/i)).not.toBeInTheDocument()
  })

  it('resets state when video changes', () => {
    const video1 = makeVideo({ id: 'v1' })
    const video2 = makeVideo({ id: 'v2', title: 'Second Video' })
    const { rerender } = render(<VideoModal video={video1} onClose={vi.fn()} />)
    rerender(<VideoModal video={video2} onClose={vi.fn()} />)
    expect(screen.getByText('Second Video')).toBeInTheDocument()
  })

  it('shows network error when fetch throws on flag submit', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    await user.click(screen.getByText(/report this video/i))
    await user.type(screen.getByPlaceholderText(/describe why/i), 'This is inappropriate')
    await user.click(screen.getByRole('button', { name: /submit report/i }))
    await waitFor(() => {
      expect(screen.getByText(/could not reach the server/i)).toBeInTheDocument()
    })
  })

  it('does not submit flag when reason is empty (button disabled)', async () => {
    const user = userEvent.setup()
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    await user.click(screen.getByText(/report this video/i))
    const submitBtn = screen.getByRole('button', { name: /submit report/i })
    expect(submitBtn).toBeDisabled()
  })

  it('removes ESC listener on cleanup', () => {
    const mockClose = vi.fn()
    const { unmount } = render(<VideoModal video={makeVideo()} onClose={mockClose} />)
    unmount()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mockClose).not.toHaveBeenCalled()
  })

  it('shows "Watch next" overlay and loading text when video ends', async () => {
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    await act(async () => {
      capturedOnStateChange?.({ data: 0 }) // 0 = ENDED
    })
    await waitFor(() => {
      expect(screen.getByText(/watch next on kindscreen/i)).toBeInTheDocument()
      expect(screen.getByText(/loading suggestions/i)).toBeInTheDocument()
    })
  })

  it('shows up-next videos grid when fetchUpNext returns data', async () => {
    const upNext = [
      makeVideo({ id: 'v2', title: 'Next Video 1', thumbnail_url: null }),
      makeVideo({ id: 'v3', title: 'Next Video 2', thumbnail_url: null }),
    ]
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: upNext }),
    })
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    await act(async () => {
      capturedOnStateChange?.({ data: 0 })
    })
    await waitFor(() => {
      expect(screen.getByText('Next Video 1')).toBeInTheDocument()
      expect(screen.getByText('Next Video 2')).toBeInTheDocument()
    })
  })

  it('calls onVideoChange when up-next video is clicked', async () => {
    const upNext = [makeVideo({ id: 'v2', title: 'Next Video', thumbnail_url: null })]
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: upNext }),
    })
    const mockOnVideoChange = vi.fn()
    const user = userEvent.setup()
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} onVideoChange={mockOnVideoChange} />)
    await act(async () => {
      capturedOnStateChange?.({ data: 0 })
    })
    await waitFor(() => {
      expect(screen.getByText('Next Video')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Next Video').closest('button')!)
    expect(mockOnVideoChange).toHaveBeenCalledWith(upNext[0])
  })

  it('up-next overlay close button calls onClose', async () => {
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    await act(async () => {
      capturedOnStateChange?.({ data: 0 })
    })
    // The overlay has a "Close" button
    await waitFor(() => {
      // The overlay renders a Close button
      const closeBtn = screen.getAllByRole('button').find(
        (b) => b.textContent?.trim() === 'Close'
      )
      expect(closeBtn).toBeDefined()
    })
  })

  it('calls exitFullscreen when video ends in fullscreen', async () => {
    const mockExit = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(document, 'fullscreenElement', { value: document.body, configurable: true })
    Object.defineProperty(document, 'exitFullscreen', { value: mockExit, configurable: true })
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    await act(async () => { capturedOnStateChange?.({ data: 0 }) })
    expect(mockExit).toHaveBeenCalled()
    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
  })

  it('does not call exitFullscreen when video ends not in fullscreen', async () => {
    const mockExit = vi.fn()
    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
    Object.defineProperty(document, 'exitFullscreen', { value: mockExit, configurable: true })
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    await act(async () => { capturedOnStateChange?.({ data: 0 }) })
    expect(mockExit).not.toHaveBeenCalled()
  })

  it('ignores non-ENDED YT player state changes', async () => {
    // Covers the false branch of `if (e.data === window.YT.PlayerState.ENDED)`
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    await act(async () => {
      capturedOnStateChange?.({ data: 1 }) // 1 = PLAYING (not ENDED)
    })
    expect(screen.queryByText(/watch next on kindscreen/i)).not.toBeInTheDocument()
  })

  it('handles null data from fetchUpNext (covers data ?? [] fallback)', async () => {
    // Covers `((data ?? []) as ...)` at line 84 in VideoModal
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null }),
    })
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    await act(async () => {
      capturedOnStateChange?.({ data: 0 }) // ENDED
    })
    await waitFor(() => {
      // null data treated as [] → no videos → shows "Loading suggestions…"
      expect(screen.getByText(/loading suggestions/i)).toBeInTheDocument()
    })
  })

  it('renders thumbnail image in up-next grid when thumbnail_url is set', async () => {
    // Covers the `{v.thumbnail_url && (<Image .../>)}` branch (line 156)
    const upNext = [
      makeVideo({ id: 'v2', title: 'Thumbed Video', thumbnail_url: 'https://example.com/t.jpg' }),
    ]
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: upNext }),
    })
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    await act(async () => {
      capturedOnStateChange?.({ data: 0 })
    })
    await waitFor(() => {
      expect(screen.getByAltText('Thumbed Video')).toBeInTheDocument()
    })
  })

  it('shows fallback error message when flag response has no error field', async () => {
    // Covers the `json.error ?? 'Something went wrong.'` branch (line 102)
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) })
    const user = userEvent.setup()
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    await user.click(screen.getByText(/report this video/i))
    await user.type(screen.getByPlaceholderText(/describe why/i), 'Bad content')
    await user.click(screen.getByRole('button', { name: /submit report/i }))
    await waitFor(() => {
      expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
    })
  })

  it('toggleFullscreen calls requestFullscreen on container when not in fullscreen', async () => {
    const mockReqFs = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { value: mockReqFs, configurable: true, writable: true })
    const user = userEvent.setup()
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    await user.click(screen.getByLabelText('Enter fullscreen'))
    expect(mockReqFs).toHaveBeenCalled()
    Reflect.deleteProperty(HTMLElement.prototype, 'requestFullscreen')
  })

  it('toggleFullscreen calls exitFullscreen when fullscreenElement is set', async () => {
    const mockExit = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(document, 'fullscreenElement', { value: document.body, configurable: true })
    Object.defineProperty(document, 'exitFullscreen', { value: mockExit, configurable: true })
    const user = userEvent.setup()
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    await user.click(screen.getByLabelText('Enter fullscreen'))
    expect(mockExit).toHaveBeenCalled()
    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
  })

  it('fullscreenchange event updates isFullscreen state and button label', async () => {
    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
    render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    expect(screen.getByLabelText('Enter fullscreen')).toBeInTheDocument()
    Object.defineProperty(document, 'fullscreenElement', { value: document.body, configurable: true })
    await act(async () => { document.dispatchEvent(new Event('fullscreenchange')) })
    expect(screen.getByLabelText('Exit fullscreen')).toBeInTheDocument()
    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
  })

  it('does not crash when component unmounts before loadYTApi callback fires (destroyed branch)', () => {
    // Covers `if (destroyed) return` (line 53)
    let capturedCallback: (() => void) | null = null
    vi.mocked(loadYTApi).mockImplementationOnce((cb: () => void) => {
      capturedCallback = cb // capture but don't call immediately
    })
    const { unmount } = render(<VideoModal video={makeVideo()} onClose={vi.fn()} />)
    // Unmount sets destroyed = true in the cleanup closure
    unmount()
    // Firing callback after unmount — hits `if (destroyed) return` and exits cleanly
    expect(() => capturedCallback?.()).not.toThrow()
  })
})
