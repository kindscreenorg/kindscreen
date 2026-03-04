import { NextRequest, NextResponse } from 'next/server'

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/

interface YouTubeSnippet {
  title: string
  thumbnails: {
    maxres?: { url: string }
    standard?: { url: string }
    high?: { url: string }
    medium?: { url: string }
  }
  channelTitle: string
}

interface YouTubeApiResponse {
  items?: Array<{ snippet: YouTubeSnippet }>
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')

  if (!id || !YOUTUBE_ID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid YouTube video ID.' }, { status: 400 })
  }

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'YouTube API not configured.' }, { status: 500 })
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${apiKey}`
  const res = await fetch(url)

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to reach YouTube API.' }, { status: 502 })
  }

  const data = (await res.json()) as YouTubeApiResponse

  if (!data.items || data.items.length === 0) {
    return NextResponse.json({ error: 'Video not found.' }, { status: 404 })
  }

  const { snippet } = data.items[0]
  const t = snippet.thumbnails
  const thumbnail_url =
    t.maxres?.url ?? t.standard?.url ?? t.high?.url ?? t.medium?.url ?? null

  return NextResponse.json({
    title: snippet.title,
    thumbnail_url,
    channel_title: snippet.channelTitle,
  })
}
