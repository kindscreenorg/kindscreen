import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { strings } from '@/lib/i18n/strings'

// Unmock the client module so we test the real implementation
vi.unmock('@/lib/i18n/client')

import { LocaleProvider, useT } from '@/lib/i18n/client'

function Consumer() {
  const t = useT()
  return <div data-testid="value">{t.nav.becomeReviewer}</div>
}

describe('LocaleProvider + useT', () => {
  it('provides EN strings to children', () => {
    render(
      <LocaleProvider t={strings.en}>
        <Consumer />
      </LocaleProvider>
    )
    expect(screen.getByTestId('value')).toHaveTextContent('Become a Reviewer')
  })

  it('provides PT strings to children', () => {
    render(
      <LocaleProvider t={strings.pt}>
        <Consumer />
      </LocaleProvider>
    )
    expect(screen.getByTestId('value')).toHaveTextContent('Seja um Revisor')
  })

  it('throws when useT is called outside LocaleProvider', () => {
    const original = console.error
    console.error = vi.fn() // suppress React error boundary noise
    expect(() => render(<Consumer />)).toThrow('useT must be used inside LocaleProvider')
    console.error = original
  })
})
