import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { strings } from '@/lib/i18n/strings'

vi.mock('@/lib/i18n/server', () => ({ getT: vi.fn().mockResolvedValue(strings.en) }))

import NotFound from '@/app/not-found'
import HomePage from '@/app/page'
import SignupConfirmPage from '@/app/(auth)/signup/confirm/page'

describe('NotFound page', () => {
  it('renders the 404 page with link back to home', async () => {
    const jsx = await NotFound()
    render(jsx as React.ReactElement)
    expect(screen.getByText(/page not found/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to kindscreen/i })).toBeInTheDocument()
  })
})

describe('HomePage', () => {
  it('renders the landing page with browse and signup links', async () => {
    const jsx = await HomePage()
    render(jsx as React.ReactElement)
    expect(screen.getByRole('link', { name: /browse videos/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /become a reviewer/i })).toBeInTheDocument()
  })
})

describe('SignupConfirmPage', () => {
  it('renders the email confirmation page', async () => {
    const jsx = await SignupConfirmPage()
    render(jsx as React.ReactElement)
    expect(screen.getByText(/check your inbox/i)).toBeInTheDocument()
    expect(screen.getByText(/confirmation link/i)).toBeInTheDocument()
  })
})
