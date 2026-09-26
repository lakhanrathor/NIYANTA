import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import '@fontsource/noto-serif-devanagari/devanagari-500.css'
import { CountUp, EASE } from '../components/motion'
import { Icon } from '../components/Icon'
import { YouTubeEmbed, YouTubeThumb } from '../components/Media'
import { breachCheck, impactStats, problem, references, roadmap, scenarios, validationCases } from '../content/project'
import { simulationReels, videos, youtubeId } from '../content/videos'
import { team, teamMeta } from '../content/team'

const FloodSim = lazy(() => import('../components/three/FloodSim'))

function Tile({ title, className = '', children, i = 0, onClick }: { title?: string; className?: string; children: ReactNode; i?: number; onClick?: () => void }) {
  return (
    <motion.section
      className={`card relative flex min-h-0 flex-col overflow-hidden !rounded-2xl p-4 ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: i * 0.05 }}
      onClick={onClick}
    >
      {title && <p className="eyebrow mb-3 !text-[0.62rem]">{title}</p>}
      {children}
    </motion.section>
  )
}

/** Centered popup card over a dimmed page. Esc, backdrop or the close button closes it. */
function Modal({ open, onClose, label, className = '', children }: { open: boolean; onClose: () => void; label: string; className?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { e.stopPropagation(); onClose() }}
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          <motion.div
            className={`card card-dark relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden !rounded-2xl ${className}`}
            initial={{ scale: 0.95, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-ink/70 ring-1 ring-line-strong" aria-label="Close">
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
            <div className="min-h-0 overflow-y-auto overscroll-contain">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

const THEMES = [
  { id: 'cloud', name: 'Cloud', swatch: 'linear-gradient(135deg,#ffffff,#cfe9f7)' },
  { id: 'sky', name: 'Sky', swatch: 'linear-gradient(135deg,#e3f0ff,#8ab8f5)' },
]

/** Palette picker; the choice is remembered in this browser only. */
function ThemePicker() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'cloud')
  const pick = (id: string) => {
    setTheme(id)
    if (id === 'cloud') delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = id
    try { localStorage.setItem('niyanta-theme', id) } catch { /* storage blocked */ }
  }
  return (
    <div className="flex items-center gap-1 rounded-full bg-[var(--chip-bg)] p-1 ring-1 ring-line-strong" role="radiogroup" aria-label="Colour theme">
      {THEMES.map((t) => (
        <button
          key={t.id}
          role="radio"
          aria-checked={theme === t.id}
          title={t.name}
          aria-label={t.name}
          onClick={() => pick(t.id)}
          className={`h-5 w-5 rounded-full ring-1 ring-black/10 transition-transform hover:scale-110 ${theme === t.id ? 'outline-2 outline-offset-2 outline-aqua' : ''}`}
          style={{ background: t.swatch }}
        />
      ))}
    </div>
  )
}

function Header() {
  return (
    <header className="flex items-center justify-between gap-4 lg:col-span-12">
      <div className="flex items-center gap-3">
        <img src="/media/logo-emblem.webp" alt="" className="h-9 w-9 rounded-full bg-white object-contain p-0.5" />
        <span className="font-semibold tracking-[0.2em]">NIYANTA</span>
        <span className="hidden text-sm text-muted md:inline">· Intelligence that <span className="serif-accent text-aqua">guides action</span></span>
      </div>
      <div className="flex items-center gap-2">
        <ThemePicker />
        <span className="chip hidden sm:inline-flex">PS {problem.id}</span>
        <span className="chip hidden md:inline-flex">{problem.theme}</span>
        <img src="/media/sih-2026.webp" alt="Smart India Hackathon 2026" className="h-9 rounded-lg bg-white px-1.5 py-1" />
      </div>
    </header>
  )
}

function Identity() {
  return (
    <Tile className="![background:#ffffff] lg:col-span-3" i={0}>
      <div className="relative flex h-full flex-col">
        <p className="font-['Noto_Serif_Devanagari'] text-4xl leading-none xl:text-5xl">नियंता</p>
        <p className="mt-2 text-sm text-muted">Sanskrit / Hindi: <span className="text-fg">one who guides, regulates and directs.</span></p>
        <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <p className="text-[14px] leading-relaxed text-muted">
            From the root <span className="font-['Noto_Serif_Devanagari'] text-aqua">√यम्</span> (yam): to restrain, control, regulate or guide, with <span className="text-fg">ni-</span> adding directed control.
          </p>
          <div className="flex flex-wrap gap-1">
            {['Controller', 'Regulator', 'One who directs', 'One who guides'].map((u) => (
              <span key={u} className="rounded-full bg-[var(--chip-bg)] px-2 py-0.5 text-[11px] ring-1 ring-line">{u}</span>
            ))}
          </div>
          <p className="text-[14px] leading-relaxed">
            <span className="text-[15px] font-semibold text-aqua">Someone who brings a situation under direction and enables an appropriate response.</span>
          </p>
          <div className="rounded-xl bg-[var(--chip-bg)] p-3 ring-1 ring-line">
            <p className="eyebrow !text-[0.6rem]">Why the name fits</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
              NIYANTA doesn’t claim to control nature or stop a flood. It helps control the <span className="text-fg">response</span>: turning complex data into informed decisions.
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-muted">
              {['Uncertainty', 'Understanding', 'Prediction', 'Prioritization', 'Action'].map((w, k, a) => (
                <span key={w} className="flex items-center gap-1">
                  <span className={k === a.length - 1 ? 'font-semibold text-aqua' : 'text-fg'}>{w}</span>
                  {k < a.length - 1 && <span className="text-dim">→</span>}
                </span>
              ))}
            </p>
          </div>
          <p className="text-[14px] leading-relaxed text-muted">
            A decision-support system for <span className="text-fg">dam-break flood modelling</span>. It turns satellite, terrain and hydrodynamic data into flood extent, depth, velocity and arrival time, so authorities can act before the water arrives.
          </p>
          <div>
            <p className="eyebrow mb-1.5 !text-[0.6rem]">From data to action</p>
            <ol className="grid grid-cols-2 gap-1.5">
              {[
                ['Observe', 'Satellite, DEM, hydrology'],
                ['Understand', 'GIS preprocessing'],
                ['Simulate', 'Breach + DualSPHysics + Delft3D'],
                ['Assess', 'Depth, velocity, arrival'],
                ['Identify', 'People, buildings, roads'],
                ['Validate', 'Sentinel-1 + Earth Engine'],
                ['Guide', 'NIYANTA dashboard'],
                ['Act', 'Decision support'],
              ].map(([st, w], i) => (
                <li key={st} className="rounded-lg bg-[var(--chip-bg)] px-2 py-1.5 ring-1 ring-line">
                  <p className="text-[11.5px] font-semibold"><span className="mr-1 font-mono text-[10px] text-dim">{String(i + 1).padStart(2, '0')}</span>{st}</p>
                  <p className="text-[10.5px] leading-tight text-muted">{w}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </Tile>
  )
}

/** Muted YouTube clip with our own play/pause + scrubber, looping a fixed window. */
function ReelPlayer({ id, start, seconds, caption, url }: { id: string; start: number; seconds: number; caption: string; url: string }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false) // poster until the first play
  const [t, setT] = useState(0) // seconds into the clip

  const send = useCallback((func: string, args: unknown[] = []) => {
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*')
  }, [])

  // YouTube reports currentTime via postMessage once we say we're listening
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (typeof e.data !== 'string' || !e.origin.includes('youtube')) return
      try {
        const d = JSON.parse(e.data)
        const now = d?.info?.currentTime
        if (typeof now !== 'number') return
        const rel = now - start
        if (rel >= seconds || rel < -1) send('seekTo', [start, true])
        else setT(Math.max(0, rel))
      } catch { /* not ours */ }
    }
    window.addEventListener('message', onMsg)
    const hello = setInterval(() => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening' }), '*'), 1000)
    return () => {
      window.removeEventListener('message', onMsg)
      clearInterval(hello)
    }
  }, [start, seconds, send])

  const toggle = () => {
    send(playing ? 'pauseVideo' : 'playVideo')
    setPlaying(!playing)
    setStarted(true)
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-black [container-type:size]">
      <iframe
        ref={frame}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[max(100%,56.25cqw)] w-[max(100%,177.78cqh)] -translate-x-1/2 -translate-y-1/2"
        src={`https://www.youtube-nocookie.com/embed/${id}?enablejsapi=1&autoplay=0&mute=1&start=${start}&controls=0&modestbranding=1&playsinline=1&rel=0&disablekb=1`}
        title={caption}
        allow="autoplay; encrypted-media; picture-in-picture"
      />
      {!started && (
        <button onClick={toggle} className="group absolute inset-0 z-[1]" aria-label="Play real footage">
          <YouTubeThumb url={url} title={caption} className="h-full w-full" />
          <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-fg shadow-xl transition-transform group-hover:scale-110">
            <Icon name="play" className="h-6 w-6" />
          </span>
        </button>
      )}
      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/70 via-transparent to-black/30" />
      <div className="absolute inset-x-0 bottom-0 z-[3] space-y-2 p-3">
        <div className="flex items-end justify-between gap-3">
          <p className="text-xs text-white">{caption}</p>
          <a href={url} target="_blank" rel="noreferrer" className="chip shrink-0 !bg-ink/70 hover:!text-fg">
            Watch with sound <Icon name="arrowUpRight" className="h-3 w-3" />
          </a>
        </div>
        <div className="glass flex items-center gap-3 rounded-xl px-3 py-2">
          <button onClick={toggle} className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-fg text-ink" aria-label={playing ? 'Pause' : 'Play'}>
            <Icon name={playing ? 'pause' : 'play'} className="h-3 w-3" />
          </button>
          <input
            type="range"
            className="range flex-1"
            min={0}
            max={seconds}
            step={0.1}
            value={t}
            style={{ ['--p' as string]: `${(t / seconds) * 100}%` }}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              setT(v)
              send('seekTo', [start + v, true])
            }}
            aria-label="Clip position"
          />
          <span className="shrink-0 whitespace-nowrap text-right font-mono text-[11px] tabular-nums text-muted">
            {Math.floor(t)}s / {seconds}s
          </span>
        </div>
      </div>
    </div>
  )
}

function Simulation() {
  const tabs = [...simulationReels.map((r) => r.label), 'Interactive 3D']
  const [tab, setTab] = useState(tabs.length - 1) // open on the 3D model
  const reel = simulationReels[tab]
  const id = reel ? youtubeId(reel.url) : null
  return (
    <Tile className="!p-0 max-lg:h-[60vh] lg:col-span-12" i={1}>
      {id && reel ? (
        <ReelPlayer id={id} start={reel.start} seconds={reel.seconds} caption={reel.caption} url={reel.url} />
      ) : (
        <Suspense fallback={<div className="grid h-full place-items-center font-mono text-xs text-dim">Loading 3D…</div>}>
          <FloodSim />
        </Suspense>
      )}
      <div className={`absolute left-1/2 z-10 flex -translate-x-1/2 rounded-full bg-ink/70 p-0.5 ring-1 ring-line-strong backdrop-blur ${id ? 'top-3' : 'bottom-[3.7rem]'}`}>
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] transition-colors ${tab === i ? 'bg-aqua text-ink' : 'text-muted hover:text-fg'}`}>
            {t}
          </button>
        ))}
      </div>
    </Tile>
  )
}

const PAPER_URL = 'https://docs.google.com/document/d/19pTYxYWuT0p_naN2KaG0I4K9a7KnYG69/edit'

/** Middle tile (player + research paper) and right tile (playlist) share one selection. */
/** ?video=N (1-based) in the URL opens the site with that demo already playing — used for links in the PPT. */
function linkedVideo() {
  const n = Number(new URLSearchParams(window.location.search).get('video'))
  return Number.isInteger(n) && n >= 1 && n <= videos.length && youtubeId(videos[n - 1].url) ? n - 1 : null
}

function Demos() {
  const [deep] = useState(linkedVideo)
  const [active, setActive] = useState(deep ?? 0)
  const [playing, setPlaying] = useState(deep !== null)
  // browsers only allow autoplay without a click when muted; one tap then restarts it with sound
  const [muted, setMuted] = useState(deep !== null)
  const player = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (deep !== null) player.current?.scrollIntoView({ block: 'center' })
  }, [deep])
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const v = videos[active]
  const ok = !!youtubeId(v.url)
  return (
    <>
      <Tile title="Demo videos" className="lg:col-span-6" i={2}>
        <div ref={player} className="relative aspect-video shrink-0 overflow-hidden rounded-xl bg-black">
          {playing && ok ? (
            <>
              <YouTubeEmbed key={`${v.url}-${muted}`} url={v.url} title={v.title} muted={muted} />
              {muted && (
                <button onClick={() => setMuted(false)} className="absolute left-1/2 top-[62%] z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-aqua px-4 py-2 text-sm font-medium text-white shadow-lg ring-2 ring-white/70 animate-pulse">
                  <Icon name="play" className="h-3.5 w-3.5" /> Tap to play with sound
                </button>
              )}
            </>
          ) : (
            <button className="group absolute inset-0 disabled:cursor-default" disabled={!ok} onClick={() => setPlaying(true)} aria-label={`Play ${v.title}`}>
              <YouTubeThumb url={v.url} title={v.title} className="h-full w-full" />
              {ok && (
                <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-fg transition-transform group-hover:scale-110">
                  <Icon name="play" className="h-5 w-5" />
                </span>
              )}
            </button>
          )}
        </div>
        <p className="mt-2 text-sm font-medium leading-snug">{v.title}</p>

        <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-xl bg-[var(--chip-bg)] p-3 ring-1 ring-line">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow !text-[0.6rem]">Our research paper</p>
              <p className="mt-1 text-[15px] font-semibold leading-snug">NIYANTA: Dam-break inundation modelling for Tehri Dam</p>
            </div>
            <Icon name="doc" className="h-6 w-6 shrink-0 text-aqua" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <a href={PAPER_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-aqua px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-transform hover:scale-[1.03]">
              Read our research paper <Icon name="arrowUpRight" className="h-3.5 w-3.5" />
            </a>
            <button onClick={() => setOpen(true)} className="chip hover:!text-fg">Method, roadmap &amp; references</button>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            We model a Tehri Dam breach end to end: Froehlich (2008) breach parameters, DualSPHysics near the dam and ANUGA / Delft3D routing over the 30 m Copernicus DEM. Our peak breach flow of <span className="font-medium text-fg">6.59 lakh m³/s</span> is the same order as the only published Tehri study, with first flood arrival in about <span className="font-medium text-fg">1 hour</span> and ~2.66 lakh people exposed.
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {validationCases.map((c) => (
              <div key={c.name} className="rounded-lg bg-surface/70 p-2 ring-1 ring-line">
                <p className="text-sm font-semibold">{c.accuracy}</p>
                <p className="text-[10.5px] leading-tight text-muted">{c.name.split(',')[0].split(' (')[0]}</p>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] text-muted">Peak breach flow at Tehri Dam (m³/s)</p>
            <BreachBars />
          </div>
        </div>
        <ResearchModal open={open} onClose={close} />
      </Tile>

      <Tile title="All videos" className="lg:col-span-3" i={4}>
        <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {videos.map((x, i) => (
            <li key={x.title}>
              <button
                onClick={() => { setActive(i); setPlaying(!!youtubeId(x.url)); setMuted(false) }}
                className={`w-full overflow-hidden rounded-xl p-1.5 text-left transition-colors ${i === active ? 'bg-aqua/10 ring-1 ring-aqua/30' : 'hover:bg-aqua/5'}`}
              >
                <span className="relative block aspect-video w-full overflow-hidden rounded-lg">
                  <YouTubeThumb url={x.url} title={x.title} className="h-full w-full" />
                  {i === active && playing && <span className="absolute left-2 top-2 rounded-full bg-aqua px-2 py-0.5 text-[10px] font-medium text-white">Now playing</span>}
                </span>
                <span className="mt-1.5 block px-0.5 font-mono text-[9.5px] uppercase tracking-wider text-dim">{x.tag}{youtubeId(x.url) ? '' : ' · soon'}</span>
                <span className="block px-0.5 text-[13px] leading-snug">{x.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </Tile>
    </>
  )
}

function Impact() {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  return (
    <Tile title="The problem · our approach" className="lg:col-span-12" i={3}>
      <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
        <div className="flex min-h-0 flex-col gap-5 lg:justify-center">
          <h2 className="display text-[clamp(1.6rem,2.6vw,2.4rem)] leading-tight">
            When a dam fails, people downstream have <span className="text-aqua">minutes, not hours.</span>
          </h2>
          <p className="text-[15px] leading-relaxed text-muted">
            India has thousands of ageing dams and millions of people living below them. When one fails, the flood can reach towns within <span className="font-medium text-fg">minutes to hours</span>, and most studies are static maps that don’t say who is at risk or when the water arrives.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {impactStats.map((st) => (
              <a key={st.label} href={st.href} target="_blank" rel="noreferrer" className="flex flex-col justify-center rounded-xl bg-ink/60 p-4 ring-1 ring-line transition-colors hover:ring-aqua/40">
                <p className="text-[clamp(1.5rem,2.4vw,2.4rem)] font-semibold tracking-tight">
                  <CountUp value={st.value} decimals={st.decimals} prefix={st.prefix} suffix={st.suffix} duration={1.4} />
                </p>
                <p className="mt-1 text-[13.5px] leading-snug text-muted">{st.label}</p>
                <p className="mt-1.5 font-mono text-[9.5px] uppercase tracking-wider text-dim">{st.source} ↗</p>
              </a>
            ))}
          </div>
        </div>
        <div className="flex min-h-0 flex-col gap-3 lg:justify-center">
          <p className="eyebrow !text-[0.65rem]">Our approach · three ways a dam fails</p>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {scenarios.map((sc) => (
              <div key={sc.n} className="flex min-h-0 flex-col overflow-hidden rounded-xl bg-ink/60 ring-1 ring-line">
                <img src={sc.cases[0].image} alt={sc.cases[0].name} className="aspect-[16/10] w-full object-cover lg:max-xl:aspect-[5/1] xl:aspect-[4/3]" />
                <div className="flex flex-col p-3">
                  <p className="text-[14px] font-semibold"><span className="mr-1 font-mono text-aqua">{sc.n}</span>{sc.title}</p>
                  <p className="mt-1 text-[12.5px] leading-snug text-muted">{sc.short}</p>
                  <p className="mt-2 text-[11px] leading-snug text-dim">{sc.chain.join(' → ')}</p>
                  <a href={sc.cases[0].href} target="_blank" rel="noreferrer" className="pt-2 text-[11.5px] text-aqua hover:underline">e.g. {sc.cases[0].name} ↗</a>
                </div>
              </div>
            ))}
          </div>
          <div>
            <p className="eyebrow mb-2 !text-[0.65rem]">What NIYANTA delivers</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                ['Flood extent', 'Inundation map'],
                ['Depth & velocity', 'd(x,t), v(x,t)'],
                ['Arrival time', 'At key towns'],
                ['People at risk', 'WorldPop / Census'],
                ['Infrastructure', 'Roads, bridges (OSM)'],
                ['Reports', 'PDF · GeoTIFF · KML'],
              ].map(([t, d]) => (
                <div key={t} className="rounded-lg bg-aqua/5 px-3 py-2 ring-1 ring-aqua/20">
                  <p className="text-[13px] font-semibold">{t}</p>
                  <p className="text-[11.5px] text-muted">{d}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-aqua/10 px-4 py-3 ring-1 ring-aqua/30">
            <p className="text-[13px] text-muted">All three feed one engine: <span className="font-medium text-fg">breach model → outflow hydrograph → hydrodynamic solver</span></p>
            <button onClick={() => setOpen(true)} className="chip hover:!text-fg">All details <Icon name="arrowUpRight" className="h-3 w-3" /></button>
          </div>
        </div>
      </div>

      <Modal open={open} onClose={close} label="The problem and our approach" className="max-w-[720px]">
        <div className="space-y-4 p-5 pr-10">
          <div>
            <p className="eyebrow mb-1 !text-[0.62rem]">The problem</p>
            <p className="text-[15px] leading-relaxed text-muted">
              India has thousands of ageing large dams and millions of people living downstream. When a dam fails, the flood wave can reach towns within <span className="text-fg">minutes to hours</span>. Most existing studies are static maps that don’t say who is at risk or when the water arrives.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {impactStats.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="rounded-xl bg-ink/60 p-2.5 ring-1 ring-line hover:ring-aqua/40">
                <p className="text-lg font-semibold tracking-tight">{s.prefix ?? ''}{s.value.toLocaleString('en-IN')}{s.suffix}</p>
                <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{s.label}</p>
                <p className="mt-1 font-mono text-[10.5px] uppercase tracking-wider text-dim">{s.source} ↗</p>
              </a>
            ))}
          </div>
          <div>
            <p className="eyebrow mb-2 !text-[0.62rem]">Our approach · three ways a dam fails</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {scenarios.map((s) => (
                <div key={s.n} className="overflow-hidden rounded-xl bg-ink/60 ring-1 ring-line">
                  <img src={s.cases[0].image} alt={s.cases[0].name} className="aspect-[3/1] w-full object-cover sm:aspect-[16/9]" />
                  <div className="p-2.5">
                    <p className="text-[13px] font-semibold"><span className="font-mono text-aqua">{s.n}</span> {s.title}</p>
                    <p className="mt-1 text-[12.5px] leading-snug text-muted">{s.short}</p>
                    <p className="mt-1.5 hidden text-[11.5px] leading-snug text-dim sm:block">{s.chain.join(' → ')}</p>
                    <a href={s.cases[0].href} target="_blank" rel="noreferrer" className="mt-1.5 block text-[11.5px] text-aqua hover:underline">e.g. {s.cases[0].name} ↗</a>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[12.5px] text-muted">
              All three feed one engine: <span className="text-fg">breach model → outflow hydrograph → hydrodynamic solver</span>, giving flood extent, depth, velocity, arrival time and the people and assets at risk.
            </p>
          </div>
        </div>
      </Modal>
    </Tile>
  )
}

const method = [
  { t: 'Study', b: 'Tehri dam-break study, SPH papers, GLOF research and past failures (Machhu II, Rishiganga, Kakhovka).' },
  { t: 'Collect', b: 'Copernicus DEMs, Sentinel-1/2 via Google Earth Engine, India-WRIS, IMD / ERA5, WorldPop, OSM.' },
  { t: 'Model', b: 'Froehlich (2008) breach + Fread (1988) hydrograph, DualSPHysics near the dam, ANUGA / Delft3D downstream.' },
  { t: 'Check', b: 'Peak flow vs published values, flood footprints vs real incidents.' },
]

function BreachBars({ detailed = false }: { detailed?: boolean }) {
  const max = Math.max(...breachCheck.map((b) => b.q))
  return (
    <div className="space-y-2">
      {breachCheck.map((b) => (
        <div key={b.model}>
          <div className="flex justify-between text-[11px]">
            <span className={b.ours ? 'text-aqua' : ''}>{b.model}</span>
            <span className="font-mono tabular-nums">{b.approx ? '≈3.9 L' : b.q.toLocaleString('en-IN')}</span>
          </div>
          <div className="mt-0.5 h-1.5 rounded-full bg-fg/10">
            <div className={`h-full rounded-full ${b.ours ? 'bg-aqua' : 'bg-dim/60'}`} style={{ width: `${(b.q / max) * 100}%` }} />
          </div>
          {detailed && <p className="mt-0.5 text-[10px] text-dim">{b.method}</p>}
        </div>
      ))}
    </div>
  )
}

function ResearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} label="Research and validation" className="max-w-[760px]">
      <div className="grid gap-5 p-5 pr-10 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <p className="eyebrow mb-2 !text-[0.62rem]">Method</p>
            <ol className="space-y-1.5">
              {method.map((m, i) => (
                <li key={m.t} className="text-[13px] leading-snug text-muted">
                  <span className="mr-1 font-mono text-aqua">{i + 1}.</span><span className="text-fg">{m.t}:</span> {m.b}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="eyebrow mb-2 !text-[0.62rem]">Roadmap</p>
            <ol className="flex flex-wrap gap-1">
              {roadmap.map((r) => (
                <li key={r.title} className={`rounded-full px-2 py-0.5 text-[11.5px] ring-1 ${r.status === 'done' ? 'text-aqua ring-aqua/40' : r.status === 'active' ? 'bg-flare/10 text-flare ring-flare/40' : 'text-dim ring-line-strong'}`}>
                  {r.status === 'done' ? '✓ ' : ''}{r.title}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="eyebrow mb-2 !text-[0.62rem]">Real-world validation</p>
            <ul className="space-y-1.5">
              {validationCases.map((c) => (
                <li key={c.name} className="flex gap-2 text-[13px] leading-snug">
                  <span className="w-14 shrink-0 font-semibold">{c.accuracy}</span>
                  <span className="text-muted"><span className="text-fg">{c.name}.</span> {c.result}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="eyebrow mb-2 !text-[0.62rem]">Is our breach flow correct? · Peak Q (m³/s)</p>
            <BreachBars detailed />
          </div>
          <div>
            <p className="eyebrow mb-2 !text-[0.62rem]">References · {references.length}</p>
            <ul className="space-y-0.5">
              {references.map((r, i) => (
                <li key={r.title} className="text-[12.5px] leading-snug">
                  <span className="font-mono text-dim">{String(i + 1).padStart(2, '0')} </span>
                  <a href={r.href} target="_blank" rel="noreferrer" className="hover:text-aqua" title={`${r.title} · ${r.authors} (${r.year})`}>{r.title}</a>
                  <span className="text-dim"> · {r.authors.split(',')[0]}{r.year !== '—' && ` ${r.year}`}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function Team() {
  const [open, setOpen] = useState<number | null>(null)
  const m = open === null ? null : team[open]
  const close = useCallback(() => setOpen(null), [])
  return (
    <Tile title={`Know our team · ${teamMeta.teamName}`} className="lg:col-span-12" i={5}>
      <div className="grid min-h-0 flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
        {team.map((x, i) => (
          <button key={x.name} onClick={() => setOpen(i)} className="group flex min-h-0 overflow-hidden rounded-xl bg-ink/60 text-left ring-1 ring-line transition-colors hover:ring-aqua/40" aria-label={`About ${x.name}`}>
            <span className="relative w-2/5 shrink-0 overflow-hidden max-lg:aspect-[4/5]">
              {x.photo && <img src={x.photo} alt={x.name} className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />}
            </span>
            <span className="flex min-w-0 flex-1 flex-col p-3">
              <span className="text-[15px] font-semibold leading-tight">{x.name}</span>
              <span className="mt-0.5 text-[12px] text-aqua">{x.role}</span>
              <span className="mt-2 min-h-0 overflow-hidden text-[13px] leading-relaxed text-muted">{x.bio}</span>
              <span className="mt-auto flex flex-wrap gap-1 pt-2">
                {x.expertise.slice(0, 4).map((e) => <span key={e} className="chip !px-2 !py-0.5 !text-[10px]">{e}</span>)}
              </span>
            </span>
          </button>
        ))}
      </div>

      <Modal open={!!m} onClose={close} label={m?.name ?? ''} className="max-w-[290px]">
        {m && (
          <>
            {m.photo && <img src={m.photo} alt={m.name} className="aspect-square w-full object-cover object-top" />}
            <div className="p-3">
              <p className="text-sm font-semibold">{m.name}</p>
              <p className="text-[11px] text-aqua">{m.role}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{m.bio}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {m.expertise.map((e) => <span key={e} className="chip !px-2 !py-0.5 !text-[10px]">{e}</span>)}
              </div>
            </div>
          </>
        )}
      </Modal>
    </Tile>
  )
}

export default function Home() {
  // four full-screen "pages" stacked vertically; on phones everything stacks in one column
  const screen = 'grid gap-3 p-3 lg:h-[100dvh] lg:grid-cols-12 lg:overflow-hidden'
  return (
    <main>
      <section className={`${screen} lg:grid-rows-[auto_minmax(0,1fr)]`}>
        <Header />
        <Identity />
        <Demos />
      </section>
      <section className={`${screen} max-lg:pt-0 lg:grid-rows-[minmax(0,1fr)]`}>
        <Simulation />
      </section>
      <section className={`${screen} max-lg:pt-0 lg:grid-rows-[minmax(0,1fr)]`}>
        <Impact />
      </section>
      <section className={`${screen} max-lg:pt-0 lg:grid-rows-[minmax(0,1fr)]`}>
        <Team />
      </section>
    </main>
  )
}
