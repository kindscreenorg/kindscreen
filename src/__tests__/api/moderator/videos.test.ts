import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createMockSupabaseClient, createMockBuilder } from '@/__mocks__/supabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { PATCH } from '@/app/api/moderator/videos/[id]/route'
import { createClient } from '@/lib/supabase/server'

const mockedCreateClient = vi.mocked(createClient)

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/moderator/videos/v1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const params = Promise.resolve({ id: 'video-1' })

describe('PATCH /api/moderator/videos/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await PATCH(makeRequest({ action: 'reject' }), { params })
    expect(res.status).toBe(401)
  })

  it('returns 403 when user is not a moderator', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.rpc = vi.fn().mockResolvedValue({ data: false, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await PATCH(makeRequest({ action: 'reject' }), { params })
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid JSON body', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.rpc = vi.fn().mockResolvedValue({ data: true, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const req = new NextRequest('http://localhost/api/moderator/videos/v1', {
      method: 'PATCH',
      body: 'not json',
    })
    const res = await PATCH(req, { params })
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid action', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.rpc = vi.fn().mockResolvedValue({ data: true, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await PATCH(makeRequest({ action: 'delete' }), { params })
    expect(res.status).toBe(400)
  })

  it('returns 200 on reject action', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.rpc = vi.fn().mockResolvedValue({ data: true, error: null })
    const flagsBuilder = createMockBuilder({ data: null })
    const videosBuilder = createMockBuilder({ data: { id: 'video-1', title: 'Test', status: 'rejected' } })
    let callCount = 0
    mock.from = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) return flagsBuilder
      return videosBuilder
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await PATCH(makeRequest({ action: 'reject' }), { params })
    expect(res.status).toBe(200)
    const json = await res.json() as { status: string }
    expect(json.status).toBe('rejected')
  })

  it('returns 200 on restore action', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.rpc = vi.fn().mockResolvedValue({ data: true, error: null })
    const flagsBuilder = createMockBuilder({ data: null })
    const videosBuilder = createMockBuilder({ data: { id: 'video-1', title: 'Test', status: 'approved' } })
    let callCount = 0
    mock.from = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) return flagsBuilder
      return videosBuilder
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await PATCH(makeRequest({ action: 'restore' }), { params })
    expect(res.status).toBe(200)
    const json = await res.json() as { status: string }
    expect(json.status).toBe('approved')
  })

  it('returns 500 when video update errors', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.rpc = vi.fn().mockResolvedValue({ data: true, error: null })
    const flagsBuilder = createMockBuilder({ data: null })
    const videosBuilder = createMockBuilder({ data: null, error: { message: 'DB error' } })
    let callCount = 0
    mock.from = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) return flagsBuilder
      return videosBuilder
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await PATCH(makeRequest({ action: 'reject' }), { params })
    expect(res.status).toBe(500)
  })
})
