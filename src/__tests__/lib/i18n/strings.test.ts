import { describe, it, expect } from 'vitest'
import { strings } from '@/lib/i18n/strings'

describe('strings', () => {
  it('has en and pt locales', () => {
    expect(strings.en).toBeDefined()
    expect(strings.pt).toBeDefined()
  })

  it('en and pt have the same keys at every level', () => {
    function checkKeys(en: Record<string, unknown>, pt: Record<string, unknown>, path = '') {
      for (const key of Object.keys(en)) {
        const fullPath = path ? `${path}.${key}` : key
        expect(pt, `pt missing key: ${fullPath}`).toHaveProperty(key)
        if (typeof en[key] === 'object' && en[key] !== null) {
          checkKeys(
            en[key] as Record<string, unknown>,
            pt[key] as Record<string, unknown>,
            fullPath
          )
        } else {
          expect(typeof pt[key], `pt.${fullPath} should be string`).toBe('string')
        }
      }
    }
    checkKeys(strings.en as unknown as Record<string, unknown>, strings.pt as unknown as Record<string, unknown>)
  })

  it('en strings are non-empty', () => {
    function checkNonEmpty(obj: Record<string, unknown>, path = '') {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key
        if (typeof value === 'object' && value !== null) {
          checkNonEmpty(value as Record<string, unknown>, fullPath)
        } else {
          expect(String(value).length, `en.${fullPath} should not be empty`).toBeGreaterThan(0)
        }
      }
    }
    checkNonEmpty(strings.en as unknown as Record<string, unknown>)
  })

  it('pt strings are non-empty', () => {
    function checkNonEmpty(obj: Record<string, unknown>, path = '') {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key
        if (typeof value === 'object' && value !== null) {
          checkNonEmpty(value as Record<string, unknown>, fullPath)
        } else {
          expect(String(value).length, `pt.${fullPath} should not be empty`).toBeGreaterThan(0)
        }
      }
    }
    checkNonEmpty(strings.pt as unknown as Record<string, unknown>)
  })
})
