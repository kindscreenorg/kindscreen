import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type AgeBand = Database['public']['Enums']['age_band']
const AGE_BANDS: AgeBand[] = ['3-5', '6-9', '10-12']

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

  const {
    video_id,
    verdict,
    has_violence,
    has_scary,
    has_adult_themes,
    has_bad_language,
    age_band_suggestion,
    rejection_reason,
  } = body as {
    video_id?: string
    verdict?: string
    has_violence?: boolean
    has_scary?: boolean
    has_adult_themes?: boolean
    has_bad_language?: boolean
    age_band_suggestion?: string
    rejection_reason?: string
  }

  if (!video_id || !verdict) {
    return NextResponse.json({ error: 'video_id and verdict are required.' }, { status: 400 })
  }

  if (verdict !== 'approve' && verdict !== 'reject') {
    return NextResponse.json({ error: 'verdict must be "approve" or "reject".' }, { status: 400 })
  }

  if (age_band_suggestion && !AGE_BANDS.includes(age_band_suggestion as AgeBand)) {
    return NextResponse.json({ error: 'Invalid age band.' }, { status: 400 })
  }

  const { data: review, error: insertError } = await supabase
    .from('reviews')
    .insert({
      video_id,
      reviewer_id: user.id,
      verdict,
      has_violence: has_violence ?? false,
      has_scary: has_scary ?? false,
      has_adult_themes: has_adult_themes ?? false,
      has_bad_language: has_bad_language ?? false,
      age_band_suggestion: (age_band_suggestion as AgeBand | undefined) ?? null,
      rejection_reason: rejection_reason ?? null,
    } as never)
    .select()
    .single()

  if (insertError) {
    // Unique violation — already reviewed
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'You have already reviewed this video.' }, { status: 409 })
    }
    // RLS rejection (trying to review own video)
    if (insertError.code === '42501') {
      return NextResponse.json({ error: 'You cannot review your own submission.' }, { status: 403 })
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json(review, { status: 201 })
}
