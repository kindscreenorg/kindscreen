'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Constants } from '@/types/database'
import type { VideoWithChannel } from './page'
import VideoCard from './VideoCard'
import VideoModal from './VideoModal'

const AGE_BANDS = Constants.public.Enums.age_band
const VIDEO_CATEGORIES = Constants.public.Enums.video_category

const AGE_BAND_LABELS: Record<string, string> = {
  '3-5': '3–5',
  '6-9': '6–9',
  '10-12': '10–12',
}

interface BrowseClientProps {
  initialVideos: VideoWithChannel[]
  totalCount: number
  pageSize: number
  category?: typeof VIDEO_CATEGORIES[number]
  ageBand?: typeof AGE_BANDS[number]
}

export default function BrowseClient({
  initialVideos,
  totalCount,
  pageSize,
  category,
  ageBand,
}: BrowseClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [videos, setVideos] = useState<VideoWithChannel[]>(initialVideos)
  const [offset, setOffset] = useState(initialVideos.length)
  const [loading, setLoading] = useState(false)
  const [activeVideo, setActiveVideo] = useState<VideoWithChannel | null>(null)

  // Reset when server sends a new filtered page
  useEffect(() => {
    setVideos(initialVideos)
    setOffset(initialVideos.length)
  }, [initialVideos])

  const buildUrl = useCallback(
    (nextCategory?: string, nextAgeBand?: string) => {
      const params = new URLSearchParams()
      if (nextCategory) params.set('category', nextCategory)
      if (nextAgeBand) params.set('age_band', nextAgeBand)
      const qs = params.toString()
      return `/browse${qs ? `?${qs}` : ''}`
    },
    []
  )

  const handleCategoryChip = (cat?: typeof VIDEO_CATEGORIES[number]) => {
    router.push(buildUrl(cat, ageBand))
  }

  const handleAgeBandChip = (band?: typeof AGE_BANDS[number]) => {
    router.push(buildUrl(category, band))
  }

  const loadMore = async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('videos')
      .select('*, channels(name, youtube_channel_id)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)
    if (category) query = query.eq('category', category)
    if (ageBand) query = query.eq('age_band', ageBand)
    const { data } = await query
    setVideos((prev) => [...prev, ...((data ?? []) as VideoWithChannel[])])
    setOffset((prev) => prev + pageSize)
    setLoading(false)
  }

  const chipBase = 'text-sm font-medium px-3 py-1.5 rounded-full transition cursor-pointer whitespace-nowrap'
  const chipActive = 'bg-peach text-white'
  const chipInactive = 'bg-cream-100 text-warm-600 hover:bg-cream-200'

  // Suppress unused warning — searchParams is read to trigger re-render on nav
  void searchParams

  return (
    <div className="bg-cream min-h-screen">
      {/* Filter bar */}
      <div className="bg-white border-b border-cream-200 px-4 py-3 space-y-2">
        {/* Age bands */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            className={`${chipBase} ${!ageBand ? chipActive : chipInactive}`}
            onClick={() => handleAgeBandChip(undefined)}
          >
            All ages
          </button>
          {AGE_BANDS.map((band) => (
            <button
              key={band}
              className={`${chipBase} ${ageBand === band ? chipActive : chipInactive}`}
              onClick={() => handleAgeBandChip(band)}
            >
              {AGE_BAND_LABELS[band] ?? band}
            </button>
          ))}
        </div>
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            className={`${chipBase} ${!category ? chipActive : chipInactive}`}
            onClick={() => handleCategoryChip(undefined)}
          >
            All
          </button>
          {VIDEO_CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`${chipBase} ${category === cat ? chipActive : chipInactive}`}
              onClick={() => handleCategoryChip(cat)}
            >
              <span className="capitalize">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {videos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎬</div>
            <p className="text-warm-500 font-medium mb-4">No videos found for these filters.</p>
            <button
              className="btn-secondary text-sm"
              onClick={() => router.push('/browse')}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => setActiveVideo(video)}
                />
              ))}
            </div>

            {videos.length < totalCount && (
              <div className="mt-8 text-center">
                <button
                  className="btn-secondary"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
    </div>
  )
}
