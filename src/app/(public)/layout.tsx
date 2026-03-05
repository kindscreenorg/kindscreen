import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-cream-200 shadow-warm-sm px-4 h-14 flex items-center justify-between">
        <Link href="/">
          <Image src="/logo.png" alt="KindScreen" width={1536} height={1024} className="h-10 w-auto" priority />
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <Link href="/reviewer" className="btn-secondary text-sm py-2 px-4">
              Dashboard
            </Link>
          ) : (
            <Link href="/signup" className="btn-secondary text-sm py-2 px-4">
              Become a Reviewer
            </Link>
          )}
        </div>
      </nav>
      <main className="min-h-screen">{children}</main>
    </>
  )
}
