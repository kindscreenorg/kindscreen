import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  // Get video IDs this reviewer has already reviewed
  const { data: reviewed } = await (
    supabase
      .from('reviews')
      .select('video_id')
      .eq('reviewer_id', user.id)
  ) as unknown as { data: Array<{ video_id: string }> | null }

  const reviewedIds = reviewed?.map((r) => r.video_id) ?? []

  // Build query for next pending video (skip own submissions and already reviewed)
  let query = supabase
    .from('videos')
    .select('id, youtube_id, title, thumbnail_url, category, age_band, created_at')
    .eq('status', 'pending')
    .neq('submitted_by', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  if (reviewedIds.length > 0) {
    query = query.not('id', 'in', `(${reviewedIds.join(',')})`)
  }

  const { data: video, error } = await query.maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!video) {
    return NextResponse.json(null, { status: 200 })
  }

  return NextResponse.json(video)
}
