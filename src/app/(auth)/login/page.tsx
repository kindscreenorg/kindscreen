import { Suspense } from 'react'
import LoginForm from './LoginForm'

// LoginForm uses useSearchParams(), which requires a Suspense boundary (Next.js 15)
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-warm-100 rounded w-2/3" />
      <div className="h-4 bg-warm-100 rounded w-1/2" />
      <div className="h-10 bg-warm-100 rounded-xl" />
      <div className="h-10 bg-warm-100 rounded-xl" />
      <div className="h-10 bg-peach-100 rounded-2xl" />
    </div>
  )
}
