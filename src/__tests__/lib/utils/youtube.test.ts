import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { extractYoutubeId, loadYTApi } from '@/lib/utils/youtube'

describe('extractYoutubeId', () => {
  it('extracts ID from standard watch URL', () => {
    expect(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts ID from URL with extra params', () => {
    expect(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42')).toBe('dQw4w9WgXcQ')
  })

  it('extracts ID from youtu.be short URL', () => {
    expect(extractYoutubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts ID from /shorts/ URL', () => {
    expect(extractYoutubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts ID from /embed/ URL', () => {
    expect(extractYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('accepts bare 11-character ID', () => {
    expect(extractYoutubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('trims whitespace before matching', () => {
    expect(extractYoutubeId('  dQw4w9WgXcQ  ')).toBe('dQw4w9WgXcQ')
  })

  it('returns null for empty string', () => {
    expect(extractYoutubeId('')).toBeNull()
  })

  it('returns null for invalid URL', () => {
    expect(extractYoutubeId('https://example.com')).toBeNull()
  })

  it('returns null for too-short ID', () => {
    expect(extractYoutubeId('abc123')).toBeNull()
  })

  it('returns null for too-long bare ID', () => {
    expect(extractYoutubeId('dQw4w9WgXcQXXXXX')).toBeNull()
  })
})

describe('loadYTApi', () => {
  let originalYT: typeof window.YT
  let originalCallback: typeof window.onYouTubeIframeAPIReady

  beforeEach(() => {
    originalYT = window.YT
    originalCallback = window.onYouTubeIframeAPIReady
    // Remove any existing script tags
    document.querySelectorAll('script[src*="youtube.com/iframe_api"]').forEach((s) => s.remove())
  })

  afterEach(() => {
    window.YT = originalYT
    window.onYouTubeIframeAPIReady = originalCallback
    document.querySelectorAll('script[src*="youtube.com/iframe_api"]').forEach((s) => s.remove())
  })

  it('calls onReady immediately when YT.Player already exists', () => {
    // @ts-expect-error — partial mock
    window.YT = { Player: vi.fn() }
    const onReady = vi.fn()
    loadYTApi(onReady)
    expect(onReady).toHaveBeenCalledOnce()
  })

  it('injects script tag and sets callback when API not loaded', () => {
    // @ts-expect-error — ensure YT is not set
    window.YT = undefined
    const onReady = vi.fn()
    loadYTApi(onReady)
    expect(onReady).not.toHaveBeenCalled()
    const script = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
    expect(script).not.toBeNull()
    // Simulate the API loading
    window.onYouTubeIframeAPIReady?.()
    expect(onReady).toHaveBeenCalledOnce()
  })

  it('does not inject a second script tag if one already exists', () => {
    // @ts-expect-error — intentionally setting YT to undefined to simulate unloaded API
    window.YT = undefined
    const existing = document.createElement('script')
    existing.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(existing)
    loadYTApi(vi.fn())
    const scripts = document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]')
    expect(scripts.length).toBe(1)
  })

  it('chains an existing onYouTubeIframeAPIReady callback', () => {
    // @ts-expect-error — intentionally setting YT to undefined to simulate unloaded API
    window.YT = undefined
    const prevCallback = vi.fn()
    window.onYouTubeIframeAPIReady = prevCallback
    const onReady = vi.fn()
    loadYTApi(onReady)
    window.onYouTubeIframeAPIReady?.()
    expect(prevCallback).toHaveBeenCalledOnce()
    expect(onReady).toHaveBeenCalledOnce()
  })
})
