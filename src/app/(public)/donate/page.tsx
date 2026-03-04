import { createAdminClient } from '@/lib/supabase/admin'

const MILESTONES = [
  {
    id: 'launch',
    emoji: '🎯',
    amount: 0,
    label: 'Launch',
    description: 'Human-only parent review — live now.',
    reached: true, // always reached
  },
  {
    id: 'whisper',
    emoji: '🎙️',
    amount: 200,
    label: '€200 / month',
    description:
      'Add Whisper audio transcription to pre-screen videos before human review, catching bad language and adult content automatically.',
    reached: false,
  },
  {
    id: 'ai_vision',
    emoji: '🤖',
    amount: 500,
    label: '€500 / month',
    description:
      'Add AI frame analysis — a vision model inspects video frames for violence, scary content, and adult themes, giving reviewers a detailed pre-screening report.',
    reached: false,
  },
] as const

function progressPercent(current: number, target: number): number {
  if (target === 0) return 100
  return Math.min(100, Math.round((current / target) * 100))
}

export default async function DonatePage() {
  const supabase = createAdminClient()

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
          Help KindScreen grow
        </h1>
        <p className="text-warm-500 text-base max-w-md mx-auto">
          Every donation unlocks better tools for keeping kids safe online.
          100% of funds go directly to running costs — no salaries, no overhead.
        </p>
        <a
          href="https://github.com/sponsors/kindscreen"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-block mt-2"
        >
          Sponsor on GitHub ↗
        </a>
      </div>

      {/* Live stats */}
      <div>
        <h2 className="font-heading font-semibold text-warm-700 text-center mb-4">
          Live numbers
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="card-warm text-center py-5">
            <p className="font-heading text-3xl font-bold text-warm-800">
              {approvedVideos ?? 0}
            </p>
            <p className="text-xs text-warm-500 mt-1">Videos in catalog</p>
          </div>
          <div className="card-warm text-center py-5">
            <p className="font-heading text-3xl font-bold text-warm-800">
              {reviewerCount ?? 0}
            </p>
            <p className="text-xs text-warm-500 mt-1">Parent reviewers</p>
          </div>
          <div className="card-warm text-center py-5">
            <p className="font-heading text-3xl font-bold text-warm-800">
              {reviewCount ?? 0}
            </p>
            <p className="text-xs text-warm-500 mt-1">Reviews submitted</p>
          </div>
        </div>
      </div>

      {/* Current funding */}
      <div className="card-warm text-center py-5">
        <p className="text-warm-500 text-sm mb-1">Current monthly funding</p>
        <p className="font-heading text-4xl font-bold text-warm-800">
          €{monthlyDonation}
          <span className="text-warm-400 text-xl font-normal"> / month</span>
        </p>
        <p className="text-xs text-warm-400 mt-2">
          Updated manually — verified via{' '}
          <a
            href="https://github.com/sponsors/kindscreen"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-warm-600"
          >
            GitHub Sponsors
          </a>
        </p>
      </div>

      {/* Milestones */}
      <div>
        <h2 className="font-heading font-semibold text-warm-700 mb-4">
          Milestone roadmap
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
                        ✓ Reached
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
        <p className="text-sm font-semibold text-warm-700">Built in public. 100% transparent.</p>
        <p className="text-xs text-warm-500 leading-relaxed">
          No VC. No ads. No selling data. KindScreen is funded by the community it serves.
          Sponsorships are handled via GitHub Sponsors.
        </p>
      </div>

    </div>
  )
}
