// @vitest-environment node
// Tests the SSR guard (typeof window === 'undefined') which only runs outside jsdom
import { describe, it, expect, vi } from 'vitest'
import { loadYTApi } from '@/lib/utils/youtube'

describe('loadYTApi in SSR (Node.js) environment', () => {
  it('returns immediately when window is undefined (SSR guard)', () => {
    const onReady = vi.fn()
    loadYTApi(onReady)
    // In Node.js, typeof window === 'undefined', so the function returns early
    expect(onReady).not.toHaveBeenCalled()
  })
})
