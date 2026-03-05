import { describe, it, expect } from 'vitest'
import { computeBadges } from '@/lib/utils/badges'

describe('computeBadges', () => {
  it('returns exactly 5 badges', () => {
    const badges = computeBadges(0, false)
    expect(badges).toHaveLength(5)
  })

  it('earns no badges at 0 reviews and not trusted', () => {
    const badges = computeBadges(0, false)
    expect(badges.every((b) => !b.earned)).toBe(true)
  })

  it('earns first_review badge at 1 review', () => {
    const badges = computeBadges(1, false)
    const badge = badges.find((b) => b.id === 'first_review')!
    expect(badge.earned).toBe(true)
  })

  it('does not earn ten_reviews badge at 9 reviews', () => {
    const badges = computeBadges(9, false)
    const badge = badges.find((b) => b.id === 'ten_reviews')!
    expect(badge.earned).toBe(false)
  })

  it('earns ten_reviews badge at 10 reviews', () => {
    const badges = computeBadges(10, false)
    const badge = badges.find((b) => b.id === 'ten_reviews')!
    expect(badge.earned).toBe(true)
  })

  it('earns fifty_reviews badge at 50 reviews', () => {
    const badges = computeBadges(50, false)
    const badge = badges.find((b) => b.id === 'fifty_reviews')!
    expect(badge.earned).toBe(true)
  })

  it('earns century badge at 100 reviews', () => {
    const badges = computeBadges(100, false)
    const badge = badges.find((b) => b.id === 'century')!
    expect(badge.earned).toBe(true)
  })

  it('does not earn century badge at 99 reviews', () => {
    const badges = computeBadges(99, false)
    const badge = badges.find((b) => b.id === 'century')!
    expect(badge.earned).toBe(false)
  })

  it('earns trusted badge when isTrusted is true', () => {
    const badges = computeBadges(0, true)
    const badge = badges.find((b) => b.id === 'trusted')!
    expect(badge.earned).toBe(true)
  })

  it('does not earn trusted badge when isTrusted is false', () => {
    const badges = computeBadges(100, false)
    const badge = badges.find((b) => b.id === 'trusted')!
    expect(badge.earned).toBe(false)
  })

  it('earns all threshold badges at 100 reviews and trusted', () => {
    const badges = computeBadges(100, true)
    expect(badges.every((b) => b.earned)).toBe(true)
  })

  it('includes required badge fields', () => {
    const badges = computeBadges(0, false)
    for (const badge of badges) {
      expect(badge).toHaveProperty('id')
      expect(badge).toHaveProperty('emoji')
      expect(badge).toHaveProperty('label')
      expect(badge).toHaveProperty('description')
      expect(badge).toHaveProperty('earned')
    }
  })
})
