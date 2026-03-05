import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = (await req.json()) as { locale?: string }
  const locale = body.locale

  if (locale !== 'en' && locale !== 'pt') {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    httpOnly: true,
  })
  return res
}
