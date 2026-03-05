import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import VideoList from './VideoList'
import type { VideoRow } from './VideoList'

export default async function AllVideosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/moderator/videos')

  const { data: isMod } = await (
    supabase.rpc('is_moderator')
  ) as unknown as { data: boolean | null }

  if (!isMod) redirect('/reviewer')

  const { data: videosRaw } = await (
    supabase
      .from('videos')
      .select('id, title, youtube_id, thumbnail_url, status, category, age_band, approval_count, rejection_count')
      .order('created_at', { ascending: false })
  ) as unknown as { data: VideoRow[] | null }

  const videos = videosRaw ?? []

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/moderator" className="text-warm-400 hover:text-warm-600 text-sm">
          ← Dashboard
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-warm-700">All Videos</h1>
        <p className="text-sm text-warm-500 mt-1">
          {videos.length} {videos.length === 1 ? 'video' : 'videos'} total
        </p>
      </div>

      <VideoList initialVideos={videos} />
    </div>
  )
}
