import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import FlaggedVideos from './FlaggedVideos';
import type { FlaggedVideo, FlagItem } from './FlaggedVideos';

export default async function ModeratorDashboard() {
  const supabase = await createClient();
  const t = await getT();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/moderator');

  // Verify moderator role
  const { data: isMod } = (await supabase.rpc('is_moderator')) as unknown as {
    data: boolean | null;
  };

  if (!isMod) redirect('/reviewer');

  const { data: isAdmin } = (await supabase.rpc('is_admin')) as unknown as {
    data: boolean | null;
  };

  // Fetch open flags with video details
  const { data: flagsRaw } = (await supabase
    .from('flags')
    .select(
      'id, reason, created_at, video_id, videos(id, title, youtube_id, thumbnail_url, status)'
    )
    .eq('status', 'open')
    .order('created_at', { ascending: true })) as unknown as {
    data: Array<{
      id: string;
      reason: string;
      created_at: string;
      video_id: string;
      videos: {
        id: string;
        title: string;
        youtube_id: string;
        thumbnail_url: string | null;
        status: string;
      } | null;
    }> | null;
  };

  // Group flags by video
  const videoMap = new Map<string, FlaggedVideo>();
  for (const flag of flagsRaw ?? []) {
    if (!flag.videos) continue;
    const vid = flag.videos;
    if (!videoMap.has(vid.id)) {
      videoMap.set(vid.id, {
        id: vid.id,
        title: vid.title,
        youtube_id: vid.youtube_id,
        thumbnail_url: vid.thumbnail_url,
        status: vid.status,
        flags: []
      });
    }
    const flagItem: FlagItem = {
      id: flag.id,
      reason: flag.reason,
      created_at: flag.created_at
    };
    videoMap.get(vid.id)!.flags.push(flagItem);
  }

  // Sort by most flags first
  const flaggedVideos = Array.from(videoMap.values()).sort(
    (a, b) => b.flags.length - a.flags.length
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-warm-700">
            {t.moderatorDashboard.title}
          </h1>
          <p className="text-sm text-warm-500 mt-1">
            {flaggedVideos.length > 0
              ? `${flaggedVideos.length} ${flaggedVideos.length === 1 ? t.moderatorDashboard.videosWithOpenFlags_one : t.moderatorDashboard.videosWithOpenFlags_other}`
              : t.moderatorDashboard.noFlaggedVideos}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/moderator/videos"
            className="btn-secondary text-sm py-2 px-4"
          >
            {t.moderatorDashboard.allVideosLink}
          </Link>
          <Link
            href="/moderator/reviewers"
            className="btn-secondary text-sm py-2 px-4"
          >
            {isAdmin
              ? t.reviewPage.manageReviewers
              : t.moderatorDashboard.viewReviewers}
          </Link>
        </div>
      </div>
      <FlaggedVideos initialVideos={flaggedVideos} />
    </div>
  );
}
