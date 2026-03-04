import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  // Moderator check
  const { data: isMod } = await (
    supabase.rpc('is_moderator')
  ) as unknown as { data: boolean | null }

  if (!isMod) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { action } = body as { action?: string }
  if (action !== 'reject' && action !== 'restore') {
    return NextResponse.json({ error: 'action must be "reject" or "restore".' }, { status: 400 })
  }

  const { id: videoId } = await params

  // Resolve all open flags on this video
  await supabase
    .from('flags')
    .update({ status: 'resolved', resolved_by: user.id } as never)
    .eq('video_id', videoId)
    .eq('status', 'open')

  // Update video status
  const newStatus = action === 'reject' ? 'rejected' : 'approved'
  const { data: video, error: updateError } = await supabase
    .from('videos')
    .update({ status: newStatus } as never)
    .eq('id', videoId)
    .select('id, title, status')
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json(video)
}
