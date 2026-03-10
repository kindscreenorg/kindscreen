import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { strings } from '@/lib/i18n/strings'

vi.mock('@/lib/i18n/server', () => ({
  getT: vi.fn(),
}))

import { ServerTrans } from '@/lib/i18n/ServerTrans'
import { getT } from '@/lib/i18n/server'

const mockedGetT = vi.mocked(getT)

describe('ServerTrans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders string value for i18n key', async () => {
    mockedGetT.mockResolvedValue(strings.en)
    const element = await ServerTrans({ i18nKey: 'reviewPage.manageReviewersAdmin' })
    render(element as React.ReactElement)
    expect(screen.getByText('You can promote/demote moderators.')).toBeInTheDocument()
  })

  it('renders i18nKey when key is missing or not a string', async () => {
    mockedGetT.mockResolvedValue(strings.en)
    const element = await ServerTrans({ i18nKey: 'missing.key.here' })
    render(element as React.ReactElement)
    expect(screen.getByText('missing.key.here')).toBeInTheDocument()
  })

  it('replaces tags with component content when components provided', async () => {
    mockedGetT.mockResolvedValue(strings.en)
    const element = await ServerTrans({
      i18nKey: 'auth.termsAndPrivacy',
      components: {
        terms: <a href="/privacy">Terms and Privacy Policy</a>,
      },
    })
    render(element as React.ReactElement)
    const link = screen.getByRole('link', { name: /terms and privacy policy/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/privacy')
  })

  it('renders raw content for unknown tags when no component provided', async () => {
    mockedGetT.mockResolvedValue({ auth: { termsAndPrivacy: 'Accept our <terms>Terms</terms>.' } } as never)
    const element = await ServerTrans({ i18nKey: 'auth.termsAndPrivacy' })
    render(element as React.ReactElement)
    expect(screen.getByText(/accept our terms\./i)).toBeInTheDocument()
  })

  it('handles self-closing tag with component (pairedContent undefined)', async () => {
    mockedGetT.mockResolvedValue({ test: { line: 'Before <sep /> after' } } as never)
    const element = await ServerTrans({
      i18nKey: 'test.line',
      components: { sep: <span data-testid="sep" /> },
    })
    render(element as React.ReactElement)
    expect(screen.getByText(/Before/)).toBeInTheDocument()
    expect(screen.getByTestId('sep')).toBeInTheDocument()
    expect(screen.getByText(/after/)).toBeInTheDocument()
  })

  it('skips pushing when tag has no component and pairedContent is undefined (self-closing)', async () => {
    mockedGetT.mockResolvedValue({ test: { line: 'Text <hr /> more' } } as never)
    const element = await ServerTrans({ i18nKey: 'test.line' })
    render(element as React.ReactElement)
    expect(screen.getByText(/Text/)).toBeInTheDocument()
    expect(screen.getByText(/more/)).toBeInTheDocument()
  })

  it('does not push when before is empty (string starts with tag)', async () => {
    mockedGetT.mockResolvedValue({ test: { line: '<x>only</x>' } } as never)
    const element = await ServerTrans({
      i18nKey: 'test.line',
      components: { x: <span data-testid="x">placeholder</span> },
    })
    render(element as React.ReactElement)
    expect(screen.getByTestId('x')).toHaveTextContent('only')
  })
})
