import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createMockSupabaseClient } from '@/__mocks__/supabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { GET } from '@/app/(auth)/auth/callback/route'
import { createClient } from '@/lib/supabase/server'

const mockedCreateClient = vi.mocked(createClient)

function makeRequest(params: Record<string, string>) {
  const url = new URL('http://localhost/auth/callback')
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  return new NextRequest(url.toString())
}

describe('GET /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /login?error=... when no code is present', async () => {
    const res = await GET(makeRequest({}))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login?error=auth_callback_failed')
  })

  it('redirects to /login?error=... when code exchange fails', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.exchangeCodeForSession = vi.fn().mockResolvedValue({ error: { message: 'invalid' } })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await GET(makeRequest({ code: 'bad-code' }))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login?error=auth_callback_failed')
  })

  it('redirects to / after successful code exchange with no next param', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await GET(makeRequest({ code: 'valid-code' }))
    expect(res.status).toBe(307)
    const location = res.headers.get('location')!
    expect(location.endsWith('/')).toBe(true)
  })

  it('redirects to safe next path after successful exchange', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await GET(makeRequest({ code: 'valid-code', next: '/reset-password' }))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/reset-password')
  })

  it('redirects to / for unsafe absolute next URL (open redirect guard)', async () => {
    const mock = createMockSupabaseClient()
    mock.auth.exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null })
    mockedCreateClient.mockResolvedValue(mock as never)
    const res = await GET(makeRequest({ code: 'valid-code', next: 'http://evil.com/steal' }))
    expect(res.status).toBe(307)
    const location = res.headers.get('location')!
    // Should redirect to origin/ not evil.com
    expect(location).not.toContain('evil.com')
    expect(location.endsWith('/')).toBe(true)
  })
})
