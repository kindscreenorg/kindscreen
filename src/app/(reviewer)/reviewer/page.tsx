import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

import { computeBadges } from '@/lib/utils/badges'
import type { Badge } from '@/lib/utils/badges'

export default async function ReviewerDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/reviewer')

  // Reviewer profile — cast needed for supabase-js v2.98 type inference
  const { data: reviewer } = await (
    supabase
      .from('reviewers')
      .select('username, review_count, reputation_score, is_trusted, is_moderator')
      .eq('id', user.id)
      .single()
  ) as unknown as {
    data: {
      username: string
      review_count: number
      reputation_score: number
      is_trusted: boolean
      is_moderator: boolean
    } | null
  }

  // My reviews — cast needed for supabase-js v2.98 type inference
  const { data: myReviewsRaw } = await supabase
    .from('reviews')
    .select('video_id, verdict')
    .eq('reviewer_id', user.id)

  const myReviews = myReviewsRaw as unknown as Array<{ video_id: string; verdict: string }> | null

  const totalReviews = myReviews?.length ?? 0
  const approveCount = myReviews?.filter((r) => r.verdict === 'approve').length ?? 0
  const approvalRate = totalReviews > 0 ? Math.round((approveCount / totalReviews) * 100) : null

  // Impact: approved videos I contributed a review to
  const reviewedVideoIds = myReviews?.map((r) => r.video_id) ?? []
  let impactCount = 0
  if (reviewedVideoIds.length > 0) {
    const { count } = await supabase
      .from('videos')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .in('id', reviewedVideoIds)
    impactCount = count ?? 0
  }

  // Queue: pending videos not submitted by me and not already reviewed
  let queueQuery = supabase
    .from('videos')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
  if (reviewedVideoIds.length > 0) {
    queueQuery = queueQuery.not('id', 'in', `(${reviewedVideoIds.join(',')})`)
  }
  const { count: queueCount } = await queueQuery

  const username = reviewer?.username ?? 'Reviewer'
  const reviewCount = reviewer?.review_count ?? 0
  const isTrusted = reviewer?.is_trusted ?? false
  const isModerator = reviewer?.is_moderator ?? false
  const badges = computeBadges(reviewCount, isTrusted)
  const earnedBadges = badges.filter((b) => b.earned)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Welcome */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-warm-700">
          👋 Welcome back, {username}
        </h1>
        {isTrusted && (
          <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-0.5">
            ⭐ Trusted Reviewer
          </span>
        )}
      </div>

      {/* Impact banner */}
      {impactCount > 0 && (
        <div className="bg-sage-100 border border-sage-200 rounded-2xl px-5 py-4">
          <p className="text-sage-700 font-semibold text-sm">
            🛡️ Your reviews have helped protect kids watching{' '}
            <span className="text-lg font-bold">{impactCount}</span>{' '}
            {impactCount === 1 ? 'approved video' : 'approved videos'}.
          </p>
          <p className="text-sage-600 text-xs mt-0.5">Thank you for keeping KindScreen safe.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-warm text-center">
          <p className="font-heading text-3xl font-bold text-warm-700">{reviewCount}</p>
          <p className="text-xs text-warm-500 mt-1">Reviews done</p>
        </div>
        <div className="card-warm text-center">
          <p className="font-heading text-3xl font-bold text-warm-700">
            {approvalRate !== null ? `${approvalRate}%` : '—'}
          </p>
          <p className="text-xs text-warm-500 mt-1">Approval rate</p>
        </div>
        <div className="card-warm text-center">
          <p className="font-heading text-3xl font-bold text-warm-700">
            {reviewer?.reputation_score ?? 0}
          </p>
          <p className="text-xs text-warm-500 mt-1">Reputation</p>
        </div>
      </div>

      {/* Review queue CTA */}
      <div className="card-warm flex items-center justify-between gap-4">
        <div>
          <p className="font-heading font-semibold text-warm-800">
            {queueCount
              ? `${queueCount} ${queueCount === 1 ? 'video' : 'videos'} waiting for review`
              : 'Queue is empty right now'}
          </p>
          <p className="text-xs text-warm-400 mt-0.5">
            {queueCount
              ? 'Each review brings a video one step closer to the catalog.'
              : 'Check back later or submit a new video.'}
          </p>
        </div>
        <Link
          href="/reviewer/review"
          className={`btn-primary shrink-0 text-sm py-2 px-4 ${!queueCount ? 'opacity-50 pointer-events-none' : ''}`}
          aria-disabled={!queueCount}
        >
          Review now
        </Link>
      </div>

      {/* Badges */}
      <div>
        <h2 className="font-heading font-semibold text-warm-700 mb-3">
          Badges{earnedBadges.length > 0 && ` · ${earnedBadges.length}/${badges.length} earned`}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`card-warm flex flex-col items-center text-center gap-1 py-4 transition-opacity ${
                badge.earned ? '' : 'opacity-40'
              }`}
            >
              <span className="text-3xl">{badge.emoji}</span>
              <p className={`text-sm font-semibold ${badge.earned ? 'text-warm-700' : 'text-warm-500'}`}>
                {badge.label}
              </p>
              <p className="text-xs text-warm-400 leading-tight">{badge.description}</p>
              {badge.earned && (
                <span className="text-xs font-bold text-sage-600 mt-0.5">✓ Earned</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="flex gap-3">
        <Link href="/reviewer/submit" className="btn-secondary text-sm py-2 px-4 flex-1 text-center">
          + Submit a Video
        </Link>
        <Link href="/browse" className="btn-secondary text-sm py-2 px-4 flex-1 text-center">
          Browse catalog
        </Link>
      </div>

      {/* Moderator access */}
      {isModerator && (
        <div className="border-t border-warm-100 pt-4">
          <Link href="/moderator" className="btn-secondary text-sm py-2 px-4 w-full text-center block">
            Moderator Dashboard
          </Link>
        </div>
      )}

    </div>
  )
}
