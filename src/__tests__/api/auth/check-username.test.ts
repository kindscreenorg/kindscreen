import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createMockSupabaseClient } from '@/__mocks__/supabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { GET } from '@/app/api/auth/check-username/route'
import { createClient } from '@/lib/supabase/server'

const mockedCreateClient = vi.mocked(createClient)

function makeRequest(username: string) {
  return new NextRequest(`http://localhost/api/auth/check-username?username=${encodeURIComponent(username)}`)
}

describe('GET /api/auth/check-username', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for missing username', async () => {
    const req = new NextRequest('http://localhost/api/auth/check-username')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const json = await res.json() as { available: boolean; error: string }
    expect(json.available).toBe(false)
  })

  it('returns 400 for invalid username format', async () => {
    const res = await GET(makeRequest('!!invalid!!'))
    expect(res.status).toBe(400)
  })

  it('returns 200 for uppercase username (route lowercases it)', async () => {
    // The route calls toLowerCase() before regex check, so UPPERCASE → uppercase (valid)
    const mock = createMockSupabaseClient({
      rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await GET(makeRequest('UPPERCASE'))
    expect(res.status).toBe(200)
    const json = await res.json() as { available: boolean }
    expect(json.available).toBe(true)
  })

  it('returns 200 with available=true when username is free', async () => {
    const mock = createMockSupabaseClient({
      rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await GET(makeRequest('freeuser'))
    expect(res.status).toBe(200)
    const json = await res.json() as { available: boolean }
    expect(json.available).toBe(true)
  })

  it('returns 200 with available=false when username is taken', async () => {
    const mock = createMockSupabaseClient({
      rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await GET(makeRequest('takenuser'))
    expect(res.status).toBe(200)
    const json = await res.json() as { available: boolean }
    expect(json.available).toBe(false)
  })

  it('returns 500 when RPC errors', async () => {
    const mock = createMockSupabaseClient({
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await GET(makeRequest('someuser'))
    expect(res.status).toBe(500)
  })
})
