'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { VideoWithChannel } from './page'

interface VideoModalProps {
  video: VideoWithChannel | null
  onClose: () => void
  onVideoChange?: (video: VideoWithChannel) => void
}

type FlagState = 'idle' | 'form' | 'submitting' | 'done' | 'error'

import { loadYTApi } from '@/lib/utils/youtube'

export default function VideoModal({ video, onClose, onVideoChange }: VideoModalProps) {
  const playerRef = useRef<YTPlayer | null>(null)
  const [videoEnded, setVideoEnded] = useState(false)
  const [upNextVideos, setUpNextVideos] = useState<VideoWithChannel[]>([])
  const [flagState, setFlagState] = useState<FlagState>('idle')
  const [flagReason, setFlagReason] = useState('')
  const [flagError, setFlagError] = useState('')

  // ESC key + scroll lock
  useEffect(() => {
    if (!video) return
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [video, onClose])

  // Reset UI state when video changes
  useEffect(() => {
    setVideoEnded(false)
    setUpNextVideos([])
    setFlagState('idle')
    setFlagReason('')
    setFlagError('')
  }, [video?.id])

  // IFrame API player — init/destroy when youtube_id changes
  useEffect(() => {
    if (!video) return
    let destroyed = false

    loadYTApi(() => {
      if (destroyed) return
      playerRef.current?.destroy()
      playerRef.current = new window.YT.Player('yt-modal-player', {
        videoId: video.youtube_id,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              setVideoEnded(true)
              void fetchUpNext(video.id)
            }
          },
        },
      })
    })

    return () => {
      destroyed = true
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [video?.youtube_id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchUpNext(currentId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('videos')
      .select('*, channels(name)')
      .eq('status', 'approved')
      .neq('id', currentId)
      .limit(20)
    const shuffled = ((data ?? []) as unknown as VideoWithChannel[])
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
    setUpNextVideos(shuffled)
  }

  async function submitFlag() {
    /* v8 ignore start */
    if (!video || !flagReason.trim()) return
    /* v8 ignore stop */
    setFlagState('submitting')
    setFlagError('')
    try {
      const res = await fetch('/api/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: video.id, reason: flagReason.trim() }),
      })
      if (!res.ok) {
        const json = (await res.json()) as { error?: string }
        setFlagError(json.error ?? 'Something went wrong.')
        setFlagState('error')
        return
      }
      setFlagState('done')
    } catch {
      setFlagError('Could not reach the server.')
      setFlagState('error')
    }
  }

  if (!video) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/80 hover:text-white text-2xl leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Player container */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
          <div id="yt-modal-player" className="w-full h-full" />

          {/* Up-next overlay — shown when video ends */}
          {videoEnded && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-5">
              <p className="font-heading font-bold text-white text-lg mb-5">
                Watch next on KindScreen
              </p>

              {upNextVideos.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 w-full">
                  {upNextVideos.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setVideoEnded(false)
                        onVideoChange?.(v)
                      }}
                      className="text-left space-y-1.5 group"
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-warm-800">
                        <Image
                          src={v.thumbnail_url ?? `https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg`}
                          alt={v.title}
                          fill
                          className="object-cover group-hover:opacity-75 transition-opacity"
                          unoptimized
                        />
                      </div>
                      <p className="text-white text-xs font-medium line-clamp-2 leading-snug">
                        {v.title}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-sm">Loading suggestions…</p>
              )}

              <button
                type="button"
                onClick={onClose}
                className="mt-6 text-white/40 hover:text-white/70 text-xs transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>

        <p className="font-heading font-semibold text-white mt-3 text-lg">{video.title}</p>
        {video.channels?.name && (
          <p className="text-white/60 text-sm mt-0.5">{video.channels.name}</p>
        )}

        {/* Flag section */}
        <div className="mt-3">
          {flagState === 'idle' && (
            <button
              type="button"
              onClick={() => setFlagState('form')}
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              🚩 Report this video
            </button>
          )}

          {(flagState === 'form' || flagState === 'error') && (
            <div className="bg-white/10 rounded-xl p-3 space-y-2">
              <p className="text-white text-xs font-semibold">What&apos;s the issue?</p>
              <textarea
                rows={2}
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Describe why this video may not be appropriate for kids…"
                className="w-full px-3 py-2 rounded-lg bg-white/20 text-white text-xs placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/50 resize-none"
                autoFocus
              />
              {flagError && <p className="text-rose-300 text-xs">{flagError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setFlagState('idle'); setFlagReason(''); setFlagError('') }}
                  className="text-xs text-white/50 hover:text-white/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitFlag}
                  disabled={!flagReason.trim()}
                  className="text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 px-3 py-1 rounded-lg transition-colors"
                >
                  Submit report
                </button>
              </div>
            </div>
          )}

          {flagState === 'submitting' && (
            <p className="text-xs text-white/50">Submitting report…</p>
          )}

          {flagState === 'done' && (
            <p className="text-xs text-white/70">
              ✓ Report submitted. Thank you for helping keep KindScreen safe.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
