import { createAdminClient } from '@/lib/supabase/admin'
import { progressPercent, MILESTONES } from '@/lib/utils/donation'
import { getT } from '@/lib/i18n/server'

export default async function DonatePage() {
  const supabase = createAdminClient()
  const t = await getT()

  const [
    { count: approvedVideos },
    { count: reviewerCount },
    { count: reviewCount },
  ] = await Promise.all([
    supabase.from('videos').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('reviewers').select('id', { count: 'exact', head: true }),
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
  ])

  const monthlyDonation = Number(process.env.MONTHLY_DONATION_EUR ?? '0')

  const milestones = MILESTONES.map((m) => ({
    ...m,
    reached: m.amount === 0 || monthlyDonation >= m.amount,
    progress: progressPercent(monthlyDonation, m.amount),
  }))

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-12">

      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="font-heading text-3xl font-bold text-warm-800">
          {t.donate.title}
        </h1>
        <p className="text-warm-500 text-base max-w-md mx-auto">
          {t.donate.subtitle}
        </p>
        <a
          href="https://github.com/sponsors/felipeamarante"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-block mt-2"
        >
          {t.donate.sponsorGitHub}
        </a>
      </div>

      {/* Live stats */}
      <div>
        <h2 className="font-heading font-semibold text-warm-700 text-center mb-4">
          {t.donate.liveNumbers}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="card-warm text-center py-5">
            <p className="font-heading text-3xl font-bold text-warm-800">
              {approvedVideos ?? 0}
            </p>
            <p className="text-xs text-warm-500 mt-1">{t.donate.videosInCatalog}</p>
          </div>
          <div className="card-warm text-center py-5">
            <p className="font-heading text-3xl font-bold text-warm-800">
              {reviewerCount ?? 0}
            </p>
            <p className="text-xs text-warm-500 mt-1">{t.donate.parentReviewers}</p>
          </div>
          <div className="card-warm text-center py-5">
            <p className="font-heading text-3xl font-bold text-warm-800">
              {reviewCount ?? 0}
            </p>
            <p className="text-xs text-warm-500 mt-1">{t.donate.reviewsSubmitted}</p>
          </div>
        </div>
      </div>

      {/* Current funding */}
      <div className="card-warm text-center py-5">
        <p className="text-warm-500 text-sm mb-1">{t.donate.currentFunding}</p>
        <p className="font-heading text-4xl font-bold text-warm-800">
          €{monthlyDonation}
          <span className="text-warm-400 text-xl font-normal"> {t.donate.perMonth}</span>
        </p>
        <p className="text-xs text-warm-400 mt-2">
          {t.donate.updatedManually}{' '}
          <a
            href="https://github.com/sponsors/felipeamarante"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-warm-600"
          >
            {t.donate.gitHubSponsors}
          </a>
        </p>
      </div>

      {/* Milestones */}
      <div>
        <h2 className="font-heading font-semibold text-warm-700 mb-4">
          {t.donate.milestoneRoadmap}
        </h2>
        <div className="space-y-4">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className={`card-warm space-y-3 ${milestone.reached ? 'border-sage-300' : ''}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{milestone.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-heading font-semibold text-warm-800 text-sm">
                      {milestone.label}
                    </p>
                    {milestone.reached && (
                      <span className="text-xs font-bold text-sage-600 bg-sage-100 border border-sage-200 rounded-full px-2 py-0.5">
                        {t.donate.reached}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-warm-500 mt-0.5 leading-relaxed">
                    {milestone.description}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              {milestone.amount > 0 && (
                <div className="space-y-1">
                  <div className="h-2.5 bg-warm-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        milestone.reached ? 'bg-sage-400' : 'bg-peach'
                      }`}
                      style={{ width: `${milestone.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-warm-400 text-right">
                    {milestone.reached
                      ? `€${milestone.amount} / €${milestone.amount}`
                      : `€${monthlyDonation} / €${milestone.amount} — ${milestone.progress}%`}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Transparency note */}
      <div className="bg-cream-100 border border-cream-200 rounded-2xl px-5 py-4 text-center space-y-1">
        <p className="text-sm font-semibold text-warm-700">{t.donate.builtInPublic}</p>
        <p className="text-xs text-warm-500 leading-relaxed">
          {t.donate.transparencyNote}
        </p>
      </div>

    </div>
  )
}
