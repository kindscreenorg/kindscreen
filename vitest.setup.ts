import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Mock next/font/google — avoids network requests in tests
vi.mock('next/font/google', () => ({
  Nunito: () => ({ variable: '--font-nunito', className: 'nunito' }),
  Poppins: () => ({ variable: '--font-poppins', className: 'poppins' }),
}))

// Mock next/image — render a plain <img> in jsdom
vi.mock('next/image', () => ({
  default: ({ src, alt, fill: _fill, sizes: _sizes, priority: _priority, unoptimized: _u, ...rest }: {
    src: string
    alt: string
    fill?: boolean
    sizes?: string
    priority?: boolean
    unoptimized?: boolean
    [key: string]: unknown
  }) => React.createElement('img', { src, alt, ...rest }),
}))

// Mock next/link — render a plain <a> in jsdom
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement('a', { href, ...rest }, children),
}))
