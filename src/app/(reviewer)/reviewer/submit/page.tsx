'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Constants } from '@/types/database'
import { extractYoutubeId } from '@/lib/utils/youtube'
import { useT } from '@/lib/i18n/client'

const VIDEO_CATEGORIES = Constants.public.Enums.video_category
const AGE_BANDS = Constants.public.Enums.age_band
const VIDEO_LANGUAGES = Constants.public.Enums.video_language

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

const LANGUAGE_LABELS: Record<string, string> = {
  english: 'English',
  portuguese: 'Portuguese',
  spanish: 'Spanish',
  french: 'French',
  german: 'German',
  japanese: 'Japanese',
  korean: 'Korean',
  other: 'Other',
}

export default function SubmitPage() {
  const t = useT()
  const [url, setUrl] = useState('')
  const [youtubeId, setYoutubeId] = useState('')
  const [title, setTitle] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [category, setCategory] = useState('')
  const [language, setLanguage] = useState('')
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
    setLanguage('')
    setAgeBand('')
    setErrors({})
    setSubmitError('')
  }

  async function fetchMetadata() {
    const id = extractYoutubeId(url)
    if (!id) {
      setErrors({ url: t.submitPage.invalidUrl })
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
        setErrors({ url: t.submitPage.videoNotFound })
        setFetching(false)
        return
      }
      const data = (await res.json()) as { title: string; thumbnail_url: string | null }
      setYoutubeId(id)
      setTitle(data.title)
      setThumbnailUrl(data.thumbnail_url ?? '')
    } catch {
      setErrors({ url: t.submitPage.serverError })
    }

    setFetching(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')

    const newErrors: Record<string, string> = {}
    /* v8 ignore start */
    if (!youtubeId) newErrors.url = t.submitPage.pleaseEnterUrl
    /* v8 ignore stop */
    if (!category) newErrors.category = t.submitPage.pleaseSelectCategory
    if (!language) newErrors.language = t.submitPage.pleaseSelectLanguage
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
          language,
          age_band: ageBand || undefined,
          thumbnail_url: thumbnailUrl || undefined,
        }),
      })

      if (res.status === 409) {
        setSubmitError(t.submitPage.alreadyInCatalog)
        setSubmitting(false)
        return
      }

      if (!res.ok) {
        const json = (await res.json()) as { error?: string }
        setSubmitError(json.error ?? t.submitPage.somethingWentWrong)
        setSubmitting(false)
        return
      }

      resetForm()
      setSuccessMessage(t.submitPage.success)
    } catch {
      setSubmitError(t.submitPage.serverError)
    }

    setSubmitting(false)
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-warm-800 text-sm focus:outline-none focus:ring-2 focus:ring-peach focus:border-transparent placeholder:text-warm-300 disabled:opacity-50 disabled:cursor-not-allowed'
  const labelClass = 'block text-sm font-semibold text-warm-700 mb-1'

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="font-heading text-2xl font-bold text-warm-700 mb-6">{t.submitPage.title}</h1>

      <div className="card-warm space-y-5">
        {successMessage && (
          <div className="bg-sage-100 text-sage-600 rounded-xl px-4 py-3 text-sm font-medium">
            ✓ {successMessage}
          </div>
        )}

        {/* YouTube URL */}
        <div>
          <label htmlFor="url" className={labelClass}>
            {t.submitPage.youtubeUrl}
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
            placeholder={t.submitPage.urlPlaceholder}
          />
          {fetching && (
            <span className="text-xs text-warm-400 mt-1 block">{t.submitPage.fetchingInfo}</span>
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
              alt={t.submitPage.thumbnailAlt}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className={labelClass}>
            {t.submitPage.titleField}
          </label>
          <input
            id="title"
            type="text"
            value={title}
            readOnly
            className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-warm-50 text-warm-600 text-sm cursor-default select-none placeholder:text-warm-300"
            placeholder={t.submitPage.titlePlaceholder}
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className={labelClass}>
            {t.submitPage.category} <span className="text-rose-400">*</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={!youtubeId}
            className={inputClass}
          >
            <option value="">{t.submitPage.selectCategory}</option>
            {VIDEO_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-xs text-rose-500">{errors.category}</p>
          )}
        </div>

        {/* Language */}
        <div>
          <label htmlFor="language" className={labelClass}>
            {t.submitPage.language} <span className="text-rose-400">*</span>
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={!youtubeId}
            className={inputClass}
          >
            <option value="">{t.submitPage.selectLanguage}</option>
            {VIDEO_LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {LANGUAGE_LABELS[l]}
              </option>
            ))}
          </select>
          {errors.language && (
            <p className="mt-1 text-xs text-rose-500">{errors.language}</p>
          )}
        </div>

        {/* Age band */}
        <div>
          <label htmlFor="age-band" className={labelClass}>
            {t.submitPage.ageBand} <span className="text-warm-400 font-normal">{t.submitPage.optional}</span>
          </label>
          <select
            id="age-band"
            value={ageBand}
            onChange={(e) => setAgeBand(e.target.value)}
            disabled={!youtubeId}
            className={inputClass}
          >
            <option value="">{t.submitPage.notSure}</option>
            {AGE_BANDS.map((b) => (
              <option key={b} value={b}>
                {b} {t.submitPage.years}
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
          {submitting ? t.submitPage.submitting : t.submitPage.submitBtn}
        </button>
      </div>
    </div>
  )
}
