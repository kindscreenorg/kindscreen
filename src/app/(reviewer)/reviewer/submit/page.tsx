'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Constants } from '@/types/database'

const VIDEO_CATEGORIES = Constants.public.Enums.video_category
const AGE_BANDS = Constants.public.Enums.age_band

const CATEGORY_LABELS: Record<string, string> = {
  educational: 'Educational',
  music: 'Music',
  stories: 'Stories',
  science: 'Science',
  art: 'Art',
  nature: 'Nature',
  sports: 'Sports',
  games: 'Games',
  other: 'Other',
}

import { extractYoutubeId } from '@/lib/utils/youtube'

export default function SubmitPage() {
  const [url, setUrl] = useState('')
  const [youtubeId, setYoutubeId] = useState('')
  const [title, setTitle] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [category, setCategory] = useState('')
  const [ageBand, setAgeBand] = useState('')
  const [fetching, setFetching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  function resetForm() {
    setUrl('')
    setYoutubeId('')
    setTitle('')
    setThumbnailUrl('')
    setCategory('')
    setAgeBand('')
    setErrors({})
    setSubmitError('')
  }

  async function fetchMetadata() {
    const id = extractYoutubeId(url)
    if (!id) {
      setErrors({ url: 'Could not find a valid YouTube video ID.' })
      return
    }

    setFetching(true)
    setErrors({})
    setYoutubeId('')
    setTitle('')
    setThumbnailUrl('')

    try {
      const res = await fetch(`/api/videos/metadata?id=${id}`)
      if (!res.ok) {
        setErrors({ url: 'Video not found on YouTube.' })
        setFetching(false)
        return
      }
      const data = (await res.json()) as { title: string; thumbnail_url: string | null }
      setYoutubeId(id)
      setTitle(data.title)
      setThumbnailUrl(data.thumbnail_url ?? '')
    } catch {
      setErrors({ url: 'Could not reach the server. Please try again.' })
    }

    setFetching(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')

    const newErrors: Record<string, string> = {}
    /* v8 ignore start */
    if (!youtubeId) newErrors.url = 'Please enter a valid YouTube URL first.'
    /* v8 ignore stop */
    if (!category) newErrors.category = 'Please select a category.'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/videos/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtube_id: youtubeId,
          title,
          category,
          age_band: ageBand || undefined,
          thumbnail_url: thumbnailUrl || undefined,
        }),
      })

      if (res.status === 409) {
        setSubmitError('This video is already in the catalog.')
        setSubmitting(false)
        return
      }

      if (!res.ok) {
        const json = (await res.json()) as { error?: string }
        setSubmitError(json.error ?? 'Something went wrong.')
        setSubmitting(false)
        return
      }

      resetForm()
      setSuccessMessage('Video submitted! It will enter the review queue shortly.')
    } catch {
      setSubmitError('Could not reach the server. Please try again.')
    }

    setSubmitting(false)
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-800 text-sm focus:outline-none focus:ring-2 focus:ring-peach focus:border-transparent placeholder:text-warm-300 disabled:opacity-50 disabled:cursor-not-allowed'
  const labelClass = 'block text-sm font-semibold text-warm-700 mb-1'

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="font-heading text-2xl font-bold text-warm-700 mb-6">Submit a Video</h1>

      <div className="card-warm space-y-5">
        {successMessage && (
          <div className="bg-sage-100 text-sage-600 rounded-xl px-4 py-3 text-sm font-medium">
            ✓ {successMessage}
          </div>
        )}

        {/* YouTube URL */}
        <div>
          <label htmlFor="url" className={labelClass}>
            YouTube URL
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setYoutubeId('')
              setTitle('')
              setThumbnailUrl('')
              setSuccessMessage('')
            }}
            onBlur={fetchMetadata}
            className={inputClass}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          {fetching && (
            <span className="text-xs text-warm-400 mt-1 block">Fetching video info…</span>
          )}
          {errors.url && (
            <p className="mt-1 text-xs text-rose-500">{errors.url}</p>
          )}
        </div>

        {/* Thumbnail preview */}
        {thumbnailUrl && (
          <div className="relative aspect-video rounded-xl overflow-hidden bg-warm-100">
            <Image
              src={thumbnailUrl}
              alt="Video thumbnail"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className={labelClass}>
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            readOnly
            className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-warm-50 text-warm-600 text-sm cursor-default select-none placeholder:text-warm-300"
            placeholder="Auto-filled from YouTube"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className={labelClass}>
            Category <span className="text-rose-400">*</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={!youtubeId}
            className={inputClass}
          >
            <option value="">Select a category…</option>
            {VIDEO_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {/* v8 ignore next */
                CATEGORY_LABELS[c] ?? c}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-xs text-rose-500">{errors.category}</p>
          )}
        </div>

        {/* Age band */}
        <div>
          <label htmlFor="age-band" className={labelClass}>
            Age Band <span className="text-warm-400 font-normal">(optional)</span>
          </label>
          <select
            id="age-band"
            value={ageBand}
            onChange={(e) => setAgeBand(e.target.value)}
            disabled={!youtubeId}
            className={inputClass}
          >
            <option value="">Not sure</option>
            {AGE_BANDS.map((b) => (
              <option key={b} value={b}>
                {b} years
              </option>
            ))}
          </select>
        </div>

        {submitError && (
          <p className="text-xs text-rose-500 text-center">{submitError}</p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !youtubeId}
          className="btn-primary w-full"
        >
          {submitting ? 'Submitting…' : 'Submit for Review'}
        </button>
      </div>
    </div>
  )
}
