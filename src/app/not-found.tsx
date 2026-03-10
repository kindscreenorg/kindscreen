import Link from 'next/link'
import { getT } from '@/lib/i18n/server'

export default async function NotFound() {
  const t = await getT()
  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-lavender-100 shadow-warm-md mb-6">
        <span className="text-4xl" role="img" aria-label="magnifying glass">
          🔍
        </span>
      </div>
      <h1 className="font-heading text-3xl font-bold text-warm-700 mb-3">
        {t.notFound.title}
      </h1>
      <p className="text-warm-500 mb-8 max-w-sm leading-relaxed">
        {t.notFound.body}
      </p>
      <Link href="/" className="btn-primary">
        {t.notFound.backToHome}
      </Link>
    </main>
  )
}
