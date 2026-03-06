import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient, createMockBuilder } from '@/__mocks__/supabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { GET } from '@/app/api/reviews/next/route'
import { createClient } from '@/lib/supabase/server'

const mockedCreateClient = vi.mocked(createClient)

describe('GET /api/reviews/next', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 401 when auth errors', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'err' } })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 200 with null when queue is empty', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } }, error: null,
    })
    let callCount = 0
    mock.from = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // reviews query — returns no reviewed videos
        return createMockBuilder({ data: [] })
      }
      // videos query — returns null (empty queue)
      return createMockBuilder({ data: null })
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeNull()
  })

  it('returns 200 with video when queue has items', async () => {
    const mockVideo = {
      id: 'video-1',
      youtube_id: 'dQw4w9WgXcQ',
      title: 'Test Video',
      thumbnail_url: null,
      category: 'educational',
      age_band: null,
      created_at: '2024-01-01T00:00:00Z',
    }
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } }, error: null,
    })
    let callCount = 0
    mock.from = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return createMockBuilder({ data: [] })
      }
      return createMockBuilder({ data: mockVideo })
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json() as typeof mockVideo
    expect(json.id).toBe('video-1')
  })

  it('excludes already-reviewed videos when user has reviews', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } }, error: null,
    })
    const reviewsBuilder = createMockBuilder({ data: [{ video_id: 'video-already' }] })
    const videosBuilder = createMockBuilder({ data: null })
    let callCount = 0
    mock.from = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) return reviewsBuilder
      return videosBuilder
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await GET()
    expect(res.status).toBe(200)
    // The .not() call should have been made on the videos builder
    expect(videosBuilder.not).toHaveBeenCalledWith('id', 'in', '(video-already)')
  })

  it('excludes videos submitted by the current user', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } }, error: null,
    })
    const reviewsBuilder = createMockBuilder({ data: [] })
    const videosBuilder = createMockBuilder({ data: null })
    let callCount = 0
    mock.from = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) return reviewsBuilder
      return videosBuilder
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    await GET()
    expect(videosBuilder.neq).toHaveBeenCalledWith('submitted_by', 'user-1')
  })

  it('returns 500 when video query errors', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } }, error: null,
    })
    let callCount = 0
    mock.from = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) return createMockBuilder({ data: [] })
      return createMockBuilder({ data: null, error: { message: 'DB error' } })
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await GET()
    expect(res.status).toBe(500)
  })

  it('handles null reviewed data (uses empty array fallback)', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } }, error: null,
    })
    let callCount = 0
    mock.from = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // reviews query — returns null (not empty array)
        return createMockBuilder({ data: null })
      }
      return createMockBuilder({ data: null })
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await GET()
    // Should still return 200 (null video = empty queue)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeNull()
  })
})
