import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createMockSupabaseClient, createMockBuilder } from '@/__mocks__/supabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { POST } from '@/app/api/reviews/submit/route'
import { createClient } from '@/lib/supabase/server'

const mockedCreateClient = vi.mocked(createClient)

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/reviews/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = {
  video_id: 'video-1',
  verdict: 'approve',
  has_violence: false,
  has_scary: false,
  has_adult_themes: false,
  has_bad_language: false,
}

describe('POST /api/reviews/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid JSON body', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const req = new NextRequest('http://localhost/api/reviews/submit', {
      method: 'POST',
      body: 'not json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when required fields are missing', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest({ video_id: 'v1' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid verdict', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest({ ...validBody, verdict: 'maybe' }))
    expect(res.status).toBe(400)
    const json = await res.json() as { error: string }
    expect(json.error).toMatch(/approve.*reject/)
  })

  it('returns 400 for invalid age_band_suggestion', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest({ ...validBody, age_band_suggestion: '99-100' }))
    expect(res.status).toBe(400)
    const json = await res.json() as { error: string }
    expect(json.error).toMatch(/Invalid age band/)
  })

  it('returns 409 on duplicate review (code 23505)', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.from = vi.fn().mockReturnValue(createMockBuilder({
      data: null, error: { code: '23505', message: 'duplicate key' },
    }))
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(409)
  })


  it('returns 500 on other DB errors', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.from = vi.fn().mockReturnValue(createMockBuilder({
      data: null, error: { code: '99999', message: 'Unknown error' },
    }))
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(500)
  })

  it('returns 201 on successful review submission', async () => {
    const mockReview = { id: 'review-1', video_id: 'video-1', verdict: 'approve' }
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.from = vi.fn().mockReturnValue(createMockBuilder({ data: mockReview }))
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(201)
    const json = await res.json() as typeof mockReview
    expect(json.id).toBe('review-1')
  })

  it('returns 201 for reject verdict with reason', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.from = vi.fn().mockReturnValue(createMockBuilder({ data: { id: 'review-2' } }))
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest({
      ...validBody,
      verdict: 'reject',
      has_violence: true,
      age_band_suggestion: '3-5',
      rejection_reason: 'Contains violence',
    }))
    expect(res.status).toBe(201)
  })

  it('uses false defaults when boolean fields are omitted', async () => {
    // Covers has_violence ?? false, has_scary ?? false, etc. branches
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.from = vi.fn().mockReturnValue(createMockBuilder({ data: { id: 'review-3' } }))
    mockedCreateClient.mockResolvedValue(mock as never)
    // Send only required fields — no boolean flags, no age_band_suggestion, no rejection_reason
    const res = await POST(makeRequest({ video_id: 'video-1', verdict: 'approve' }))
    expect(res.status).toBe(201)
  })
})
