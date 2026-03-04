'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/forgot-password')
      } else {
        setSessionChecked(true)
      }
    })
  }, [router, supabase.auth])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!password) {
      setError('Please enter a new password.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSubmitting(false)

    if (updateError) {
      setError('Could not update password. Please request a new reset link.')
      return
    }

    router.push('/')
  }

  if (!sessionChecked) {
    return (
      <div className="py-8 text-center text-warm-400 text-sm animate-pulse">
        Verifying link…
      </div>
    )
  }

  return (
    <>
      <h1 className="font-heading font-bold text-xl text-warm-800 mb-1">
        Set new password
      </h1>
      <p className="text-sm text-warm-500 mb-6">
        Choose a strong password for your account.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-warm-700 mb-1">
            New password
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
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-semibold text-warm-700 mb-1">
            Confirm new password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-800 text-sm focus:outline-none focus:ring-2 focus:ring-peach focus:border-transparent placeholder:text-warm-300"
            placeholder="Repeat your new password"
          />
        </div>

        {error && (
          <p className="text-xs text-rose-500 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full"
        >
          {submitting ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </>
  )
}
