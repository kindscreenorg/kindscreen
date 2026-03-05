import Image from 'next/image'
import type { VideoWithChannel } from './page'

interface VideoCardProps {
  video: VideoWithChannel
  onClick: () => void
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  const { title, thumbnail_url, youtube_id, age_band, category, channels } = video
  const thumb = thumbnail_url ?? `https://img.youtube.com/vi/${youtube_id}/hqdefault.jpg`

  return (
    <button onClick={onClick} className="group text-left w-full">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-warm-100 shadow-warm group-hover:shadow-warm-md transition">
        <Image
          src={thumb}
          fill
          alt={title}
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/20">
          <div className="w-12 h-12 rounded-full bg-peach/90 flex items-center justify-center text-white text-lg pl-0.5">
            ▶
          </div>
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <p className="font-heading font-semibold text-sm text-warm-800 line-clamp-2 leading-snug">
          {title}
        </p>
        <div className="flex gap-1.5 mt-1.5 flex-wrap">
          {age_band && (
            <span className="bg-sage-100 text-sage-500 text-xs font-medium px-2 py-0.5 rounded-full">
              {age_band}
            </span>
          )}
          <span className="bg-lavender-100 text-lavender-500 text-xs font-medium px-2 py-0.5 rounded-full capitalize">
            {category}
          </span>
        </div>
        {channels?.name && (
          <p className="text-xs text-warm-400 mt-1 truncate">{channels.name}</p>
        )}
      </div>
    </button>
  )
}
