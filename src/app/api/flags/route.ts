import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Auth is optional — anon flags are allowed
  const { data: { user } } = await supabase.auth.getUser()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { video_id, reason } = body as { video_id?: string; reason?: string }

  if (!video_id || !reason?.trim()) {
    return NextResponse.json({ error: 'video_id and reason are required.' }, { status: 400 })
  }

  if (reason.trim().length < 5) {
    return NextResponse.json({ error: 'Please describe the issue in a few words.' }, { status: 400 })
  }

  // Confirm the video exists and is approved
  const { data: video } = await supabase
    .from('videos')
    .select('id, status')
    .eq('id', video_id)
    .eq('status', 'approved')
    .maybeSingle()

  if (!video) {
    return NextResponse.json({ error: 'Video not found.' }, { status: 404 })
  }

  const { error } = await supabase
    .from('flags')
    .insert({
      video_id,
      reason: reason.trim(),
      raised_by: user?.id ?? null,
    } as never)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
