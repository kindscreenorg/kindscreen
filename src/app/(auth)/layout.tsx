import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8">
        <Link href="/">
          <Image src="/logo.png" alt="KindScreen" width={1536} height={1024} className="h-20 w-auto" priority />
        </Link>
      </div>

      {/* Form card */}
      <div className="card-warm w-full max-w-sm">
        {children}
      </div>

      {/* Legal footer */}
      <p className="mt-6 text-xs text-warm-400 text-center max-w-xs">
        By using KindScreen you agree to our{' '}
        <span className="underline cursor-pointer">Terms</span> and{' '}
        <span className="underline cursor-pointer">Privacy Policy</span>.
      </p>
    </div>
  )
}
