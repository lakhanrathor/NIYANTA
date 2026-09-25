# NIYANTA — SIH 2026 website

Team NIYANTA's project site for Smart India Hackathon 2026 (PS **SIH26161**, Dam Break Inundation Modelling).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
```

## Edit the content (no coding needed)

Everything you'll want to change lives in `src/content/`:

| What | File | How |
|---|---|---|
| **5 YouTube videos** | `src/content/videos.ts` | Paste each YouTube URL into `url`. Thumbnails load automatically. Empty `url` shows "coming soon". |
| **Team (6 members)** | `src/content/team.ts` | Edit name, role, bio, expertise and links. Put photos in `public/team/` and set `photo: '/team/name.jpg'` (portrait 4:5 works best). |
| **Stats, scenarios, references** | `src/content/project.ts` | All numbers and sources come from the deck. |

Team ID: set `teamId` in `src/content/team.ts`.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · Motion · React Three Fiber + Drei (WebGL).

One-screen dashboard (`src/pages/Home.tsx`): identity, 3D dam-break, demo videos, impact, research, team. On desktop it fits the viewport with no scrolling; on phones the tiles stack.
All motion respects the OS "reduce motion" setting.

## Deploy

- **Vercel:** import the `site` folder.
- **Netlify:** build command `npm run build`, publish directory `dist`.
