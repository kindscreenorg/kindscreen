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

  const { field, value } = body as { field?: string; value?: unknown }

  if (field !== 'is_trusted' && field !== 'is_moderator') {
    return NextResponse.json({ error: 'field must be "is_trusted" or "is_moderator".' }, { status: 400 })
  }

  if (typeof value !== 'boolean') {
    return NextResponse.json({ error: 'value must be a boolean.' }, { status: 400 })
  }

  // Only admins can change is_moderator
  if (field === 'is_moderator') {
    const { data: isAdmin } = await (
      supabase.rpc('is_admin')
    ) as unknown as { data: boolean | null }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can change moderator status.' }, { status: 403 })
    }
  }

  const { id: reviewerId } = await params

  const { data, error } = await supabase
    .from('reviewers')
    .update({ [field]: value } as never)
    .eq('id', reviewerId)
    .select('id, username, is_trusted, is_moderator')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
