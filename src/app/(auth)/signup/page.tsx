'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

import { validate, USERNAME_REGEX } from '@/lib/utils/validate'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Track username availability check
  const usernameAvailable = useRef<boolean | null>(null)
  const lastCheckedUsername = useRef('')

  async function checkUsername(value: string) {
    const lower = value.toLowerCase()
    if (!USERNAME_REGEX.test(lower) || lower === lastCheckedUsername.current) return

    lastCheckedUsername.current = lower
    usernameAvailable.current = null

    try {
      const res = await fetch(
        `/api/auth/check-username?username=${encodeURIComponent(lower)}`
      )
      const json = await res.json() as { available?: boolean }
      usernameAvailable.current = json.available ?? null
      if (json.available === false) {
        setFieldErrors((prev) => ({
          ...prev,
          username: 'That username is already taken.',
        }))
      } else {
        setFieldErrors((prev) => {
          const next = { ...prev }
          delete next.username
          return next
        })
      }
    } catch {
      // Network error — allow submit; server will catch collision
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')

    const lower = username.toLowerCase()
    const errors = validate({ email, username: lower, password, confirm })
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    if (usernameAvailable.current === false) {
      setFieldErrors((prev) => ({
        ...prev,
        username: 'That username is already taken.',
      }))
      return
    }

    setSubmitting(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: lower },
      },
    })
    setSubmitting(false)

    if (error) {
      if (error.message.includes('User already registered')) {
        setSubmitError('An account with this email already exists.')
      } else if (error.message.toLowerCase().includes('username')) {
        setFieldErrors((prev) => ({
          ...prev,
          username: 'That username is already taken.',
        }))
      } else {
        setSubmitError('Something went wrong. Please try again.')
      }
      return
    }

    router.push('/signup/confirm')
  }

  return (
    <>
      <h1 className="font-heading font-bold text-xl text-warm-800 mb-1">
        Create your account
      </h1>
      <p className="text-sm text-warm-500 mb-6">
        Join KindScreen as a video reviewer.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-warm-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-800 text-sm focus:outline-none focus:ring-2 focus:ring-peach focus:border-transparent placeholder:text-warm-300"
            placeholder="you@example.com"
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-rose-500">{fieldErrors.email}</p>
          )}
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-semibold text-warm-700 mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => {
              const val = e.target.value.toLowerCase()
              setUsername(val)
              usernameAvailable.current = null
            }}
            onBlur={(e) => checkUsername(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-800 text-sm focus:outline-none focus:ring-2 focus:ring-peach focus:border-transparent placeholder:text-warm-300"
            placeholder="cool_parent_42"
          />
          {fieldErrors.username ? (
            <p className="mt-1 text-xs text-rose-500">{fieldErrors.username}</p>
          ) : (
            <p className="mt-1 text-xs text-warm-400">
              3–30 chars: lowercase letters, numbers, underscores.
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-warm-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-800 text-sm focus:outline-none focus:ring-2 focus:ring-peach focus:border-transparent placeholder:text-warm-300"
            placeholder="At least 8 characters"
          />
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-rose-500">{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirm" className="block text-sm font-semibold text-warm-700 mb-1">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-800 text-sm focus:outline-none focus:ring-2 focus:ring-peach focus:border-transparent placeholder:text-warm-300"
            placeholder="Repeat your password"
          />
          {fieldErrors.confirm && (
            <p className="mt-1 text-xs text-rose-500">{fieldErrors.confirm}</p>
          )}
        </div>

        {submitError && (
          <p className="text-xs text-rose-500 text-center">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full mt-2"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-warm-500">
        Already have an account?{' '}
        <Link href="/login" className="text-peach font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </>
  )
}
