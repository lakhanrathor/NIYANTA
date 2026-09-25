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

const TopoField = lazy(() => import('../components/three/TopoField'))
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
            className={`card relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden !rounded-2xl ${className}`}
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

function Header() {
  return (
    <header className="flex items-center justify-between gap-4 lg:col-span-12">
      <div className="flex items-center gap-3">
        <img src="/media/logo-emblem.webp" alt="" className="h-9 w-9 rounded-full bg-white object-contain p-0.5" />
        <span className="font-semibold tracking-[0.2em]">NIYANTA</span>
        <span className="hidden text-sm text-muted md:inline">· Intelligence that <span className="serif-accent text-aqua">guides action</span></span>
      </div>
      <div className="flex items-center gap-2">
        <span className="chip hidden sm:inline-flex">PS {problem.id}</span>
        <span className="chip hidden md:inline-flex">{problem.theme}</span>
        <img src="/media/sih-2026.webp" alt="Smart India Hackathon 2026" className="h-9 rounded-lg bg-white px-1.5 py-1" />
      </div>
    </header>
  )
}

function Identity() {
  const steps = ['Observe', 'Simulate', 'Assess', 'Validate', 'Guide', 'Act']
  return (
    <Tile className="lg:col-span-3" i={0}>
      <Suspense fallback={null}>
        <TopoField className="absolute inset-0 opacity-35" />
      </Suspense>
      <div className="relative flex h-full flex-col">
        <p className="font-['Noto_Serif_Devanagari'] text-4xl leading-none xl:text-5xl">नियंता</p>
        <p className="mt-2 text-sm text-muted">Sanskrit / Hindi: <span className="text-fg">one who guides, regulates and directs.</span></p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          A decision-support system for <span className="text-fg">dam-break flood modelling</span>. It turns satellite, terrain and hydrodynamic data into flood extent, depth, velocity and arrival time, so authorities can act before the water arrives.
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-1 pt-3 text-[11px]">
          {steps.map((s, k) => (
            <span key={s} className="flex items-center gap-1">
              <span className={`rounded-full px-2 py-0.5 ring-1 ${k === steps.length - 1 ? 'bg-aqua/10 text-aqua ring-aqua/40' : 'ring-line-strong'}`}>{s}</span>
              {k < steps.length - 1 && <span className="text-dim">→</span>}
            </span>
          ))}
        </div>
      </div>
    </Tile>
  )
}

/** Muted YouTube clip with our own play/pause + scrubber, looping a fixed window. */
function ReelPlayer({ id, start, seconds, caption, url }: { id: string; start: number; seconds: number; caption: string; url: string }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [playing, setPlaying] = useState(true)
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
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-black [container-type:size]">
      <iframe
        ref={frame}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[max(100%,56.25cqw)] w-[max(100%,177.78cqh)] -translate-x-1/2 -translate-y-1/2"
        src={`https://www.youtube-nocookie.com/embed/${id}?enablejsapi=1&autoplay=1&mute=1&start=${start}&controls=0&modestbranding=1&playsinline=1&rel=0&disablekb=1`}
        title={caption}
        allow="autoplay; encrypted-media; picture-in-picture"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/40" />
      <div className="absolute inset-x-0 bottom-0 space-y-2 p-3">
        <div className="flex items-end justify-between gap-3">
          <p className="text-xs text-fg/90">{caption}</p>
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
  const [tab, setTab] = useState(0)
  const reel = simulationReels[tab]
  const id = reel ? youtubeId(reel.url) : null
  return (
    <Tile className="!p-0 max-lg:h-[60vh] lg:col-span-6" i={1}>
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

function Demos() {
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(false)
  const v = videos[active]
  const ok = !!youtubeId(v.url)
  return (
    <Tile title="Demo videos" className="lg:col-span-3 lg:row-span-2" i={2}>
      <div className="relative aspect-video shrink-0 overflow-hidden rounded-xl bg-black">
        {playing && ok ? (
          <YouTubeEmbed url={v.url} title={v.title} />
        ) : (
          <button className="group absolute inset-0 disabled:cursor-default" disabled={!ok} onClick={() => setPlaying(true)} aria-label={`Play ${v.title}`}>
            <YouTubeThumb url={v.url} title={v.title} className="h-full w-full" />
            {ok && (
              <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink transition-transform group-hover:scale-110">
                <Icon name="play" className="h-5 w-5" />
              </span>
            )}
          </button>
        )}
      </div>
      <p className="mt-2 text-sm font-medium leading-snug">{v.title}</p>
      <ul className="mt-3 flex min-h-0 flex-1 flex-col gap-1">
        {videos.map((x, i) => (
          <li key={x.title}>
            <button
              onClick={() => { setActive(i); setPlaying(!!youtubeId(x.url)) }}
              className={`flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition-colors ${i === active ? 'bg-white/[0.07] ring-1 ring-aqua/30' : 'hover:bg-white/[0.04]'}`}
            >
              <span className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-md">
                <YouTubeThumb url={x.url} title={x.title} className="h-full w-full [&_span]:hidden" />
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-[9px] uppercase tracking-wider text-dim">{x.tag}{youtubeId(x.url) ? '' : ' · soon'}</span>
                <span className="block text-xs leading-snug">{x.title}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Tile>
  )
}

function Impact() {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  return (
    <Tile title="The problem · our approach" className="cursor-pointer transition-colors hover:border-line-strong lg:col-span-3" i={3} onClick={() => setOpen(true)}>
      <div className="grid grid-cols-2 gap-2">
        {impactStats.slice(0, 4).map((s) => (
          <div key={s.label} className="rounded-xl bg-ink/60 p-2.5 ring-1 ring-line">
            <p className="text-xl font-semibold tracking-tight">
              <CountUp value={s.value} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} duration={1.4} />
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">Three failure scenarios, one hydrodynamic engine:</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {scenarios.map((s) => (
          <div key={s.n} className="relative overflow-hidden rounded-lg">
            <img src={s.cases[0].image} alt={s.cases[0].name} className="aspect-[4/3] w-full object-cover opacity-70" />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink to-transparent p-1.5 text-[10px] font-medium leading-tight">{s.title}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto flex justify-end pt-3">
        <span className="chip">Details <Icon name="arrowUpRight" className="h-3 w-3" /></span>
      </div>

      <Modal open={open} onClose={close} label="The problem and our approach" className="max-w-[720px]">
        <div className="space-y-4 p-5 pr-10">
          <div>
            <p className="eyebrow mb-1 !text-[0.62rem]">The problem</p>
            <p className="text-sm leading-relaxed text-muted">
              India has thousands of ageing large dams and millions of people living downstream. When a dam fails, the flood wave can reach towns within <span className="text-fg">minutes to hours</span>. Most existing studies are static maps that don’t say who is at risk or when the water arrives.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {impactStats.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="rounded-xl bg-ink/60 p-2.5 ring-1 ring-line hover:ring-aqua/40">
                <p className="text-lg font-semibold tracking-tight">{s.prefix ?? ''}{s.value.toLocaleString('en-IN')}{s.suffix}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted">{s.label}</p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-dim">{s.source} ↗</p>
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
                    <p className="text-xs font-semibold"><span className="font-mono text-aqua">{s.n}</span> {s.title}</p>
                    <p className="mt-1 text-[11px] leading-snug text-muted">{s.short}</p>
                    <p className="mt-1.5 hidden text-[10px] leading-snug text-dim sm:block">{s.chain.join(' → ')}</p>
                    <a href={s.cases[0].href} target="_blank" rel="noreferrer" className="mt-1.5 block text-[10px] text-aqua hover:underline">e.g. {s.cases[0].name} ↗</a>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted">
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
          <div className="mt-0.5 h-1.5 rounded-full bg-white/5">
            <div className={`h-full rounded-full ${b.ours ? 'bg-aqua' : 'bg-muted/50'}`} style={{ width: `${(b.q / max) * 100}%` }} />
          </div>
          {detailed && <p className="mt-0.5 text-[10px] text-dim">{b.method}</p>}
        </div>
      ))}
    </div>
  )
}

function Research() {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const done = roadmap.filter((r) => r.status === 'done').length
  return (
    <Tile title="Research & validation" className="cursor-pointer transition-colors hover:border-line-strong lg:col-span-3" i={4} onClick={() => setOpen(true)}>
      <p className="text-[11px] text-muted">Peak breach flow at Tehri Dam (m³/s)</p>
      <div className="mt-2"><BreachBars /></div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {validationCases.map((c) => (
          <div key={c.name} className="rounded-lg bg-ink/60 p-2 ring-1 ring-line">
            <p className="text-sm font-semibold">{c.accuracy}</p>
            <p className="text-[10px] leading-tight text-muted">{c.name.split(',')[0].split(' (')[0]}</p>
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-[11px]">
        <span className="text-muted">
          Roadmap <span className="text-fg">{done}/{roadmap.length}</span> · now: <span className="text-flare">{roadmap.find((r) => r.status === 'active')?.title}</span>
        </span>
        <span className="chip">Details <Icon name="arrowUpRight" className="h-3 w-3" /></span>
      </div>

      <Modal open={open} onClose={close} label="Research and validation" className="max-w-[760px]">
        <div className="grid gap-5 p-5 pr-10 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="eyebrow mb-2 !text-[0.62rem]">Method</p>
              <ol className="space-y-1.5">
                {method.map((m, i) => (
                  <li key={m.t} className="text-xs leading-snug text-muted">
                    <span className="mr-1 font-mono text-aqua">{i + 1}.</span><span className="text-fg">{m.t}:</span> {m.b}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="eyebrow mb-2 !text-[0.62rem]">Roadmap</p>
              <ol className="flex flex-wrap gap-1">
                {roadmap.map((r) => (
                  <li key={r.title} className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ${r.status === 'done' ? 'text-aqua ring-aqua/40' : r.status === 'active' ? 'bg-flare/10 text-flare ring-flare/40' : 'text-dim ring-line-strong'}`}>
                    {r.status === 'done' ? '✓ ' : ''}{r.title}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="eyebrow mb-2 !text-[0.62rem]">Real-world validation</p>
              <ul className="space-y-1.5">
                {validationCases.map((c) => (
                  <li key={c.name} className="flex gap-2 text-xs leading-snug">
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
              <p className="mt-2 rounded-lg border border-flare/30 bg-flare/[0.06] p-2 text-[11px] leading-snug text-muted">
                Same order as the only published Tehri study (ratio 0.67). Our first run was <span className="text-fg">5.8× too high</span>. Our own cross-check found a depth bug, and we fixed it.
              </p>
            </div>
            <div>
              <p className="eyebrow mb-2 !text-[0.62rem]">References · {references.length}</p>
              <ul className="space-y-0.5">
                {references.map((r, i) => (
                  <li key={r.title} className="text-[11px] leading-snug">
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
    </Tile>
  )
}

function Team() {
  const [open, setOpen] = useState<number | null>(null)
  const m = open === null ? null : team[open]
  const close = useCallback(() => setOpen(null), [])
  return (
    <Tile title={`Team ${teamMeta.teamName}`} className="lg:col-span-3" i={5}>
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
        {team.map((x, i) => (
          <button key={x.name} onClick={() => setOpen(i)} className="group relative min-h-[110px] overflow-hidden rounded-lg bg-raise text-left" aria-label={`About ${x.name}`}>
            {x.photo && <img src={x.photo} alt={x.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-1.5">
              <p className="text-[11px] font-semibold leading-tight">{x.name}</p>
              <p className="text-[9px] leading-tight text-aqua">{x.role.replace('Team Lead · ', 'Lead · ')}</p>
            </div>
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
  return (
    <main className="grid gap-3 p-3 lg:h-[100dvh] lg:grid-cols-12 lg:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)] lg:overflow-hidden">
      <Header />
      <Identity />
      <Simulation />
      <Demos />
      <Impact />
      <Research />
      <Team />
    </main>
  )
}
