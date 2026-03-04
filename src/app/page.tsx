import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-16">
      {/* Brand */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-peach shadow-warm-md mb-4">
          <span className="text-4xl" role="img" aria-label="screen with heart">
            📺
          </span>
        </div>
        <h1 className="font-heading text-4xl font-bold text-warm-700 tracking-tight">
          KindScreen
        </h1>
        <p className="mt-2 text-lg text-warm-400 font-medium">
          Parent-reviewed. Kid-approved.
        </p>
      </div>

      {/* Hero copy */}
      <div className="max-w-md text-center mb-10">
        <p className="text-warm-600 text-base leading-relaxed">
          A community-curated catalog of YouTube videos safe for children aged 3–12.
          Watched by real parents. Verified by consensus. Zero surprises.
        </p>
      </div>

      {/* Status */}
      <div className="card-warm inline-block mb-10 text-center">
        <p className="text-sm text-warm-500 font-medium">
          🚧 Coming soon — we&apos;re building this in public
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
        <Link href="/browse" className="btn-primary text-center">
          Browse Videos
        </Link>
        <Link href="/signup" className="btn-secondary text-center">
          Become a Reviewer
        </Link>
        <Link href="/donate" className="btn-secondary text-center">
          Support the project
        </Link>
      </div>

      {/* Disclaimer */}
      <p className="mt-16 text-xs text-warm-300 text-center max-w-sm leading-relaxed">
        Age bands are suggested by real parents and are a guide, not a guarantee.
        Every child is different — you know yours best.
      </p>
    </main>
  )
}
