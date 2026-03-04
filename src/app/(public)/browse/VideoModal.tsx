'use client'

import { useEffect, useState } from 'react'
import type { VideoWithChannel } from './page'

interface VideoModalProps {
  video: VideoWithChannel | null
  onClose: () => void
}

type FlagState = 'idle' | 'form' | 'submitting' | 'done' | 'error'

export default function VideoModal({ video, onClose }: VideoModalProps) {
  const [flagState, setFlagState] = useState<FlagState>('idle')
  const [flagReason, setFlagReason] = useState('')
  const [flagError, setFlagError] = useState('')

  useEffect(() => {
    if (!video) return

    // Reset flag form when video changes
    setFlagState('idle')
    setFlagReason('')
    setFlagError('')

    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [video, onClose])

  async function submitFlag() {
    if (!video || !flagReason.trim()) return

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

        <div className="aspect-video rounded-2xl overflow-hidden bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtube_id}?rel=0&modestbranding=1`}
            allow="fullscreen"
            allowFullScreen
            className="w-full h-full"
            title={video.title}
          />
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
