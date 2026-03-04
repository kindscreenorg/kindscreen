import { NextResponse, type NextRequest } from 'next/server'
import type { PostgrestSingleResponse } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username') ?? ''
  const lower = username.toLowerCase()

  if (!USERNAME_REGEX.test(lower)) {
    return NextResponse.json(
      { available: false, error: 'Invalid username format.' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // supabase-js v2.98 doesn't infer rpc() Args generics when the Functions map
  // mixes no-arg functions (Args: never) and functions with args. The call is
  // correct at runtime — we only need to guide the type system.
  const { data, error } = (await supabase.rpc(
    'username_available',
    { p_username: lower } as never
  )) as unknown as PostgrestSingleResponse<boolean>

  if (error) {
    return NextResponse.json(
      { available: false, error: 'Could not check username.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ available: data })
}
