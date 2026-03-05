import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/locale/route'

describe('POST /api/locale', () => {
  function makeRequest(body: unknown) {
    return new Request('http://localhost/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('sets locale cookie to "pt" and returns 200', async () => {
    const res = await POST(makeRequest({ locale: 'pt' }))
    expect(res.status).toBe(200)
    const json = await res.json() as { ok: boolean }
    expect(json.ok).toBe(true)
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('locale=pt')
  })

  it('sets locale cookie to "en" and returns 200', async () => {
    const res = await POST(makeRequest({ locale: 'en' }))
    expect(res.status).toBe(200)
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('locale=en')
  })

  it('returns 400 for an invalid locale value', async () => {
    const res = await POST(makeRequest({ locale: 'fr' }))
    expect(res.status).toBe(400)
    const json = await res.json() as { error: string }
    expect(json.error).toBe('Invalid locale')
  })

  it('returns 400 when locale key is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })
})
