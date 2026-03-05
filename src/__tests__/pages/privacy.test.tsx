import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Unmock server so PrivacyPage calls real getLocale (which is mocked via i18n/server mock)
// The global mock in vitest.setup.ts returns 'en' for getLocale

import PrivacyPage from '@/app/(public)/privacy/page'

describe('PrivacyPage', () => {
  it('renders EN privacy policy when locale is en', async () => {
    const jsx = await PrivacyPage()
    render(jsx as React.ReactElement)
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    expect(screen.getByText(/strictly necessary cookies/i)).toBeInTheDocument()
    expect(screen.getByText(/Last updated: March 2026/i)).toBeInTheDocument()
  })

  it('renders PT privacy policy when locale is pt', async () => {
    // Override the global getLocale mock for this test
    const serverMod = await import('@/lib/i18n/server')
    vi.mocked(serverMod.getLocale).mockResolvedValueOnce('pt')

    const jsx = await PrivacyPage()
    render(jsx as React.ReactElement)
    expect(screen.getByText('Política de Privacidade')).toBeInTheDocument()
    expect(screen.getByText(/cookies estritamente necessários/i)).toBeInTheDocument()
  })
})
