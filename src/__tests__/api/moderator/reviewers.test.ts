import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createMockSupabaseClient } from '@/__mocks__/supabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { PATCH } from '@/app/api/moderator/reviewers/[id]/route'
import { createClient } from '@/lib/supabase/server'

const mockedCreateClient = vi.mocked(createClient)

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/moderator/reviewers/r1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const params = Promise.resolve({ id: 'reviewer-1' })

describe('PATCH /api/moderator/reviewers/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await PATCH(makeRequest({ field: 'is_trusted', value: true }), { params })
    expect(res.status).toBe(401)
  })

  it('returns 401 when auth error', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'err' } })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await PATCH(makeRequest({ field: 'is_trusted', value: true }), { params })
    expect(res.status).toBe(401)
  })

  it('returns 403 when user is not a moderator', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.rpc = vi.fn().mockResolvedValue({ data: false, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await PATCH(makeRequest({ field: 'is_trusted', value: true }), { params })
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid JSON body', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.rpc = vi.fn().mockResolvedValue({ data: true, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const req = new NextRequest('http://localhost/api/moderator/reviewers/r1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })
    const res = await PATCH(req, { params })
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid field value', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.rpc = vi.fn().mockResolvedValue({ data: true, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await PATCH(makeRequest({ field: 'is_admin', value: true }), { params })
    expect(res.status).toBe(400)
  })

  it('returns 400 when value is not a boolean', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.rpc = vi.fn().mockResolvedValue({ data: true, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await PATCH(makeRequest({ field: 'is_trusted', value: 'yes' }), { params })
    expect(res.status).toBe(400)
  })

  it('returns 403 when non-admin tries to set is_moderator', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    // First rpc call: is_moderator → true; second: is_admin → false
    mock.rpc = vi.fn()
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: false, error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await PATCH(makeRequest({ field: 'is_moderator', value: true }), { params })
    expect(res.status).toBe(403)
  })

  it('updates is_trusted successfully', async () => {
    const updated = { id: 'reviewer-1', username: 'alice', is_trusted: true, is_moderator: false }
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.rpc = vi.fn().mockResolvedValue({ data: true, error: null })
    mock.from = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await PATCH(makeRequest({ field: 'is_trusted', value: true }), { params })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual(updated)
  })

  it('updates is_moderator when caller is admin', async () => {
    const updated = { id: 'reviewer-1', username: 'bob', is_trusted: false, is_moderator: true }
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.rpc = vi.fn()
      .mockResolvedValueOnce({ data: true, error: null })   // is_moderator
      .mockResolvedValueOnce({ data: true, error: null })   // is_admin
    mock.from = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await PATCH(makeRequest({ field: 'is_moderator', value: true }), { params })
    expect(res.status).toBe(200)
  })

  it('returns 500 when DB update fails', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mock.rpc = vi.fn().mockResolvedValue({ data: true, error: null })
    mock.from = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await PATCH(makeRequest({ field: 'is_trusted', value: false }), { params })
    expect(res.status).toBe(500)
  })
})
