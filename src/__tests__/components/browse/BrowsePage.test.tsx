import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

const { mockCreateClient } = vi.hoisted(() => ({ mockCreateClient: vi.fn() }))

vi.mock('@/lib/supabase/server', () => ({ createClient: mockCreateClient }))

// Simplify BrowseClient to just render props for inspection
vi.mock('@/app/(public)/browse/BrowseClient', () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement('div', { 'data-testid': 'browse-client', 'data-props': JSON.stringify(props) }),
}))

import BrowsePage from '@/app/(public)/browse/page'

function makeSupabaseMock(data: unknown = [], count: number | null = 0, error: unknown = null) {
  const builder: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'order', 'range']) {
    builder[m] = vi.fn().mockReturnValue(builder)
  }
  builder.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
    resolve({ data, count, error })
    return Promise.resolve({ data, count, error })
  })
  return {
    auth: { getUser: vi.fn() },
    from: vi.fn().mockReturnValue(builder),
  }
}

describe('BrowsePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders BrowseClient with no filters when no searchParams', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock([], 0))
    const jsx = await BrowsePage({ searchParams: Promise.resolve({}) })
    render(jsx)
    const client = screen.getByTestId('browse-client')
    const props = JSON.parse(client.getAttribute('data-props')!) as Record<string, unknown>
    expect(props.category).toBeUndefined()
    expect(props.ageBand).toBeUndefined()
    expect(props.pageSize).toBe(12)
  })

  it('passes valid category to BrowseClient', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock([], 0))
    const jsx = await BrowsePage({ searchParams: Promise.resolve({ category: 'educational' }) })
    render(jsx)
    const props = JSON.parse(screen.getByTestId('browse-client').getAttribute('data-props')!) as Record<string, unknown>
    expect(props.category).toBe('educational')
  })

  it('passes valid age_band to BrowseClient', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock([], 0))
    const jsx = await BrowsePage({ searchParams: Promise.resolve({ age_band: '3-5' }) })
    render(jsx)
    const props = JSON.parse(screen.getByTestId('browse-client').getAttribute('data-props')!) as Record<string, unknown>
    expect(props.ageBand).toBe('3-5')
  })

  it('ignores invalid category (passes undefined)', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock([], 0))
    const jsx = await BrowsePage({ searchParams: Promise.resolve({ category: 'invalid_cat' }) })
    render(jsx)
    const props = JSON.parse(screen.getByTestId('browse-client').getAttribute('data-props')!) as Record<string, unknown>
    expect(props.category).toBeUndefined()
  })

  it('ignores invalid age_band (passes undefined)', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock([], 0))
    const jsx = await BrowsePage({ searchParams: Promise.resolve({ age_band: '99-100' }) })
    render(jsx)
    const props = JSON.parse(screen.getByTestId('browse-client').getAttribute('data-props')!) as Record<string, unknown>
    expect(props.ageBand).toBeUndefined()
  })

  it('passes valid language to BrowseClient', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock([], 0))
    const jsx = await BrowsePage({ searchParams: Promise.resolve({ language: 'portuguese' }) })
    render(jsx)
    const props = JSON.parse(screen.getByTestId('browse-client').getAttribute('data-props')!) as Record<string, unknown>
    expect(props.language).toBe('portuguese')
  })

  it('ignores invalid language (passes undefined)', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock([], 0))
    const jsx = await BrowsePage({ searchParams: Promise.resolve({ language: 'klingon' }) })
    render(jsx)
    const props = JSON.parse(screen.getByTestId('browse-client').getAttribute('data-props')!) as Record<string, unknown>
    expect(props.language).toBeUndefined()
  })

  it('shows error state when Supabase returns an error', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock(null, null, { message: 'DB error' }))
    const jsx = await BrowsePage({ searchParams: Promise.resolve({}) })
    render(jsx)
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('handles null data from Supabase (covers data ?? [] fallback)', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock(null, 0))
    const jsx = await BrowsePage({ searchParams: Promise.resolve({}) })
    render(jsx)
    // BrowseClient receives initialVideos=[] when data is null
    const client = screen.getByTestId('browse-client')
    const props = JSON.parse(client.getAttribute('data-props')!) as Record<string, unknown>
    expect(Array.isArray(props.initialVideos)).toBe(true)
    expect((props.initialVideos as unknown[]).length).toBe(0)
  })

  it('handles null count from Supabase (covers count ?? 0 fallback)', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock([], null))
    const jsx = await BrowsePage({ searchParams: Promise.resolve({}) })
    render(jsx)
    const client = screen.getByTestId('browse-client')
    const props = JSON.parse(client.getAttribute('data-props')!) as Record<string, unknown>
    expect(props.totalCount).toBe(0)
  })
})
