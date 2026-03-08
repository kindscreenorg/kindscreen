import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createMockSupabaseClient, createMockBuilder } from '@/__mocks__/supabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { POST } from '@/app/api/videos/submit/route'
import { createClient } from '@/lib/supabase/server'

const mockedCreateClient = vi.mocked(createClient)

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/videos/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = {
  youtube_id: 'dQw4w9WgXcQ',
  title: 'Test Video',
  category: 'educational',
  language: 'english',
  age_band: '3-5',
  thumbnail_url: 'https://example.com/thumb.jpg',
}

describe('POST /api/videos/submit', () => {
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

  it('returns 401 when auth errors', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'err' } })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid JSON body', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const req = new NextRequest('http://localhost/api/videos/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when required fields are missing', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest({ youtube_id: 'dQw4w9WgXcQ' }))
    expect(res.status).toBe(400)
    const json = await res.json() as { error: string }
    expect(json.error).toMatch(/required/)
  })

  it('returns 400 for invalid category', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest({ ...validBody, category: 'invalid_cat' }))
    expect(res.status).toBe(400)
    const json = await res.json() as { error: string }
    expect(json.error).toMatch(/Invalid category/)
  })

  it('returns 400 for invalid age_band', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest({ ...validBody, age_band: '99-100' }))
    expect(res.status).toBe(400)
    const json = await res.json() as { error: string }
    expect(json.error).toMatch(/Invalid age band/)
  })

  it('returns 400 when language is missing', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const { language: _lang, ...bodyWithoutLanguage } = validBody
    const res = await POST(makeRequest(bodyWithoutLanguage))
    expect(res.status).toBe(400)
    const json = await res.json() as { error: string }
    expect(json.error).toMatch(/required/)
  })

  it('returns 400 when language is invalid', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest({ ...validBody, language: 'klingon' }))
    expect(res.status).toBe(400)
    const json = await res.json() as { error: string }
    expect(json.error).toMatch(/Invalid language/)
  })

  it('returns 409 when video already exists', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    const builder = createMockBuilder({ data: { id: 'existing-video' } })
    mock.from = vi.fn().mockReturnValue(builder)
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(409)
  })

  it('returns 201 on successful submission', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    // First from() call: maybeSingle returns null (no duplicate)
    // Second from() call: single returns the new video
    let callCount = 0
    mock.from = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return createMockBuilder({ data: null })
      }
      return createMockBuilder({ data: { id: 'new-video', youtube_id: 'dQw4w9WgXcQ' } })
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(201)
  })

  it('returns 500 when insert errors', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    let callCount = 0
    mock.from = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return createMockBuilder({ data: null })
      }
      return createMockBuilder({ data: null, error: { message: 'DB error' } })
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(500)
  })

  it('succeeds without optional age_band', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    let callCount = 0
    mock.from = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) return createMockBuilder({ data: null })
      return createMockBuilder({ data: { id: 'new-video' } })
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const { age_band: _ab, ...bodyWithoutAgeBand } = validBody
    const res = await POST(makeRequest(bodyWithoutAgeBand))
    expect(res.status).toBe(201)
  })

  it('succeeds without optional thumbnail_url (uses null fallback)', async () => {
    // Covers thumbnail_url ?? null branch
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    let callCount = 0
    mock.from = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) return createMockBuilder({ data: null })
      return createMockBuilder({ data: { id: 'new-video' } })
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const { thumbnail_url: _tu, ...bodyWithoutThumbnail } = validBody
    const res = await POST(makeRequest(bodyWithoutThumbnail))
    expect(res.status).toBe(201)
  })
})
