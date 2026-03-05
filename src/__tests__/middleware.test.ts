import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// vi.hoisted ensures these are available when vi.mock factories run (hoisted to top)
const { mockGetUser } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn().mockReturnValue({
    auth: { getUser: mockGetUser },
  }),
}))

import { middleware } from '../../middleware'

function makeRequest(pathname: string) {
  return new NextRequest(`http://localhost${pathname}`)
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects unauthenticated user from /reviewer to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = makeRequest('/reviewer')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
    expect(res.headers.get('location')).toContain('next=%2Freviewer')
  })

  it('redirects unauthenticated user from /moderator to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = makeRequest('/moderator')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
  })

  it('allows authenticated user to access /reviewer', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const req = makeRequest('/reviewer')
    const res = await middleware(req)
    // When authenticated, no redirect — location header should be null
    expect(res.headers.get('location')).toBeNull()
  })

  it('redirects authenticated user from /login to /', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const req = makeRequest('/login')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    const location = res.headers.get('location')!
    expect(new URL(location).pathname).toBe('/')
  })

  it('redirects authenticated user from /signup to /', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const req = makeRequest('/signup')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    const location = res.headers.get('location')!
    expect(new URL(location).pathname).toBe('/')
  })

  it('allows unauthenticated user to access public route /browse', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = makeRequest('/browse')
    const res = await middleware(req)
    // No redirect
    expect(res.status).not.toBe(307)
  })

  it('allows authenticated user to access /browse', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const req = makeRequest('/browse')
    const res = await middleware(req)
    expect(res.status).not.toBe(307)
  })

  it('includes next param with reviewer path in redirect', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = makeRequest('/reviewer/submit')
    const res = await middleware(req)
    expect(res.headers.get('location')).toContain('next=%2Freviewer%2Fsubmit')
  })
})
