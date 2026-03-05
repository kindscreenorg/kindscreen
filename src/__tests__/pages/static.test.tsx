import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

import NotFound from '@/app/not-found'
import HomePage from '@/app/page'
import SignupConfirmPage from '@/app/(auth)/signup/confirm/page'

describe('NotFound page', () => {
  it('renders the 404 page with link back to home', () => {
    render(<NotFound />)
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
