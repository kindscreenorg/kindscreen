// Minimal type declarations for the YouTube IFrame Player API.
// https://developers.google.com/youtube/iframe_api_reference

declare global {
  interface YTPlayerOptions {
    videoId: string
    playerVars?: {
      rel?: number
      modestbranding?: number
      autoplay?: number
      [key: string]: number | string | undefined
    }
    events?: {
      onReady?: () => void
      onStateChange?: (event: { data: number }) => void
    }
  }

  interface YTPlayer {
    destroy: () => void
    playVideo: () => void
  }

  interface Window {
    YT: {
      Player: new (elementId: string, options: YTPlayerOptions) => YTPlayer
      PlayerState: {
        ENDED: number
        PLAYING: number
        PAUSED: number
        BUFFERING: number
        CUED: number
      }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

export {}
