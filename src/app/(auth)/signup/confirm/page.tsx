import Link from 'next/link'

export default function SignupConfirmPage() {
  return (
    <div className="text-center py-2">
      <div className="text-4xl mb-4">📬</div>
      <h1 className="font-heading font-bold text-xl text-warm-800 mb-2">
        Check your inbox
      </h1>
      <p className="text-sm text-warm-500 mb-6 leading-relaxed">
        We sent a confirmation link to your email address. Click the link to
        activate your account — it expires in 24 hours.
      </p>
      <p className="text-xs text-warm-400">
        Didn&apos;t receive it?{' '}
        <Link href="/signup" className="text-peach font-semibold hover:underline">
          Try signing up again
        </Link>
      </p>
    </div>
  )
}
