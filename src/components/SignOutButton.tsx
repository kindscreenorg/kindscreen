'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props { label: string; className?: string }

export default function SignOutButton({ label, className }: Props) {
  const router = useRouter()
  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }
  return <button onClick={handleSignOut} className={className}>{label}</button>
}
