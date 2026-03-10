import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('next-translate/AppDirI18nProvider', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="provider">{children}</div>,
}))

import { I18nProviderWrapper } from '@/components/I18nProviderWrapper'

describe('I18nProviderWrapper', () => {
  it('renders children inside the provider', () => {
    render(
      <I18nProviderWrapper
        lang="en"
        namespaces={{}}
        config={{ defaultNS: 'common', keySeparator: '.' }}
      >
        <span data-testid="child">Child</span>
      </I18nProviderWrapper>
    )
    expect(screen.getByTestId('provider')).toBeInTheDocument()
    expect(screen.getByTestId('child')).toHaveTextContent('Child')
  })
})
