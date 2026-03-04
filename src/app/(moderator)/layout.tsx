import Link from 'next/link'
import Image from 'next/image'

export default function ModeratorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-cream-200 shadow-warm-sm px-4 h-14 flex items-center justify-between">
        <Link href="/">
          <Image src="/logo.png" alt="KindScreen" width={1536} height={1024} className="h-10 w-auto" priority />
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-200 rounded-full px-3 py-1">
            Moderator
          </span>
          <Link href="/reviewer" className="btn-secondary text-sm py-2 px-4">
            My Dashboard
          </Link>
        </div>
      </nav>
      <main className="min-h-screen bg-cream-50">{children}</main>
    </>
  )
}
