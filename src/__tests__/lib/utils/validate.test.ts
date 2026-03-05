import { describe, it, expect } from 'vitest'
import { validate, USERNAME_REGEX } from '@/lib/utils/validate'

describe('USERNAME_REGEX', () => {
  it('accepts valid usernames', () => {
    expect(USERNAME_REGEX.test('abc')).toBe(true)
    expect(USERNAME_REGEX.test('cool_parent_42')).toBe(true)
    expect(USERNAME_REGEX.test('a'.repeat(30))).toBe(true)
  })

  it('rejects usernames with uppercase letters', () => {
    expect(USERNAME_REGEX.test('CoolParent')).toBe(false)
  })

  it('rejects usernames shorter than 3 characters', () => {
    expect(USERNAME_REGEX.test('ab')).toBe(false)
  })

  it('rejects usernames longer than 30 characters', () => {
    expect(USERNAME_REGEX.test('a'.repeat(31))).toBe(false)
  })

  it('rejects usernames with special characters', () => {
    expect(USERNAME_REGEX.test('user@name')).toBe(false)
    expect(USERNAME_REGEX.test('user-name')).toBe(false)
  })
})

describe('validate', () => {
  const validFields = {
    email: 'user@example.com',
    username: 'valid_user',
    password: 'Password123',
    confirm: 'Password123',
  }

  it('returns empty errors for valid fields', () => {
    expect(validate(validFields)).toEqual({})
  })

  it('returns email error when email is empty', () => {
    const errors = validate({ ...validFields, email: '' })
    expect(errors.email).toBe('Email is required.')
  })

  it('returns username error when username is empty', () => {
    const errors = validate({ ...validFields, username: '' })
    expect(errors.username).toBe('Username is required.')
  })

  it('returns username format error for invalid username', () => {
    const errors = validate({ ...validFields, username: 'BAD USER!' })
    expect(errors.username).toMatch(/3–30 characters/)
  })

  it('returns password error when password is empty', () => {
    const errors = validate({ ...validFields, password: '', confirm: '' })
    expect(errors.password).toBe('Password is required.')
  })

  it('returns password length error for short password', () => {
    const errors = validate({ ...validFields, password: 'short', confirm: 'short' })
    expect(errors.password).toBe('Password must be at least 8 characters.')
  })

  it('returns confirm error when confirm is empty', () => {
    const errors = validate({ ...validFields, confirm: '' })
    expect(errors.confirm).toBe('Please confirm your password.')
  })

  it('returns mismatch error when passwords do not match', () => {
    const errors = validate({ ...validFields, confirm: 'Different123' })
    expect(errors.confirm).toBe('Passwords do not match.')
  })

  it('can return multiple errors at once', () => {
    const errors = validate({ email: '', username: '', password: '', confirm: '' })
    expect(Object.keys(errors).length).toBeGreaterThan(1)
  })
})
