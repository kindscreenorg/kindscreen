import { describe, it, expect } from 'vitest'
import { progressPercent, MILESTONES } from '@/lib/utils/donation'

describe('progressPercent', () => {
  it('returns 100 when target is 0', () => {
    expect(progressPercent(0, 0)).toBe(100)
  })

  it('returns 0 when current is 0 and target > 0', () => {
    expect(progressPercent(0, 200)).toBe(0)
  })

  it('returns 50 for half progress', () => {
    expect(progressPercent(100, 200)).toBe(50)
  })

  it('returns 100 when current equals target', () => {
    expect(progressPercent(200, 200)).toBe(100)
  })

  it('clamps to 100 when over target', () => {
    expect(progressPercent(300, 200)).toBe(100)
  })

  it('rounds to nearest integer', () => {
    expect(progressPercent(1, 3)).toBe(33)
    expect(progressPercent(2, 3)).toBe(67)
  })
})

describe('MILESTONES', () => {
  it('has exactly 3 milestones', () => {
    expect(MILESTONES).toHaveLength(3)
  })

  it('first milestone is launch with amount 0', () => {
    expect(MILESTONES[0].id).toBe('launch')
    expect(MILESTONES[0].amount).toBe(0)
    expect(MILESTONES[0].reached).toBe(true)
  })

  it('second milestone is whisper with amount 200', () => {
    expect(MILESTONES[1].id).toBe('whisper')
    expect(MILESTONES[1].amount).toBe(200)
  })

  it('third milestone is ai_vision with amount 500', () => {
    expect(MILESTONES[2].id).toBe('ai_vision')
    expect(MILESTONES[2].amount).toBe(500)
  })

  it('each milestone has required fields', () => {
    for (const m of MILESTONES) {
      expect(m).toHaveProperty('id')
      expect(m).toHaveProperty('emoji')
      expect(m).toHaveProperty('amount')
      expect(m).toHaveProperty('label')
      expect(m).toHaveProperty('description')
    }
  })
})
