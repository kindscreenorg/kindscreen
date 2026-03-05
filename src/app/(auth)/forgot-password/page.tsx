'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/i18n/client'

type State = 'idle' | 'submitting' | 'sent'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const t = useT()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email) {
      setError(t.forgotPw.missingEmail)
      return
    }
    setState('submitting')
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    // Always advance to 'sent' — never confirm whether email exists (prevents enumeration)
    setState('sent')
  }

  if (state === 'sent') {
    return (
      <div className="text-center py-2">
        <div className="text-4xl mb-4">✉️</div>
        <h1 className="font-heading font-bold text-xl text-warm-800 mb-2">
          {t.forgotPw.sentTitle}
        </h1>
        <p className="text-sm text-warm-500 leading-relaxed">
          {t.forgotPw.sentBody}
        </p>
        <p className="mt-6 text-xs text-warm-400">
          <Link href="/login" className="text-peach font-semibold hover:underline">
            {t.forgotPw.backToLogin}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <>
      <h1 className="font-heading font-bold text-xl text-warm-800 mb-1">
        {t.forgotPw.title}
      </h1>
      <p className="text-sm text-warm-500 mb-6">
        {t.forgotPw.subtitle}
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-warm-700 mb-1">
            {t.forgotPw.email}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-800 text-sm focus:outline-none focus:ring-2 focus:ring-peach focus:border-transparent placeholder:text-warm-300"
            placeholder={t.forgotPw.emailPlaceholder}
          />
          {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={state === 'submitting'}
          className="btn-primary w-full"
        >
          {state === 'submitting' ? t.forgotPw.sending : t.forgotPw.sendResetLink}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-warm-500">
        {t.forgotPw.rememberedIt}{' '}
        <Link href="/login" className="text-peach font-semibold hover:underline">
          {t.forgotPw.login}
        </Link>
      </p>
    </>
  )
}
