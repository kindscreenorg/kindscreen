import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createMockSupabaseClient, createMockBuilder } from '@/__mocks__/supabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { POST } from '@/app/api/flags/route'
import { createClient } from '@/lib/supabase/server'

const mockedCreateClient = vi.mocked(createClient)

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/flags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/flags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for invalid JSON body', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const req = new NextRequest('http://localhost/api/flags', {
      method: 'POST',
      body: 'not json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when video_id is missing', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest({ reason: 'bad content' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when reason is missing', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest({ video_id: 'v1' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when reason is only whitespace', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest({ video_id: 'v1', reason: '   ' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when reason is too short', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest({ video_id: 'v1', reason: 'bad' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when video is not found or not approved', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    mock.from = vi.fn().mockReturnValue(createMockBuilder({ data: null }))
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest({ video_id: 'v1', reason: 'bad content here' }))
    expect(res.status).toBe(404)
  })

  it('returns 201 for anonymous user with valid flag', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    let callCount = 0
    mock.from = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) return createMockBuilder({ data: { id: 'v1', status: 'approved' } })
      return createMockBuilder({ data: null })
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest({ video_id: 'v1', reason: 'bad content here' }))
    expect(res.status).toBe(201)
  })

  it('returns 201 for authenticated user with valid flag', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    let callCount = 0
    mock.from = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) return createMockBuilder({ data: { id: 'v1', status: 'approved' } })
      return createMockBuilder({ data: null })
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest({ video_id: 'v1', reason: 'contains violence' }))
    expect(res.status).toBe(201)
    const json = await res.json() as { ok: boolean }
    expect(json.ok).toBe(true)
  })

  it('returns 500 when flags insert errors', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    let callCount = 0
    mock.from = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) return createMockBuilder({ data: { id: 'v1', status: 'approved' } })
      return createMockBuilder({ error: { message: 'DB error' } })
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await POST(makeRequest({ video_id: 'v1', reason: 'bad content here' }))
    expect(res.status).toBe(500)
  })
})
