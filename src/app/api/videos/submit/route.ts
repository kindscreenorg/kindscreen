import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type VideoCategory = Database['public']['Enums']['video_category']
type AgeBand = Database['public']['Enums']['age_band']
type VideoLanguage = Database['public']['Enums']['video_language']

const VIDEO_CATEGORIES: VideoCategory[] = [
  'educational', 'music', 'stories', 'science', 'art', 'nature', 'sports', 'games', 'other',
]
const AGE_BANDS: AgeBand[] = ['3-5', '6-9', '10-12']
const VIDEO_LANGUAGES: VideoLanguage[] = [
  'english', 'portuguese', 'spanish', 'french', 'german', 'japanese', 'korean', 'other',
]

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { youtube_id, title, category, language, age_band, thumbnail_url } = body as {
    youtube_id?: string
    title?: string
    category?: string
    language?: string
    age_band?: string
    thumbnail_url?: string
  }

  if (!youtube_id || !title || !category || !language) {
    return NextResponse.json({ error: 'youtube_id, title, category, and language are required.' }, { status: 400 })
  }

  if (!VIDEO_CATEGORIES.includes(category as VideoCategory)) {
    return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })
  }

  if (!VIDEO_LANGUAGES.includes(language as VideoLanguage)) {
    return NextResponse.json({ error: 'Invalid language.' }, { status: 400 })
  }

  if (age_band && !AGE_BANDS.includes(age_band as AgeBand)) {
    return NextResponse.json({ error: 'Invalid age band.' }, { status: 400 })
  }

  // Duplicate check
  const { data: existing } = await supabase
    .from('videos')
    .select('id')
    .eq('youtube_id', youtube_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'This video is already in the catalog.' }, { status: 409 })
  }

  const { data: video, error: insertError } = await supabase
    .from('videos')
    .insert({
      youtube_id,
      title,
      category: category as VideoCategory,
      language: language as VideoLanguage,
      age_band: (age_band as AgeBand | undefined) ?? null,
      thumbnail_url: thumbnail_url ?? null,
      submitted_by: user.id,
    } as never)
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json(video, { status: 201 })
}
