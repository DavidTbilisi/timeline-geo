// Tiny logger for scripts/ CLI tools.
//
// Each line is prefixed with a UTC timestamp and the script name so output
// stays readable when multiple scripts run back-to-back. Levels: info / warn /
// error / debug. `debug` is off by default; set TL_DEBUG=1 in the env to
// surface it.
//
// Usage:
//   import { mkLog } from './_log.mjs'
//   const log = mkLog('fetchDetails')
//   log.info('starting', { slugs: 591 })
//   log.warn('retry', { slug, attempt })
//   log.error('failed', err)
//   log.debug('raw payload', obj)

const DEBUG = process.env.TL_DEBUG === '1' || process.env.TL_DEBUG === 'true'

function ts() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

function fmt(level, name, args) {
  const head = `[${ts()}] [${name}] [${level}]`
  return [head, ...args]
}

export function mkLog(name) {
  return {
    info:  (...a) => console.log(...fmt('info',  name, a)),
    warn:  (...a) => console.warn(...fmt('warn',  name, a)),
    error: (...a) => console.error(...fmt('error', name, a)),
    debug: (...a) => { if (DEBUG) console.log(...fmt('debug', name, a)) },
    // A simple progress-line helper that overwrites the current terminal line
    // (used by long-running scripts to avoid scrolling thousands of lines).
    // Falls back to a normal info line when stdout isn't a TTY.
    progress(msg) {
      if (process.stdout.isTTY) {
        process.stdout.write(`\r[${ts()}] [${name}] ${msg}                          `)
      } else {
        console.log(...fmt('info', name, [msg]))
      }
    },
    progressDone() {
      if (process.stdout.isTTY) process.stdout.write('\n')
    },
  }
}
