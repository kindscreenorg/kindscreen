import Link from 'next/link'
import { getT } from '@/lib/i18n/server'

export default async function SignupConfirmPage() {
  const t = await getT()

  return (
    <div className="text-center py-2">
      <div className="text-4xl mb-4">📬</div>
      <h1 className="font-heading font-bold text-xl text-warm-800 mb-2">
        {t.signupConfirm.title}
      </h1>
      <p className="text-sm text-warm-500 mb-6 leading-relaxed">
        {t.signupConfirm.body}
      </p>
      <p className="text-xs text-warm-400">
        {t.signupConfirm.noEmail}{' '}
        <Link href="/signup" className="text-peach font-semibold hover:underline">
          {t.signupConfirm.tryAgain}
        </Link>
      </p>
    </div>
  )
}
