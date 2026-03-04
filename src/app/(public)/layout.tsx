import Link from 'next/link'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-cream-200 shadow-warm-sm px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-heading font-bold text-warm-700 text-lg flex items-center gap-2">
          <span role="img" aria-label="screen with heart">📺</span>
          KindScreen
        </Link>
        <Link href="/signup" className="btn-secondary text-sm py-2 px-4">
          Become a Reviewer
        </Link>
      </nav>
      <main className="min-h-screen">{children}</main>
    </>
  )
}
