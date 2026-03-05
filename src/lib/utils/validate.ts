export const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/

export function validate(fields: {
  email: string
  username: string
  password: string
  confirm: string
}): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!fields.email) errors.email = 'Email is required.'
  if (!fields.username) {
    errors.username = 'Username is required.'
  } else if (!USERNAME_REGEX.test(fields.username)) {
    errors.username =
      'Username must be 3–30 characters: lowercase letters, numbers, and underscores only.'
  }
  if (!fields.password) {
    errors.password = 'Password is required.'
  } else if (fields.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }
  if (!fields.confirm) {
    errors.confirm = 'Please confirm your password.'
  } else if (fields.password !== fields.confirm) {
    errors.confirm = 'Passwords do not match.'
  }
  return errors
}
