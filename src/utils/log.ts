// Lightweight namespaced logger for diagnosing the app at runtime.
//
// On in `import.meta.env.DEV`, off in production builds. The DEV check is a
// static replacement by Vite, so the `if` branches below tree-shake away in
// `npm run build` — production bundles carry no log statements (errors still
// fire through `log.error`, which is always on).
//
// Channels: route, store, data, ui, i18n, search, nav, boot.
// Override in dev via the browser console:
//   __log.enable('route', 'data')     // only these channels
//   __log.enable('*')                 // all channels (default in dev)
//   __log.disable()                   // silence everything except errors
// Selection persists across reloads in localStorage under 'tl-log'.

type Channel = 'route' | 'store' | 'data' | 'ui' | 'i18n' | 'search' | 'nav' | 'boot'

const ALL: Channel[] = ['route', 'store', 'data', 'ui', 'i18n', 'search', 'nav', 'boot']
const STORAGE_KEY = 'tl-log'
const DEV = !!import.meta.env.DEV

const channelColors: Record<Channel, string> = {
  route:  '#60a5fa', // blue
  store:  '#a78bfa', // purple
  data:   '#34d399', // green
  ui:     '#f472b6', // pink
  i18n:   '#fbbf24', // amber
  search: '#22d3ee', // cyan
  nav:    '#fb923c', // orange
  boot:   '#9ca3af', // gray
}

let enabled = new Set<Channel>(ALL)

function loadEnabled(): Set<Channel> {
  if (!DEV) return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw == null) return new Set(ALL)
    if (raw === 'off') return new Set()
    if (raw === '*' || raw === '') return new Set(ALL)
    const picks = raw.split(',').map(s => s.trim()).filter(Boolean) as Channel[]
    return new Set(picks.filter(c => ALL.includes(c)))
  } catch {
    return new Set(ALL)
  }
}
enabled = loadEnabled()

function persist() {
  try {
    if (enabled.size === ALL.length) localStorage.removeItem(STORAGE_KEY)
    else if (enabled.size === 0) localStorage.setItem(STORAGE_KEY, 'off')
    else localStorage.setItem(STORAGE_KEY, [...enabled].join(','))
  } catch { /* ignore */ }
}

function emit(channel: Channel, args: unknown[]) {
  if (!DEV) return
  if (!enabled.has(channel)) return
  const color = channelColors[channel]
  // %c styles the prefix so channels are easy to scan in DevTools.
  console.log(`%c[${channel}]`, `color:${color};font-weight:bold`, ...args)
}

function make(channel: Channel) {
  return (...args: unknown[]) => emit(channel, args)
}

export const log = {
  route:  make('route'),
  store:  make('store'),
  data:   make('data'),
  ui:     make('ui'),
  i18n:   make('i18n'),
  search: make('search'),
  nav:    make('nav'),
  boot:   make('boot'),
  // Errors always log, in dev and production, no namespace gate.
  error: (...args: unknown[]) => console.error('[error]', ...args),
  warn:  (...args: unknown[]) => DEV && console.warn('[warn]', ...args),
}

// Expose runtime controls on window for ad-hoc filtering in the console.
if (DEV && typeof window !== 'undefined') {
  ;(window as unknown as { __log: unknown }).__log = {
    enable(...channels: Channel[] | ['*']) {
      enabled = channels.length === 0 || channels[0] === '*'
        ? new Set(ALL)
        : new Set(channels.filter(c => ALL.includes(c as Channel)) as Channel[])
      persist()
      return [...enabled]
    },
    disable() { enabled = new Set(); persist(); return [] },
    state() { return { enabled: [...enabled], all: ALL } },
  }
}
