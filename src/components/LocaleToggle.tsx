'use client'

import { useRouter } from 'next/navigation'
import type { Locale } from '@/lib/i18n/strings'

export default function LocaleToggle({ current }: { current: Locale }) {
  const router = useRouter()

  async function toggle() {
    const next: Locale = current === 'en' ? 'pt' : 'en'
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: next }),
    })
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      className="text-xs font-semibold text-warm-400 hover:text-warm-600 transition-colors border border-warm-200 rounded-full px-2 py-0.5"
      aria-label={current === 'en' ? 'Switch to Portuguese' : 'Mudar para inglês'}
    >
      {current === 'en' ? 'PT' : 'EN'}
    </button>
  )
}
