import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/database'
import { Constants } from '@/types/database'
import BrowseClient from './BrowseClient'

export const metadata: Metadata = {
  title: 'Browse Videos · KindScreen',
}

const PAGE_SIZE = 12

export type VideoWithChannel = Tables<'videos'> & {
  channels: Pick<Tables<'channels'>, 'name' | 'youtube_channel_id'> | null
}

const VIDEO_CATEGORIES = Constants.public.Enums.video_category
const AGE_BANDS = Constants.public.Enums.age_band

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="text-5xl mb-4">😕</div>
      <h2 className="font-heading text-xl font-semibold text-warm-700 mb-2">Something went wrong</h2>
      <p className="text-warm-400 text-sm">We couldn&apos;t load videos right now. Please try again later.</p>
    </div>
  )
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; age_band?: string }>
}) {
  const { category, age_band } = await searchParams

  const validCategory = VIDEO_CATEGORIES.includes(category as typeof VIDEO_CATEGORIES[number])
    ? (category as typeof VIDEO_CATEGORIES[number])
    : undefined
  const validAgeBand = AGE_BANDS.includes(age_band as typeof AGE_BANDS[number])
    ? (age_band as typeof AGE_BANDS[number])
    : undefined

  const supabase = await createClient()

  let query = supabase
    .from('videos')
    .select('*, channels(name, youtube_channel_id)', { count: 'exact' })
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1)

  if (validCategory) query = query.eq('category', validCategory)
  if (validAgeBand) query = query.eq('age_band', validAgeBand)

  const { data, count, error } = await query

  if (error) return <ErrorState />

  return (
    <BrowseClient
      initialVideos={(data ?? []) as VideoWithChannel[]}
      totalCount={count ?? 0}
      pageSize={PAGE_SIZE}
      category={validCategory}
      ageBand={validAgeBand}
    />
  )
}
