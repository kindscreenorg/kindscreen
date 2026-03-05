import { describe, it, expect, vi, beforeEach } from 'vitest'
import { strings } from '@/lib/i18n/strings'

// Unmock server module so we test the real implementation
vi.unmock('@/lib/i18n/server')

// Mock next/headers cookies
const mockGet = vi.fn()
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: mockGet }),
}))

describe('getLocale', () => {
  beforeEach(() => {
    mockGet.mockReset()
  })

  it('returns "en" when no locale cookie is set', async () => {
    mockGet.mockReturnValue(undefined)
    const { getLocale } = await import('@/lib/i18n/server')
    expect(await getLocale()).toBe('en')
  })

  it('returns "pt" when locale cookie is "pt"', async () => {
    mockGet.mockReturnValue({ value: 'pt' })
    const { getLocale } = await import('@/lib/i18n/server')
    expect(await getLocale()).toBe('pt')
  })

  it('returns "en" when locale cookie is "en"', async () => {
    mockGet.mockReturnValue({ value: 'en' })
    const { getLocale } = await import('@/lib/i18n/server')
    expect(await getLocale()).toBe('en')
  })

  it('returns "en" when locale cookie has an unrecognised value', async () => {
    mockGet.mockReturnValue({ value: 'fr' })
    const { getLocale } = await import('@/lib/i18n/server')
    expect(await getLocale()).toBe('en')
  })
})

describe('getT', () => {
  it('returns EN strings when locale is en', async () => {
    mockGet.mockReturnValue(undefined)
    const { getT } = await import('@/lib/i18n/server')
    expect(await getT()).toEqual(strings.en)
  })

  it('returns PT strings when locale is pt', async () => {
    mockGet.mockReturnValue({ value: 'pt' })
    const { getT } = await import('@/lib/i18n/server')
    expect(await getT()).toEqual(strings.pt)
  })
})
