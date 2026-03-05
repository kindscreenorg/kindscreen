import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import LocaleToggle from '@/components/LocaleToggle'

const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('LocaleToggle', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockRefresh.mockReset()
    mockFetch.mockResolvedValue({ ok: true })
  })

  it('shows "PT" button when current locale is en', () => {
    render(<LocaleToggle current="en" />)
    expect(screen.getByRole('button', { name: /switch to portuguese/i })).toBeInTheDocument()
    expect(screen.getByText('PT')).toBeInTheDocument()
  })

  it('shows "EN" button when current locale is pt', () => {
    render(<LocaleToggle current="pt" />)
    expect(screen.getByRole('button', { name: /mudar para inglês/i })).toBeInTheDocument()
    expect(screen.getByText('EN')).toBeInTheDocument()
  })

  it('calls /api/locale with pt and refreshes when clicked from en', async () => {
    const user = userEvent.setup()
    render(<LocaleToggle current="en" />)
    await user.click(screen.getByRole('button'))
    expect(mockFetch).toHaveBeenCalledWith('/api/locale', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ locale: 'pt' }),
    }))
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('calls /api/locale with en and refreshes when clicked from pt', async () => {
    const user = userEvent.setup()
    render(<LocaleToggle current="pt" />)
    await user.click(screen.getByRole('button'))
    expect(mockFetch).toHaveBeenCalledWith('/api/locale', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ locale: 'en' }),
    }))
    expect(mockRefresh).toHaveBeenCalled()
  })
})
