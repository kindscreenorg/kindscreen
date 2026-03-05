'use client'

import { useState } from 'react'
import Image from 'next/image'

export interface VideoRow {
  id: string
  title: string
  youtube_id: string
  thumbnail_url: string | null
  status: string
  category: string
  age_band: string
  approval_count: number
  rejection_count: number
}

type StatusFilter = 'all' | 'approved' | 'pending' | 'rejected'

interface Props {
  initialVideos: VideoRow[]
}

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'pending', label: 'Pending' },
  { key: 'rejected', label: 'Rejected' },
]

function StatusBadge({ status }: { status: string }) {
  const base = 'inline-block px-2 py-0.5 rounded-full text-xs font-semibold'
  if (status === 'approved') return <span className={`${base} bg-sage-100 text-sage-700`}>Approved</span>
  if (status === 'rejected' || status === 'suspended') return <span className={`${base} bg-rose-100 text-rose-700`}>{status}</span>
  return <span className={`${base} bg-warm-100 text-warm-600`}>{status}</span>
}

export default function VideoList({ initialVideos }: Props) {
  const [videos, setVideos] = useState(initialVideos)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleAction(videoId: string, action: 'reject' | 'restore') {
    setPending((p) => ({ ...p, [videoId]: true }))
    setErrors((e) => { const next = { ...e }; delete next[videoId]; return next })

    try {
      const res = await fetch(`/api/moderator/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) {
        const json = (await res.json()) as { error?: string }
        setErrors((e) => ({ ...e, [videoId]: json.error ?? 'Something went wrong.' }))
        return
      }

      const updated = (await res.json()) as { id: string; status: string }
      setVideos((prev) => prev.map((v) => v.id === updated.id ? { ...v, status: updated.status } : v))
    } catch {
      setErrors((e) => ({ ...e, [videoId]: 'Could not reach the server.' }))
    } finally {
      setPending((p) => { const next = { ...p }; delete next[videoId]; return next })
    }
  }

  const filtered = filter === 'all' ? videos : videos.filter((v) => {
    if (filter === 'rejected') return v.status === 'rejected' || v.status === 'suspended'
    return v.status === filter
  })

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-colors ${
              filter === tab.key
                ? 'border-peach bg-peach text-white'
                : 'border-warm-200 bg-white text-warm-600 hover:border-peach'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] text-center px-4">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm text-warm-500">No videos in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((video) => (
            <div key={video.id} className="card-warm">
              <div className="flex gap-4 items-start">
                {/* Thumbnail */}
                <div className="relative w-28 aspect-video rounded-xl overflow-hidden bg-warm-100 shrink-0">
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
                  <p className="font-heading font-semibold text-warm-800 text-sm leading-snug line-clamp-2 mb-1">
                    {video.title}
                  </p>
                  <div className="flex flex-wrap gap-1.5 items-center mb-1">
                    <StatusBadge status={video.status} />
                    <span className="text-xs text-warm-400">{video.category}</span>
                    <span className="text-xs text-warm-400">·</span>
                    <span className="text-xs text-warm-400">{video.age_band}</span>
                  </div>

                  {errors[video.id] && (
                    <p className="text-xs text-rose-500 mt-1">{errors[video.id]}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-2">
                    {video.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleAction(video.id, 'reject')}
                        disabled={pending[video.id]}
                        className="py-1.5 px-3 rounded-xl border-2 border-rose-300 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 disabled:opacity-50 transition-colors"
                      >
                        {pending[video.id] ? '…' : '✕ Remove from catalog'}
                      </button>
                    )}
                    {(video.status === 'rejected' || video.status === 'suspended') && (
                      <button
                        type="button"
                        onClick={() => handleAction(video.id, 'restore')}
                        disabled={pending[video.id]}
                        className="py-1.5 px-3 rounded-xl border-2 border-sage-300 bg-sage-50 text-sage-700 text-xs font-semibold hover:bg-sage-100 disabled:opacity-50 transition-colors"
                      >
                        {pending[video.id] ? '…' : '✓ Restore'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
