import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ReviewerList from './ReviewerList'
import type { ReviewerRow } from './ReviewerList'

export default async function ManageReviewersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/moderator/reviewers')

  const { data: isMod } = await (
    supabase.rpc('is_moderator')
  ) as unknown as { data: boolean | null }

  if (!isMod) redirect('/reviewer')

  const { data: isAdmin } = await (
    supabase.rpc('is_admin')
  ) as unknown as { data: boolean | null }

  const { data: reviewersRaw } = await (
    supabase
      .from('reviewers')
      .select('id, username, review_count, is_trusted, is_moderator, is_admin')
      .order('review_count', { ascending: false })
  ) as unknown as { data: ReviewerRow[] | null }

  const reviewers = reviewersRaw ?? []

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/moderator" className="text-warm-400 hover:text-warm-600 text-sm">
          ← Dashboard
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-warm-700">Manage Reviewers</h1>
        <p className="text-sm text-warm-500 mt-1">
          {reviewers.length} {reviewers.length === 1 ? 'reviewer' : 'reviewers'} ·{' '}
          {isAdmin ? 'You can promote/demote moderators.' : 'You can grant or revoke Trusted status.'}
        </p>
      </div>

      <ReviewerList initialReviewers={reviewers} currentIsAdmin={!!isAdmin} />
    </div>
  )
}
