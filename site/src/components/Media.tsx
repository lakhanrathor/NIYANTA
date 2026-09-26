import { useState } from 'react'
import { youtubeId } from '../content/videos'

/* ───────────── YouTube ───────────── */

export function YouTubeThumb({ url, title, className, hint = 'src/content/videos.ts' }: { url: string; title: string; className?: string; hint?: string }) {
  const id = youtubeId(url)
  // maxres doesn't exist for every video; fall back to hq for that id
  const [lowRes, setLowRes] = useState<string | null>(null)
  const src = id ? `https://i.ytimg.com/vi/${id}/${lowRes === id ? 'hqdefault' : 'maxresdefault'}.jpg` : ''
  if (!id)
    return (
      <div className={`relative grid place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_30%_20%,var(--color-deep),var(--color-abyss)_70%)] ${className ?? ''}`}>
        <div className="absolute inset-0 opacity-30 [background:repeating-radial-gradient(circle_at_70%_120%,transparent_0_18px,rgb(10_143_189/0.18)_19px_20px)]" />
        <div className="relative flex flex-col items-center gap-2 text-center">
          <span className="chip">Video coming soon</span>
          <span className="font-mono text-[11px] text-dim">Add the link in {hint}</span>
        </div>
      </div>
    )
  return (
    <img
      src={src}
      alt={title}
      loading="lazy"
      onError={() => setLowRes(id)}
      onLoad={(e) => {
        // YouTube can serve a 120px grey placeholder when maxres doesn't exist
        if ((e.target as HTMLImageElement).naturalWidth <= 120) setLowRes(id)
      }}
      className={`object-cover ${className ?? ''}`}
    />
  )
}

export function YouTubeEmbed({ url, title, autoplay = true }: { url: string; title: string; autoplay?: boolean }) {
  const id = youtubeId(url)
  if (!id) return null
  return (
    <iframe
      className="absolute inset-0 h-full w-full"
      src={`https://www.youtube-nocookie.com/embed/${id}?${autoplay ? 'autoplay=1&' : ''}rel=0&modestbranding=1&playsinline=1`}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  )
}
