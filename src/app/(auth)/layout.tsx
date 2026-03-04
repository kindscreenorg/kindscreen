import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-peach flex items-center justify-center shadow-warm-md">
          <span className="text-2xl" role="img" aria-label="KindScreen">📺</span>
        </div>
        <span className="font-heading font-bold text-2xl text-warm-800 tracking-tight">
          KindScreen
        </span>
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
