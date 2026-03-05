'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/i18n/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const t = useT()

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
      setError(t.resetPw.missingPassword)
      return
    }
    if (password.length < 8) {
      setError(t.resetPw.passwordTooShort)
      return
    }
    if (password !== confirm) {
      setError(t.resetPw.passwordMismatch)
      return
    }

    setSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSubmitting(false)

    if (updateError) {
      setError(t.resetPw.updateError)
      return
    }

    router.push('/')
  }

  if (!sessionChecked) {
    return (
      <div className="py-8 text-center text-warm-400 text-sm animate-pulse">
        {t.resetPw.verifyingLink}
      </div>
    )
  }

  return (
    <>
      <h1 className="font-heading font-bold text-xl text-warm-800 mb-1">
        {t.resetPw.title}
      </h1>
      <p className="text-sm text-warm-500 mb-6">
        {t.resetPw.subtitle}
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-warm-700 mb-1">
            {t.resetPw.newPassword}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-800 text-sm focus:outline-none focus:ring-2 focus:ring-peach focus:border-transparent placeholder:text-warm-300"
            placeholder={t.resetPw.passwordPlaceholder}
          />
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-semibold text-warm-700 mb-1">
            {t.resetPw.confirmNewPassword}
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-800 text-sm focus:outline-none focus:ring-2 focus:ring-peach focus:border-transparent placeholder:text-warm-300"
            placeholder={t.resetPw.confirmPlaceholder}
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
          {submitting ? t.resetPw.saving : t.resetPw.updatePassword}
        </button>
      </form>
    </>
  )
}
