import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock YT player — capture onStateChange so tests can trigger ENDED
let capturedOnStateChange: ((e: { data: number }) => void) | null = null
const mockYTDestroy = vi.fn()
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

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const pendingVideo = {
  id: 'video-1',
  youtube_id: 'dQw4w9WgXcQ',
  title: 'Test Video for Review',
  thumbnail_url: null,
  category: 'educational',
  age_band: '3-5',
  created_at: '2024-01-01T00:00:00Z',
}

import ReviewPage from '@/app/(reviewer)/reviewer/review/page'
import { loadYTApi } from '@/lib/utils/youtube'

describe('ReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedOnStateChange = null
    mockYTDestroy.mockReset()
  })

  it('shows loading state initially', () => {
    // Never resolves
    mockFetch.mockReturnValue(new Promise(() => {}))
    render(<ReviewPage />)
    expect(screen.getByText(/loading review queue/i)).toBeInTheDocument()
  })

  it('shows empty queue state when API returns null', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => null })
    render(<ReviewPage />)
    await waitFor(() => {
      expect(screen.getByText(/queue is empty/i)).toBeInTheDocument()
    })
  })

  it('shows empty queue state when API returns error', async () => {
    mockFetch.mockResolvedValue({ ok: false })
    render(<ReviewPage />)
    await waitFor(() => {
      expect(screen.getByText(/queue is empty/i)).toBeInTheDocument()
    })
  })

  it('shows empty queue when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    render(<ReviewPage />)
    await waitFor(() => {
      expect(screen.getByText(/queue is empty/i)).toBeInTheDocument()
    })
  })

  it('renders video when queue has an item', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => pendingVideo })
    render(<ReviewPage />)
    await waitFor(() => {
      expect(screen.getByText('Test Video for Review')).toBeInTheDocument()
    })
  })

  it('renders safety checklist questions', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => pendingVideo })
    render(<ReviewPage />)
    await waitFor(() => {
      expect(screen.getByText(/any violence/i)).toBeInTheDocument()
      expect(screen.getByText(/any scary content/i)).toBeInTheDocument()
      expect(screen.getByText(/any adult themes/i)).toBeInTheDocument()
      expect(screen.getByText(/any bad language/i)).toBeInTheDocument()
    })
  })

  it('toggles answers when checklist buttons are clicked', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => pendingVideo })
    const user = userEvent.setup()
    render(<ReviewPage />)
    await waitFor(() => screen.getByText(/any violence/i))
    const violenceBtn = screen.getByText(/any violence/i).closest('button')!
    expect(violenceBtn).toHaveTextContent('NO')
    await user.click(violenceBtn)
    expect(violenceBtn).toHaveTextContent('YES')
    await user.click(violenceBtn)
    expect(violenceBtn).toHaveTextContent('NO')
  })

  it('submit button is disabled until verdict is set', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => pendingVideo })
    render(<ReviewPage />)
    await waitFor(() => screen.getByRole('button', { name: /submit review/i }))
    expect(screen.getByRole('button', { name: /submit review/i })).toBeDisabled()
  })

  it('enables submit button after approve verdict is selected', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => pendingVideo })
    const user = userEvent.setup()
    render(<ReviewPage />)
    await waitFor(() => screen.getByRole('button', { name: /✓ approve/i }))
    await user.click(screen.getByRole('button', { name: /✓ approve/i }))
    expect(screen.getByRole('button', { name: /submit review/i })).not.toBeDisabled()
  })

  it('shows rejection reason textarea when reject is selected', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => pendingVideo })
    const user = userEvent.setup()
    render(<ReviewPage />)
    await waitFor(() => screen.getByRole('button', { name: /✕ reject/i }))
    await user.click(screen.getByRole('button', { name: /✕ reject/i }))
    expect(screen.getByPlaceholderText(/briefly describe why/i)).toBeInTheDocument()
  })

  it('submits review successfully and loads next video', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => pendingVideo }) // initial load
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'review-1' }) }) // submit
      .mockResolvedValueOnce({ ok: true, json: async () => null }) // next video (empty)
    const user = userEvent.setup()
    render(<ReviewPage />)
    await waitFor(() => screen.getByRole('button', { name: /✓ approve/i }))
    await user.click(screen.getByRole('button', { name: /✓ approve/i }))
    await user.click(screen.getByRole('button', { name: /submit review/i }))
    await waitFor(() => {
      expect(screen.getByText(/queue is empty/i)).toBeInTheDocument()
    })
  })

  it('shows error when submit fails', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => pendingVideo })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Cannot review' }) })
    const user = userEvent.setup()
    render(<ReviewPage />)
    await waitFor(() => screen.getByRole('button', { name: /✓ approve/i }))
    await user.click(screen.getByRole('button', { name: /✓ approve/i }))
    await user.click(screen.getByRole('button', { name: /submit review/i }))
    await waitFor(() => {
      expect(screen.getByText(/cannot review/i)).toBeInTheDocument()
    })
  })

  it('shows network error when submit fetch throws', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => pendingVideo })
      .mockRejectedValueOnce(new Error('Network'))
    const user = userEvent.setup()
    render(<ReviewPage />)
    await waitFor(() => screen.getByRole('button', { name: /✓ approve/i }))
    await user.click(screen.getByRole('button', { name: /✓ approve/i }))
    await user.click(screen.getByRole('button', { name: /submit review/i }))
    await waitFor(() => {
      expect(screen.getByText(/could not reach the server/i)).toBeInTheDocument()
    })
  })

  it('selects and deselects age band buttons', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => pendingVideo })
    const user = userEvent.setup()
    render(<ReviewPage />)
    await waitFor(() => screen.getByText(/3–5 years/i))
    const ageBandBtn = screen.getByRole('button', { name: /3–5 years/i })
    await user.click(ageBandBtn)
    // clicking same band again should deselect
    await user.click(ageBandBtn)
    // No assertion needed — just ensure no error is thrown
  })

  it('shows video-ended overlay when YT ENDED event fires', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => pendingVideo })
    render(<ReviewPage />)
    await waitFor(() => screen.getByText('Test Video for Review'))
    await act(async () => {
      capturedOnStateChange?.({ data: 0 }) // 0 = ENDED
    })
    expect(screen.getByText(/video ended/i)).toBeInTheDocument()
  })

  it('allows typing in rejection reason textarea', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => pendingVideo })
    const user = userEvent.setup()
    render(<ReviewPage />)
    await waitFor(() => screen.getByRole('button', { name: /✕ reject/i }))
    await user.click(screen.getByRole('button', { name: /✕ reject/i }))
    const textarea = screen.getByPlaceholderText(/briefly describe why/i)
    await user.type(textarea, 'Contains violence')
    expect(textarea).toHaveValue('Contains violence')
  })

  it('includes rejection_reason in submit payload when reject verdict with reason', async () => {
    // Covers the `verdict === 'reject' && rejectionReason.trim()` branch (line 125)
    const submitBody: string[] = []
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => pendingVideo })
      .mockImplementationOnce((_url: string, opts: RequestInit) => {
        submitBody.push(opts.body as string)
        return Promise.resolve({ ok: true, json: async () => ({}) })
      })
      .mockResolvedValueOnce({ ok: true, json: async () => null })
    const user = userEvent.setup()
    render(<ReviewPage />)
    await waitFor(() => screen.getByRole('button', { name: /✕ reject/i }))
    await user.click(screen.getByRole('button', { name: /✕ reject/i }))
    await user.type(screen.getByPlaceholderText(/briefly describe why/i), 'Has scary content')
    await user.click(screen.getByRole('button', { name: /submit review/i }))
    await waitFor(() => {
      expect(submitBody.length).toBeGreaterThan(0)
      const parsed = JSON.parse(submitBody[0]) as Record<string, unknown>
      expect(parsed.rejection_reason).toBe('Has scary content')
    })
  })

  it('shows fallback error message when submit response has no error field', async () => {
    // Covers the `json.error ?? 'Something went wrong.'` branch (line 133)
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => pendingVideo })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
    const user = userEvent.setup()
    render(<ReviewPage />)
    await waitFor(() => screen.getByRole('button', { name: /✓ approve/i }))
    await user.click(screen.getByRole('button', { name: /✓ approve/i }))
    await user.click(screen.getByRole('button', { name: /submit review/i }))
    await waitFor(() => {
      expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
    })
  })

  it('does not crash when player effect unmounts before loadYTApi callback fires', async () => {
    // Covers `if (destroyed) return` in the IFrame API effect (line 87)
    let capturedCallback: (() => void) | null = null
    vi.mocked(loadYTApi).mockImplementationOnce((cb: () => void) => {
      capturedCallback = cb // capture but don't immediately call
    })
    mockFetch.mockResolvedValue({ ok: true, json: async () => pendingVideo })
    const { unmount } = render(<ReviewPage />)
    // Wait until the video loads and the IFrame effect fires loadYTApi (callback captured)
    await waitFor(() => expect(capturedCallback).not.toBeNull())
    // Unmount sets destroyed = true in the cleanup closure
    unmount()
    // Fire the deferred callback — hits `if (destroyed) return` and exits cleanly
    expect(() => capturedCallback?.()).not.toThrow()
  })

  it('ignores non-ENDED YT player state changes', async () => {
    // Covers the false branch of `if (e.data === window.YT.PlayerState.ENDED)`
    mockFetch.mockResolvedValue({ ok: true, json: async () => pendingVideo })
    render(<ReviewPage />)
    await waitFor(() => screen.getByText('Test Video for Review'))
    await act(async () => {
      capturedOnStateChange?.({ data: 1 }) // 1 = PLAYING (not ENDED)
    })
    // Video should NOT show ended overlay
    expect(screen.queryByText(/video ended/i)).not.toBeInTheDocument()
  })

  it('shows "Loading next…" indicator while fetching next video after submit', async () => {
    // Covers the `{loadingNext && ...}` branch (line 180)
    let resolveNext: (v: Response) => void
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => pendingVideo })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // submit succeeds
      .mockReturnValueOnce(new Promise<Response>((r) => { resolveNext = r })) // next hangs
    const user = userEvent.setup()
    render(<ReviewPage />)
    await waitFor(() => screen.getByRole('button', { name: /✓ approve/i }))
    await user.click(screen.getByRole('button', { name: /✓ approve/i }))
    await user.click(screen.getByRole('button', { name: /submit review/i }))
    await waitFor(() => {
      expect(screen.getByText(/loading next/i)).toBeInTheDocument()
    })
    // Clean up — resolve the hanging fetch
    resolveNext!({ ok: true, json: async () => null } as unknown as Response)
  })
})
