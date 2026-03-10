'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useT } from '@/lib/i18n/client';

export interface FlagItem {
  id: string;
  reason: string;
  created_at: string;
}

export interface FlaggedVideo {
  id: string;
  title: string;
  youtube_id: string;
  thumbnail_url: string | null;
  status: string;
  flags: FlagItem[];
}

interface Props {
  initialVideos: FlaggedVideo[];
}

export default function FlaggedVideos({ initialVideos }: Props) {
  const t = useT();

  const [videos, setVideos] = useState(initialVideos);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleAction(videoId: string, action: 'reject' | 'restore') {
    setPending((p) => ({ ...p, [videoId]: true }));
    setErrors((e) => {
      const next = { ...e };
      delete next[videoId];
      return next;
    });

    try {
      const res = await fetch(`/api/moderator/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setErrors((e) => ({
          ...e,
          [videoId]: json.error ?? 'Something went wrong.',
        }));
        return;
      }

      // Remove from list on success
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
    } catch {
      setErrors((e) => ({ ...e, [videoId]: 'Could not reach the server.' }));
    } finally {
      setPending((p) => {
        const next = { ...p };
        delete next[videoId];
        return next;
      });
    }
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="font-heading text-xl font-bold text-warm-700 mb-2">
          {t.allVideosPage.allClear}
        </h2>
        <p className="text-sm text-warm-500">
          {t.allVideosPage.noFlaggedVideosRightNow}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {videos.map((video) => (
        <div key={video.id} className="card-warm space-y-4">
          <div className="flex gap-4 items-start">
            {/* Thumbnail */}
            <div className="relative w-32 aspect-video rounded-xl overflow-hidden bg-warm-100 shrink-0">
              {video.thumbnail_url ? (
                <Image
                  src={video.thumbnail_url}
                  alt={video.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-warm-300 text-2xl">
                  📺
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold text-warm-800 text-sm leading-snug line-clamp-2">
                {video.title}
              </p>
              <a
                href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-peach hover:underline mt-0.5 inline-block"
              >
                {t.allVideosPage.watchOnYouTube} ↗
              </a>
              <p className="text-xs text-warm-400 mt-1">
                {video.flags.length} {t.allVideosPage.open}{' '}
                {video.flags.length === 1
                  ? t.allVideosPage.flag_one
                  : t.allVideosPage.flag_other}{' '}
                · {t.allVideosPage.statusLabel}: {video.status}
              </p>
            </div>
          </div>

          {/* Flag reasons */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-warm-600 uppercase tracking-wide">
              {t.allVideosPage.flagReasons}
            </p>
            {video.flags.map((flag) => (
              <div
                key={flag.id}
                className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-sm text-rose-700"
              >
                🚩 {flag.reason}
              </div>
            ))}
          </div>

          {errors[video.id] && (
            <p className="text-xs text-rose-500">{errors[video.id]}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleAction(video.id, 'reject')}
              disabled={pending[video.id]}
              className="flex-1 py-2 px-3 rounded-xl border-2 border-rose-300 bg-rose-50 text-rose-700 text-sm font-semibold hover:bg-rose-100 disabled:opacity-50 transition-colors"
            >
              {pending[video.id] ? t.allVideosPage.loading : t.allVideosPage.removeFromCatalog}
            </button>
            <button
              type="button"
              onClick={() => handleAction(video.id, 'restore')}
              disabled={pending[video.id]}
              className="flex-1 py-2 px-3 rounded-xl border-2 border-sage-300 bg-sage-50 text-sage-700 text-sm font-semibold hover:bg-sage-100 disabled:opacity-50 transition-colors"
            >
              {pending[video.id] ? t.allVideosPage.loading : t.allVideosPage.clearFlagsAndRestore}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
