import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import SubmitPage from '@/app/(reviewer)/reviewer/submit/page'

describe('SubmitPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the form with URL input', () => {
    render(<SubmitPage />)
    expect(screen.getByLabelText(/youtube url/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit for review/i })).toBeInTheDocument()
  })

  it('submit button is disabled when no youtube ID is set', () => {
    render(<SubmitPage />)
    expect(screen.getByRole('button', { name: /submit for review/i })).toBeDisabled()
  })

  it('shows error when URL has no valid YouTube ID', async () => {
    const user = userEvent.setup()
    render(<SubmitPage />)
    const urlInput = screen.getByLabelText(/youtube url/i)
    await user.type(urlInput, 'https://example.com/not-youtube')
    fireEvent.blur(urlInput)
    await waitFor(() => {
      expect(screen.getByText(/could not find a valid youtube/i)).toBeInTheDocument()
    })
  })

  it('shows video not found error when API returns 404', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 })
    const user = userEvent.setup()
    render(<SubmitPage />)
    const urlInput = screen.getByLabelText(/youtube url/i)
    await user.type(urlInput, 'https://youtube.com/watch?v=dQw4w9WgXcQ')
    fireEvent.blur(urlInput)
    await waitFor(() => {
      expect(screen.getByText(/not found on youtube/i)).toBeInTheDocument()
    })
  })

  it('shows server error when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<SubmitPage />)
    const urlInput = screen.getByLabelText(/youtube url/i)
    await user.type(urlInput, 'https://youtube.com/watch?v=dQw4w9WgXcQ')
    fireEvent.blur(urlInput)
    await waitFor(() => {
      expect(screen.getByText(/could not reach the server/i)).toBeInTheDocument()
    })
  })

  it('fills title after successful metadata fetch', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ title: 'Awesome Kids Video', thumbnail_url: null }),
    })
    const user = userEvent.setup()
    render(<SubmitPage />)
    const urlInput = screen.getByLabelText(/youtube url/i)
    await user.type(urlInput, 'https://youtube.com/watch?v=dQw4w9WgXcQ')
    fireEvent.blur(urlInput)
    await waitFor(() => {
      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement
      expect(titleInput.value).toBe('Awesome Kids Video')
    })
  })

  // Tests that click buttons/selects after blur must use act(() => urlInput.blur()) to
  // properly move focus away. fireEvent.blur fires the event but does NOT change
  // document.activeElement in jsdom — so subsequent user.click/selectOptions calls
  // would trigger a second real blur on the URL input, calling fetchMetadata() again
  // and consuming mock responses meant for the submit call.

  it('shows language select disabled before metadata fetch', () => {
    render(<SubmitPage />)
    const languageSelect = screen.getByLabelText(/language/i) as HTMLSelectElement
    expect(languageSelect).toBeDisabled()
  })

  it('shows category validation error when submitting without category', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ title: 'Test Video', thumbnail_url: null }),
    })
    const user = userEvent.setup()
    render(<SubmitPage />)
    const urlInput = screen.getByLabelText(/youtube url/i)
    await user.type(urlInput, 'https://youtube.com/watch?v=dQw4w9WgXcQ')
    // Use act+blur to properly remove focus AND wait for async fetchMetadata to complete
    await act(async () => { urlInput.blur() })
    await user.click(screen.getByRole('button', { name: /submit for review/i }))
    await waitFor(() => {
      expect(screen.getByText(/please select a category/i)).toBeInTheDocument()
    })
  })

  it('shows pleaseSelectLanguage error when language not selected', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ title: 'Test Video', thumbnail_url: null }),
    })
    const user = userEvent.setup()
    render(<SubmitPage />)
    const urlInput = screen.getByLabelText(/youtube url/i)
    await user.type(urlInput, 'https://youtube.com/watch?v=dQw4w9WgXcQ')
    await act(async () => { urlInput.blur() })
    await user.selectOptions(screen.getByLabelText(/^category/i), 'educational')
    await user.click(screen.getByRole('button', { name: /submit for review/i }))
    await waitFor(() => {
      expect(screen.getByText(/please select a language/i)).toBeInTheDocument()
    })
  })

  it('shows 409 duplicate error', async () => {
    // First fetch: metadata
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ title: 'Test Video', thumbnail_url: null }),
    })
    // Second fetch: submit → 409
    mockFetch.mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({}) })
    const user = userEvent.setup()
    render(<SubmitPage />)
    const urlInput = screen.getByLabelText(/youtube url/i)
    await user.type(urlInput, 'https://youtube.com/watch?v=dQw4w9WgXcQ')
    await act(async () => { urlInput.blur() })
    await user.selectOptions(screen.getByLabelText(/^category/i), 'educational')
    await user.selectOptions(screen.getByLabelText(/^language/i), 'english')
    await user.click(screen.getByRole('button', { name: /submit for review/i }))
    await waitFor(() => {
      expect(screen.getByText(/already in the catalog/i)).toBeInTheDocument()
    })
  })

  it('shows generic error when submit returns non-ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ title: 'Test Video', thumbnail_url: null }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    })
    const user = userEvent.setup()
    render(<SubmitPage />)
    const urlInput = screen.getByLabelText(/youtube url/i)
    await user.type(urlInput, 'https://youtube.com/watch?v=dQw4w9WgXcQ')
    await act(async () => { urlInput.blur() })
    await user.selectOptions(screen.getByLabelText(/^category/i), 'educational')
    await user.selectOptions(screen.getByLabelText(/^language/i), 'english')
    await user.click(screen.getByRole('button', { name: /submit for review/i }))
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })

  it('shows success message and resets form after successful submission', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ title: 'Test Video', thumbnail_url: null }),
    })
    mockFetch.mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ id: 'new-v' }) })
    const user = userEvent.setup()
    render(<SubmitPage />)
    const urlInput = screen.getByLabelText(/youtube url/i)
    await user.type(urlInput, 'https://youtube.com/watch?v=dQw4w9WgXcQ')
    await act(async () => { urlInput.blur() })
    await user.selectOptions(screen.getByLabelText(/^category/i), 'educational')
    await user.selectOptions(screen.getByLabelText(/^language/i), 'english')
    await user.click(screen.getByRole('button', { name: /submit for review/i }))
    await waitFor(() => {
      expect(screen.getByText(/video submitted/i)).toBeInTheDocument()
    })
    // Form should be reset
    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement
    expect(titleInput.value).toBe('')
  })

  it('shows network error when submit fetch throws', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ title: 'Test Video', thumbnail_url: null }),
    })
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const user = userEvent.setup()
    render(<SubmitPage />)
    const urlInput = screen.getByLabelText(/youtube url/i)
    await user.type(urlInput, 'https://youtube.com/watch?v=dQw4w9WgXcQ')
    await act(async () => { urlInput.blur() })
    await user.selectOptions(screen.getByLabelText(/^category/i), 'educational')
    await user.selectOptions(screen.getByLabelText(/^language/i), 'english')
    await user.click(screen.getByRole('button', { name: /submit for review/i }))
    await waitFor(() => {
      expect(screen.getByText(/could not reach the server/i)).toBeInTheDocument()
    })
  })

  it('clears URL and metadata when URL input changes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ title: 'First Video', thumbnail_url: null }),
    })
    const user = userEvent.setup()
    render(<SubmitPage />)
    const urlInput = screen.getByLabelText(/youtube url/i)
    await user.type(urlInput, 'https://youtube.com/watch?v=dQw4w9WgXcQ')
    await act(async () => { urlInput.blur() })
    await waitFor(() => {
      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement
      expect(titleInput.value).toBe('First Video')
    })
    // Change the URL
    await user.clear(urlInput)
    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement
    expect(titleInput.value).toBe('')
  })

  it('title field is read-only after metadata is fetched', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ title: 'Original Title', thumbnail_url: null }),
    })
    const user = userEvent.setup()
    render(<SubmitPage />)
    const urlInput = screen.getByLabelText(/youtube url/i)
    await user.type(urlInput, 'https://youtube.com/watch?v=dQw4w9WgXcQ')
    await act(async () => { urlInput.blur() })
    await waitFor(() => {
      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement
      expect(titleInput.value).toBe('Original Title')
    })
    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement
    expect(titleInput).toHaveAttribute('readonly')
  })

  it('shows thumbnail preview when metadata returns a thumbnail_url', async () => {
    // Covers the `{thumbnailUrl && (` branch (line 173)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ title: 'Video With Thumbnail', thumbnail_url: 'https://example.com/thumb.jpg' }),
    })
    const user = userEvent.setup()
    render(<SubmitPage />)
    const urlInput = screen.getByLabelText(/youtube url/i)
    await user.type(urlInput, 'https://youtube.com/watch?v=dQw4w9WgXcQ')
    await act(async () => { urlInput.blur() })
    await waitFor(() => {
      expect(screen.getByAltText('Video thumbnail')).toBeInTheDocument()
    })
  })

  it('shows fallback error message when submit response has no error field', async () => {
    // Covers the `json.error ?? 'Something went wrong.'` branch (line 114)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ title: 'Test Video', thumbnail_url: null }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    })
    const user = userEvent.setup()
    render(<SubmitPage />)
    const urlInput = screen.getByLabelText(/youtube url/i)
    await user.type(urlInput, 'https://youtube.com/watch?v=dQw4w9WgXcQ')
    await act(async () => { urlInput.blur() })
    await user.selectOptions(screen.getByLabelText(/^category/i), 'educational')
    await user.selectOptions(screen.getByLabelText(/^language/i), 'english')
    await user.click(screen.getByRole('button', { name: /submit for review/i }))
    await waitFor(() => {
      expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
    })
  })

  it('allows selecting age band after metadata is fetched', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ title: 'Test Video', thumbnail_url: null }),
    })
    const user = userEvent.setup()
    render(<SubmitPage />)
    const urlInput = screen.getByLabelText(/youtube url/i)
    await user.type(urlInput, 'https://youtube.com/watch?v=dQw4w9WgXcQ')
    await act(async () => { urlInput.blur() })
    await waitFor(() => {
      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement
      expect(titleInput.value).toBe('Test Video')
    })
    await user.selectOptions(screen.getByLabelText(/age band/i), '3-5')
    const ageBandSelect = screen.getByLabelText(/age band/i) as HTMLSelectElement
    expect(ageBandSelect.value).toBe('3-5')
  })
})
