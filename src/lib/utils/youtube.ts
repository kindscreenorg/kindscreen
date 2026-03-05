/** Extract an 11-character YouTube video ID from a URL or bare ID string. */
export function extractYoutubeId(input: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/(?:shorts|embed)\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const p of patterns) {
    const m = input.trim().match(p)
    if (m) return m[1]
  }
  return null
}

/** Inject the YouTube IFrame API script and call onReady when it is available. */
export function loadYTApi(onReady: () => void) {
  if (typeof window === 'undefined') return
  if (window.YT?.Player) { onReady(); return }

  const prev = window.onYouTubeIframeAPIReady
  window.onYouTubeIframeAPIReady = () => { prev?.(); onReady() }

  if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(s)
  }
}
