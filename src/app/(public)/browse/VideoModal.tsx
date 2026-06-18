'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { VideoWithChannel } from './page'
import { useT } from '@/lib/i18n/client'

interface VideoModalProps {
  video: VideoWithChannel | null
  onClose: () => void
  onVideoChange?: (video: VideoWithChannel) => void
}

type FlagState = 'idle' | 'form' | 'submitting' | 'done' | 'error'

import { loadYTApi } from '@/lib/utils/youtube'

export default function VideoModal({ video, onClose, onVideoChange }: VideoModalProps) {
  const t = useT()
  const playerRef = useRef<YTPlayer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [videoEnded, setVideoEnded] = useState(false)
  const [upNextVideos, setUpNextVideos] = useState<VideoWithChannel[]>([])
  const [flagState, setFlagState] = useState<FlagState>('idle')
  const [flagReason, setFlagReason] = useState('')
  const [flagError, setFlagError] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void containerRef.current?.requestFullscreen()
    }
  }

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
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setVideoEnded(false)
    setUpNextVideos([])
    setFlagState('idle')
    setFlagReason('')
    setFlagError('')
  }, [video?.id])
  /* eslint-enable react-hooks/set-state-in-effect */

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

  // IFrame API player — init/destroy when youtube_id changes
  useEffect(() => {
    if (!video) return
    let destroyed = false

    loadYTApi(() => {
      if (destroyed) return
      playerRef.current?.destroy()
      playerRef.current = new window.YT.Player('yt-modal-player', {
        videoId: video.youtube_id,
        playerVars: { rel: 0, modestbranding: 1, fs: 0 },
        events: {
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              if (document.fullscreenElement) {
                void document.exitFullscreen()
              }
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
        setFlagError(json.error ?? t.modal.somethingWentWrong)
        setFlagState('error')
        return
      }
      setFlagState('done')
    } catch {
      setFlagError(t.modal.serverError)
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

        {/* Player container — fullscreened as a unit so our overlays stay on top */}
        <div ref={containerRef} className="relative aspect-video rounded-2xl overflow-hidden bg-black">
          <div id="yt-modal-player" className="w-full h-full" />

          {/* Block "Mais vídeos" and YouTube logo from navigating away.
              Covers the bottom-right icon strip; seek bar and our fullscreen
              button remain reachable. Stays on top even in fullscreen because
              we fullscreen the container, not the iframe. */}
          <div className="absolute bottom-0 right-0 w-96 h-10 cursor-default" aria-hidden="true" />

          {/* Custom fullscreen button — replaces YouTube's (disabled via fs=0) */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="absolute bottom-1.5 right-1.5 z-10 text-white/70 hover:text-white transition-colors"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              </svg>
            )}
          </button>

          {/* Up-next overlay — shown when video ends */}
          {videoEnded && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-5">
              <p className="font-heading font-bold text-white text-lg mb-5">
                {t.modal.watchNext}
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
                <p className="text-white/40 text-sm">{t.modal.loadingSuggestions}</p>
              )}

              <button
                type="button"
                onClick={onClose}
                className="mt-6 text-white/40 hover:text-white/70 text-xs transition-colors"
              >
                {t.modal.close}
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
              {t.modal.reportVideo}
            </button>
          )}

          {(flagState === 'form' || flagState === 'error') && (
            <div className="bg-white/10 rounded-xl p-3 space-y-2">
              <p className="text-white text-xs font-semibold">{t.modal.whatsTheIssue}</p>
              <textarea
                rows={2}
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder={t.modal.reportPlaceholder}
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
                  {t.modal.cancel}
                </button>
                <button
                  type="button"
                  onClick={submitFlag}
                  disabled={!flagReason.trim()}
                  className="text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 px-3 py-1 rounded-lg transition-colors"
                >
                  {t.modal.submitReport}
                </button>
              </div>
            </div>
          )}

          {flagState === 'submitting' && (
            <p className="text-xs text-white/50">{t.modal.submittingReport}</p>
          )}

          {flagState === 'done' && (
            <p className="text-xs text-white/70">
              {t.modal.reportSubmitted}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
