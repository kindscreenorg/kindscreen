import Link from 'next/link'
import Image from 'next/image'
import { getT } from '@/lib/i18n/server'
import Footer from '@/components/Footer'

export default async function HomePage() {
  const t = await getT()

  return (
    <>
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-16">
      {/* Brand */}
      <div className="mb-8 text-center">
        <Image
          src="/logo.png"
          alt="KindScreen — Safe Videos for Kids"
          width={1536}
          height={1024}
          className="h-36 w-auto mx-auto"
          priority
        />
      </div>

      {/* Hero copy */}
      <div className="max-w-md text-center mb-10">
        <p className="text-warm-600 text-base leading-relaxed">
          {t.home.tagline}
        </p>
      </div>

      {/* Status */}
      <div className="card-warm inline-block mb-10 text-center">
        <p className="text-sm text-warm-500 font-medium">
          {t.home.comingSoon}
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
        <Link href="/browse" className="btn-primary text-center">
          {t.home.browseVideos}
        </Link>
        <Link href="/signup" className="btn-secondary text-center">
          {t.home.becomeReviewer}
        </Link>
        <Link href="/donate" className="btn-secondary text-center">
          {t.home.supportProject}
        </Link>
        <Link href="/login" className="btn-secondary text-center">
          {t.home.login}
        </Link>
      </div>

      {/* Disclaimer */}
      <p className="mt-16 text-xs text-warm-300 text-center max-w-sm leading-relaxed">
        {t.home.disclaimer}
      </p>
    </main>
    <Footer />
    </>
  )
}
