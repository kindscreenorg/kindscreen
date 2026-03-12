import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getT } from '@/lib/i18n/server'
import Footer from '@/components/Footer'
import NavUser from '@/components/NavUser'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getT()

  let username: string | null = null
  if (user) {
    const { data } = await (
      supabase.from('reviewers').select('username').eq('id', user.id).single()
    ) as unknown as { data: { username: string } | null }
    username = data?.username ?? user.email?.split('@')[0] ?? 'you'
  }

  return (
    <>
      <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-cream-200 shadow-warm-sm px-4 h-14 flex items-center justify-between">
        <Link href="/">
          <Image src="/logo.png" alt="KindScreen" width={1536} height={1024} className="h-10 w-auto" priority />
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <NavUser
              username={username!}
              greeting={t.nav.greeting.replace('{username}', username!)}
              signOutLabel={t.nav.signOut}
            />
          ) : (
            <Link href="/signup" className="btn-secondary text-sm py-2 px-4">
              {t.nav.becomeReviewer}
            </Link>
          )}
        </div>
      </nav>
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  )
}
