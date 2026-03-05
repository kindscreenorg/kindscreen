import { describe, it, expect, vi } from 'vitest'

// Bypass the global Footer mock so we test the real implementation
vi.unmock('@/components/Footer')
import { render, screen } from '@testing-library/react'
import React from 'react'
import { strings } from '@/lib/i18n/strings'

// Mock LocaleToggle so Footer can be rendered without next/navigation
vi.mock('@/components/LocaleToggle', () => ({
  default: ({ current }: { current: string }) =>
    React.createElement('button', { 'data-testid': 'locale-toggle' }, current === 'en' ? 'PT' : 'EN'),
}))

import Footer from '@/components/Footer'

describe('Footer', () => {
  it('renders EN footer text', async () => {
    const jsx = await Footer()
    render(jsx as React.ReactElement)
    expect(screen.getByText(strings.en.footer.madeWith)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: strings.en.footer.privacy })).toBeInTheDocument()
    expect(screen.getByTestId('locale-toggle')).toBeInTheDocument()
  })
})
