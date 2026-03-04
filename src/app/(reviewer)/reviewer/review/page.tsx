'use client'

import { useState, useEffect, useCallback } from 'react'
import { Constants } from '@/types/database'

type AgeBand = typeof Constants.public.Enums.age_band[number]

interface PendingVideo {
  id: string
  youtube_id: string
  title: string
  thumbnail_url: string | null
  category: string
  age_band: AgeBand | null
  created_at: string
}

const AGE_BAND_LABELS: Record<string, string> = {
  '3-5': '3–5 years',
  '6-9': '6–9 years',
  '10-12': '10–12 years',
}

const QUESTIONS = [
  { key: 'has_violence',      emoji: '👊', label: 'Any violence? (including cartoon)' },
  { key: 'has_scary',        emoji: '😨', label: 'Any scary content?' },
  { key: 'has_adult_themes', emoji: '🔞', label: 'Any adult themes?' },
  { key: 'has_bad_language', emoji: '🤬', label: 'Any bad language?' },
] as const

type QuestionKey = typeof QUESTIONS[number]['key']

const DEFAULT_ANSWERS: Record<QuestionKey, boolean> = {
  has_violence: false,
  has_scary: false,
  has_adult_themes: false,
  has_bad_language: false,
}

export default function ReviewPage() {
  const [video, setVideo] = useState<PendingVideo | null | undefined>(undefined)
  const [loadingNext, setLoadingNext] = useState(true)
  const [answers, setAnswers] = useState<Record<QuestionKey, boolean>>(DEFAULT_ANSWERS)
  const [ageBand, setAgeBand] = useState<string>('')
  const [verdict, setVerdict] = useState<'approve' | 'reject' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const fetchNext = useCallback(async () => {
    setLoadingNext(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/reviews/next')
      if (!res.ok) {
        setVideo(null)
        return
      }
      const data = (await res.json()) as PendingVideo | null
      setVideo(data)
      // Reset form
      setAnswers(DEFAULT_ANSWERS)
      setAgeBand('')
      setVerdict(null)
      setRejectionReason('')
    } catch {
      setVideo(null)
    } finally {
      setLoadingNext(false)
    }
  }, [])

  useEffect(() => {
    void fetchNext()
  }, [fetchNext])

  function toggleAnswer(key: QuestionKey) {
    setAnswers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSubmit() {
    if (!video || !verdict) return

    setSubmitting(true)
    setSubmitError('')

    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: video.id,
          verdict,
          ...answers,
          age_band_suggestion: ageBand || undefined,
          rejection_reason: verdict === 'reject' && rejectionReason.trim()
            ? rejectionReason.trim()
            : undefined,
        }),
      })

      if (!res.ok) {
        const json = (await res.json()) as { error?: string }
        setSubmitError(json.error ?? 'Something went wrong.')
        return
      }

      await fetchNext()
    } catch {
      setSubmitError('Could not reach the server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loadingNext && video === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-warm-400 text-sm">Loading review queue…</p>
      </div>
    )
  }

  // Empty queue
  if (!loadingNext && video === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="font-heading text-xl font-bold text-warm-700 mb-2">
          Queue is empty!
        </h2>
        <p className="text-sm text-warm-500 mb-6">
          No pending videos to review right now. Check back later or submit a new video.
        </p>
        <a href="/reviewer/submit" className="btn-primary">
          + Submit a Video
        </a>
      </div>
    )
  }

  if (!video) return null

  const canSubmit = verdict !== null && !submitting

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-warm-700">Review Queue</h1>
        {loadingNext && (
          <span className="text-xs text-warm-400">Loading next…</span>
        )}
      </div>

      <div className="space-y-5">
        {/* Video embed */}
        <div className="rounded-2xl overflow-hidden shadow-warm-sm bg-black aspect-video">
          <iframe
            key={video.youtube_id}
            src={`https://www.youtube.com/embed/${video.youtube_id}?rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        {/* Video info */}
        <div className="card-warm">
          <p className="font-heading font-semibold text-warm-800 text-base leading-snug">
            {video.title}
          </p>
          <p className="text-xs text-warm-400 mt-1 capitalize">{video.category}</p>
        </div>

        {/* Checklist */}
        <div className="card-warm space-y-3">
          <p className="text-sm font-semibold text-warm-700 mb-1">Safety checklist</p>
          {QUESTIONS.map(({ key, emoji, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleAnswer(key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                answers[key]
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white border-warm-200 text-warm-700 hover:border-warm-300'
              }`}
            >
              <span className="text-lg w-6 text-center">{emoji}</span>
              <span className="flex-1 text-left">{label}</span>
              <span className={`text-xs font-bold ${answers[key] ? 'text-rose-600' : 'text-warm-400'}`}>
                {answers[key] ? 'YES' : 'NO'}
              </span>
            </button>
          ))}
        </div>

        {/* Age band */}
        <div className="card-warm">
          <label className="block text-sm font-semibold text-warm-700 mb-2">
            Age band suggestion <span className="font-normal text-warm-400">(optional)</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {Constants.public.Enums.age_band.map((band) => (
              <button
                key={band}
                type="button"
                onClick={() => setAgeBand(ageBand === band ? '' : band)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  ageBand === band
                    ? 'bg-peach border-peach text-white'
                    : 'bg-white border-warm-200 text-warm-700 hover:border-warm-300'
                }`}
              >
                {AGE_BAND_LABELS[band]}
              </button>
            ))}
          </div>
        </div>

        {/* Verdict */}
        <div className="card-warm space-y-3">
          <p className="text-sm font-semibold text-warm-700">Your verdict</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setVerdict('approve')}
              className={`py-3 rounded-xl border-2 text-sm font-bold transition-colors ${
                verdict === 'approve'
                  ? 'bg-sage-100 border-sage-400 text-sage-700'
                  : 'bg-white border-warm-200 text-warm-600 hover:border-sage-300'
              }`}
            >
              ✓ Approve
            </button>
            <button
              type="button"
              onClick={() => setVerdict('reject')}
              className={`py-3 rounded-xl border-2 text-sm font-bold transition-colors ${
                verdict === 'reject'
                  ? 'bg-rose-50 border-rose-400 text-rose-700'
                  : 'bg-white border-warm-200 text-warm-600 hover:border-rose-300'
              }`}
            >
              ✕ Reject
            </button>
          </div>

          {verdict === 'reject' && (
            <div>
              <label className="block text-xs font-semibold text-warm-600 mb-1">
                What was the issue? <span className="font-normal text-warm-400">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Briefly describe why this video was rejected…"
                className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-800 text-sm focus:outline-none focus:ring-2 focus:ring-peach focus:border-transparent placeholder:text-warm-300 resize-none"
              />
            </div>
          )}
        </div>

        {submitError && (
          <p className="text-xs text-rose-500 text-center">{submitError}</p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn-primary w-full text-base py-3"
        >
          {submitting ? 'Submitting…' : 'Submit Review →'}
        </button>
      </div>
    </div>
  )
}
