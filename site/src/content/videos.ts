/**
 * ─────────────────────────────────────────────────────────────
 *  PROJECT VIDEOS — edit this file to add your YouTube links.
 * ─────────────────────────────────────────────────────────────
 *  Paste any YouTube URL into `url`:
 *    https://www.youtube.com/watch?v=XXXXXXXXXXX
 *    https://youtu.be/XXXXXXXXXXX
 *    https://www.youtube.com/shorts/XXXXXXXXXXX
 *  Leave `url` empty ("") to show a "coming soon" card.
 *  The thumbnail is pulled from YouTube automatically.
 */

export type ProjectVideo = {
  url: string
  title: string
  summary: string
  tag: string
  duration?: string
}

export const videos: ProjectVideo[] = [
  {
    url: 'https://youtu.be/yCssbe3zjHI',
    title: 'Dam-Break Inundation Modelling — Overview',
    summary:
      'An overview of dam-break inundation modelling using hydrodynamic modelling of a river.',
    tag: 'Working demo',
  },
  {
    url: 'https://youtu.be/IGScXJ_x-Ys',
    title: 'Dam-Break Flood Modelling — Software Demo',
    summary:
      'A walkthrough of the flood-modelling software in action.',
    tag: 'Working demo',
  },
  {
    url: 'https://youtu.be/xYQkI9JWQww',
    title: 'Dam-Break Flood Modelling — Explanation',
    summary:
      'An explanation of how the dam-break flood model works.',
    tag: 'Working demo',
  },
  {
    url: '',
    title: 'Rishiganga 2021 — Validation',
    summary:
      'Model output compared with the real incident in Uttarakhand. Matched with 80–90% accuracy.',
    tag: 'Case study',
  },
  {
    url: '',
    title: 'Nepal Flash Flood — Sentinel-2',
    summary:
      'Before and after satellite analysis of the Trishuli basin. 80% match with real-world results and 85% AI accuracy.',
    tag: 'Case study',
  },
]

export function youtubeId(url: string): string | null {
  if (!url) return null
  const m =
    url.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/) ??
    url.match(/^([A-Za-z0-9_-]{11})$/)
  return m ? m[1] : null
}

/**
 * Loops shown in the big simulation tile (muted autoplay). Swap these for
 * your own SPH / flood renders when they're on YouTube.
 */
export const simulationReels = [
  {
    label: 'Real footage',
    url: 'https://youtu.be/XO5n34q0tpI',
    start: 0, // seconds into the video where the clip begins
    seconds: 30, // clip length; it loops after this
    caption: 'Nepal: floodwaters destroy a hydroelectric dam under construction · New York Post',
  },
]
