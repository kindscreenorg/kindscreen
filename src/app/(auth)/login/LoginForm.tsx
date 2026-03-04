'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Show a generic error if the callback redirected here with ?error=
  const callbackError = searchParams.get('error')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setSubmitting(true)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setSubmitting(false)

    if (authError) {
      // Never distinguish between bad email / bad password — prevents user enumeration
      setError('Incorrect email or password.')
      return
    }

    const next = searchParams.get('next')
    const safeNext = next?.startsWith('/') ? next : '/'
    router.push(safeNext)
    router.refresh()
  }

  return (
    <>
      <h1 className="font-heading font-bold text-xl text-warm-800 mb-1">
        Welcome back
      </h1>
      <p className="text-sm text-warm-500 mb-6">Log in to your KindScreen account.</p>

      {callbackError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600">
          Something went wrong. Please try logging in again.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-semibold text-warm-700">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-peach hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-800 text-sm focus:outline-none focus:ring-2 focus:ring-peach focus:border-transparent placeholder:text-warm-300"
            placeholder="Your password"
          />
        </div>

        {error && (
          <p className="text-xs text-rose-500 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full mt-2"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-warm-500">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-peach font-semibold hover:underline">
          Sign up
        </Link>
      </p>
    </>
  )
}
