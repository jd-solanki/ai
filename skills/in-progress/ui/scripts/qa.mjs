#!/usr/bin/env node
// Capture a screen on each device in each data state through playwright-cli, and report
// leads: breaks a screenshot hides. A lead is a place to look, never a finding.
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'

const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'

// name: [width, height, pixel ratio, mobile user agent or none]
const DEVICES = {
  'galaxy-s': [360, 780, 3, ANDROID],
  'iphone-se': [375, 667, 2, IOS],
  'iphone-15': [393, 852, 3, IOS],
  'iphone-15-pro-max': [430, 932, 3, IOS],
  'ipad-mini': [768, 1024, 2, IPAD],
  'ipad-air-landscape': [1180, 820, 2, IPAD],
  'laptop': [1366, 768, 1],
  'full-hd': [1920, 1080, 1],
  '5k': [2560, 1440, 2],
  '4k': [3840, 2160, 1],
}
const STATES = ['live', 'typical', 'worst', 'empty', 'loading', 'error']

const HELP = `Usage: node qa.mjs --url <page-url> [options]

  --url <url>          The screen to capture. Its query (?variant=) is kept.
  --devices <a,b>      Devices to use (default: all).
  --states <a,b>       Data states, set as ?data=<state> (default: ${STATES.join(',')}).
                       A screen with no data menu: --states live.
  --only <s-d,...>     Recapture only these <state>-<device> pairs.
  --extra <spec>       Add a device: <name>:<width>x<height>:<pixel-ratio>[:touch]. Repeatable.
  --out <dir>          Where screenshots and leads.json go (default: ${join(tmpdir(), 'ui-qa')}).
  --settle <ms>        Extra wait after load, for data pushed late (default: 800).
  --self-test          Check the leads on a page with planted breaks.

Devices:
${Object.entries(DEVICES).map(([n, [w, h, r, ua]]) => `  ${n.padEnd(20)}${w}x${h} @${r}${ua ? ' touch' : ''}`).join('\n')}

Writes <state>-<device>.png (full page), <state>-<device>-screen.png (first screen),
and leads.json. Elements marked data-dev-tool are hidden.`

// Runs inside playwright-cli, one call per device. Must stay self-contained.
async function captureDevice(page, cfg) {
  const browser = page.context().browser()
  if (!browser) throw new Error('playwright-cli opened a persistent profile; open without --persistent')
  const ctx = await browser.newContext({
    viewport: { width: cfg.width, height: cfg.height },
    deviceScaleFactor: cfg.ratio,
    isMobile: cfg.touch,
    hasTouch: cfg.touch,
    ...(cfg.ua ? { userAgent: cfg.ua } : {}),
  })
  if (cfg.html) await ctx.route('http://qa.test/**', r => r.fulfill({ body: cfg.html, contentType: 'text/html' }))
  const p = await ctx.newPage()
  const leads = []
  const blocks = {}

  for (const state of cfg.states) {
    const url = new URL(cfg.url)
    url.searchParams.set('data', state)
    await p.goto(url.href, { waitUntil: 'load' })
    await p.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
    await p.evaluate(() => document.fonts.ready)
    await p.waitForTimeout(cfg.settle)
    await p.addStyleTag({ content: '[data-dev-tool]{visibility:hidden!important}' })

    const name = `${state}-${cfg.device}`
    await p.screenshot({ path: `${cfg.out}/${name}.png`, fullPage: true, scale: 'css' })
    await p.screenshot({ path: `${cfg.out}/${name}-screen.png`, scale: 'css' })

    const found = await p.evaluate((deviceWidth) => {
      const out = []
      const tool = e => e.closest('[data-dev-tool]')
      const shown = e => {
        const s = getComputedStyle(e)
        const r = e.getBoundingClientRect()
        return s.visibility !== 'hidden' && s.opacity !== '0' && r.width > 0 && r.height > 0 && !tool(e)
      }
      const where = e => {
        if (e.id) return `#${e.id}`
        const parts = []
        for (let n = e; n && n !== document.body && parts.length < 4; n = n.parentElement) {
          const same = n.parentElement ? [...n.parentElement.children].filter(c => c.tagName === n.tagName) : []
          parts.unshift(n.tagName.toLowerCase() + (same.length > 1 ? `:nth-of-type(${same.indexOf(n) + 1})` : ''))
        }
        return parts.join(' > ')
      }
      const text = e => (e.innerText || e.getAttribute('aria-label') || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 60)
      const ownText = e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())
      const all = [...document.body.querySelectorAll('*')]

      // Wider than the device: sideways scroll, or a phone zooming out to fit.
      const pageWidth = Math.max(innerWidth, document.documentElement.scrollWidth)
      if (pageWidth > deviceWidth + 1) {
        // A fixed element stretches with the page, so it is never the cause.
        const wide = all.filter(e => e.getBoundingClientRect().right > deviceWidth + 1 && shown(e) && getComputedStyle(e).position !== 'fixed').slice(0, 500)
        const causes = wide.filter(e => !wide.some(o => o !== e && e.contains(o))).slice(0, 3)
        out.push({ kind: 'wider than the device', detail: `the page is ${pageWidth}px wide on a ${deviceWidth}px screen`, at: causes.map(e => `${where(e)} ("${text(e)}")`) })
      }

      // Text cut off by its own box.
      const cut = all.filter(e => {
        if (!ownText(e) || !shown(e)) return false
        const s = getComputedStyle(e)
        const across = e.scrollWidth > e.clientWidth + 1 && (['hidden', 'clip'].includes(s.overflowX) || s.textOverflow === 'ellipsis')
        const down = e.scrollHeight > e.clientHeight + 1 && ['hidden', 'clip'].includes(s.overflowY)
        return across || down
      })
      for (const e of cut.slice(0, 20)) out.push({ kind: 'text cut off', detail: `shows ${e.clientWidth}x${e.clientHeight} of ${e.scrollWidth}x${e.scrollHeight}px`, at: [`${where(e)} ("${text(e)}")`] })
      if (cut.length > 20) out.push({ kind: 'text cut off', detail: `${cut.length - 20} more not listed`, at: [] })

      // Content no scroll position can uncover: under a fixed top bar at the top, under a fixed bottom bar at the end.
      const bars = all.filter(e => getComputedStyle(e).position === 'fixed' && shown(e))
      const covered = (edge) => {
        for (const bar of bars) {
          const b = bar.getBoundingClientRect()
          if (edge === 'top' ? b.top > 1 : b.bottom < innerHeight - 1) continue
          const hit = all.filter(e => {
            if (bar.contains(e) || e.contains(bar) || !shown(e)) return false
            if (!ownText(e) && !e.matches('button, a, input, select, textarea, img')) return false
            const r = e.getBoundingClientRect()
            return Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top) > 4 && Math.min(r.right, b.right) - Math.max(r.left, b.left) > 4
          })
          if (hit.length) out.push({ kind: 'under a fixed bar', detail: `at the ${edge} of the scroll, ${where(bar)} covers it`, at: hit.slice(0, 3).map(e => `${where(e)} ("${text(e)}")`) })
        }
      }
      scrollTo(0, 0); covered('top')
      scrollTo(0, document.documentElement.scrollHeight); covered('bottom')
      scrollTo(0, 0)
      return out
    }, cfg.width)
    for (const lead of found) leads.push({ state, device: cfg.device, ...lead })

    // Block positions under main, for the loading-to-typical shift check.
    blocks[state] = await p.evaluate(() => {
      const root = document.querySelector('main') || document.body
      const out = {}
      const walk = (e, path, depth) => {
        if (depth > 3) return
        ;[...e.children].forEach((c, i) => {
          if (c.closest('[data-dev-tool]')) return
          const r = c.getBoundingClientRect()
          const key = `${path}>${c.tagName.toLowerCase()}:${i}`
          if (r.height > 0) out[key] = { top: Math.round(r.top + scrollY), height: Math.round(r.height), text: (c.innerText || '').trim().slice(0, 40) }
          walk(c, key, depth + 1)
        })
      }
      walk(root, root.tagName.toLowerCase(), 1)
      return out
    })
  }

  // Shift: a block on the first screen that sits elsewhere once data arrives. The first
  // one in the page is reported; the blocks below it usually move for the same cause.
  if (blocks.loading && blocks.typical) {
    const moved = Object.entries(blocks.typical)
      .filter(([k, t]) => blocks.loading[k] && t.top < cfg.height && Math.abs(t.top - blocks.loading[k].top) > 8)
      .sort(([, x], [, y]) => x.top - y.top)
    if (moved.length) {
      const [k, t] = moved[0]
      const more = moved.length > 1 ? `, and ${moved.length - 1} block(s) below it move too` : ''
      leads.push({ state: 'loading', device: cfg.device, kind: 'shift', detail: `moves ${t.top - blocks.loading[k].top}px when data arrives${more}`, at: [`${k} ("${t.text}")`] })
    }
  }

  await ctx.close()
  return leads
}

// playwright-cli writes snapshot files into its working directory, so it runs in the scratch one.
function cli(session, args, cwd) {
  return execFileSync('playwright-cli', [`-s=${session}`, ...args], { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

function run({ url, devices, states, only, out, settle, html }) {
  mkdirSync(out, { recursive: true })
  const session = `ui-qa-${process.pid}`
  const scratch = mkdtempSync(join(tmpdir(), 'ui-qa-code-'))
  const leads = []
  cli(session, ['open', 'about:blank'], scratch)
  try {
    for (const [device, [width, height, ratio, ua]] of Object.entries(devices)) {
      const want = states.filter(s => !only.length || only.includes(`${s}-${device}`))
      if (!want.length) continue
      const cfg = { url, device, width, height, ratio, touch: Boolean(ua), ua: ua === true ? null : ua, states: want, out, settle, html }
      const file = join(scratch, `${device}.js`)
      writeFileSync(file, `async page => (${captureDevice})(page, ${JSON.stringify(cfg)})`)
      const raw = cli(session, ['run-code', '--raw', '--filename', file], scratch)
      const found = JSON.parse(raw.slice(raw.indexOf('[')))
      leads.push(...found)
      console.log(`${device}: ${want.length} state(s), ${found.length} lead(s)`)
    }
  } finally {
    cli(session, ['close'], scratch)
    rmSync(scratch, { recursive: true, force: true })
  }
  writeFileSync(join(out, 'leads.json'), JSON.stringify(leads, null, 2))
  console.log(`Screenshots and leads.json in ${out}`)
  return leads
}

function selfTest() {
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:16px;font:16px/1.5 sans-serif}.cut{width:120px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.wide{width:500px}.bar{position:fixed;bottom:0;left:0;right:0;height:48px;background:#222;color:#fff}
.tool{position:fixed;top:0;left:0;right:0;height:40px;background:red}</style></head><body>
<main><section id="top"></section><div id="notice">Welcome back</div>
<p class="cut" id="hash">sha256:9f86d081884c7d659a2feaa0c55ad015a3bf</p><div class="wide" id="wide">500px</div>
<div style="height:1200px"></div><p id="last">Last line</p></main>
<div class="bar" id="bar">Fixed bar</div><div class="tool" data-dev-tool>Switcher</div>
<script>document.getElementById('top').style.height = location.search.includes('loading') ? '40px' : '200px'</script>
</body></html>`
  const out = mkdtempSync(join(tmpdir(), 'ui-qa-self-test-'))
  const leads = run({ url: 'http://qa.test/', devices: { 'iphone-se': DEVICES['iphone-se'], 'full-hd': DEVICES['full-hd'] }, states: ['loading', 'typical'], only: [], out, settle: 0, html })
  const has = (device, kind, at) => leads.some(l => l.device === device && l.state === 'typical' && l.kind === kind && l.at.some(a => a.includes(at)))
  const checks = [
    ['phone: the 500px box makes the page wider', has('iphone-se', 'wider than the device', '#wide')],
    ['laptop-wide: no width lead', !leads.some(l => l.device === 'full-hd' && l.kind === 'wider than the device')],
    ['the hash is cut off', has('full-hd', 'text cut off', '#hash')],
    ['the last line is under the fixed bar', has('full-hd', 'under a fixed bar', '#last')],
    ['the dev tool covers nothing', !leads.some(l => l.at.some(a => a.includes('#notice')))],
    ['the content moves when data arrives', leads.some(l => l.device === 'full-hd' && l.kind === 'shift')],
  ]
  for (const [name, ok] of checks) console.log(`${ok ? 'pass' : 'FAIL'}  ${name}`)
  rmSync(out, { recursive: true, force: true })
  if (checks.some(([, ok]) => !ok)) {
    console.log(JSON.stringify(leads, null, 2))
    process.exit(1)
  }
}

const { values: a } = parseArgs({
  options: {
    'url': { type: 'string' },
    'devices': { type: 'string' },
    'states': { type: 'string' },
    'only': { type: 'string' },
    'extra': { type: 'string', multiple: true },
    'out': { type: 'string', default: join(tmpdir(), 'ui-qa') },
    'settle': { type: 'string', default: '800' },
    'self-test': { type: 'boolean' },
    'help': { type: 'boolean' },
  },
})

if (a.help) {
  console.log(HELP)
} else if (a['self-test']) {
  selfTest()
} else {
  if (!a.url) {
    console.error('--url is required. See --help.')
    process.exit(2)
  }
  const all = { ...DEVICES }
  for (const spec of a.extra ?? []) {
    const m = spec.match(/^([\w-]+):(\d+)x(\d+):([\d.]+)(:touch)?$/)
    if (!m) {
      console.error(`Bad --extra "${spec}". Use <name>:<width>x<height>:<pixel-ratio>[:touch].`)
      process.exit(2)
    }
    all[m[1]] = [+m[2], +m[3], +m[4], m[5] ? true : undefined]
  }
  const names = a.devices ? a.devices.split(',') : Object.keys(all)
  const unknown = names.filter(n => !all[n])
  if (unknown.length) {
    console.error(`Unknown device(s): ${unknown.join(', ')}. See --help.`)
    process.exit(2)
  }
  run({
    url: a.url,
    devices: Object.fromEntries(names.map(n => [n, all[n]])),
    states: a.states ? a.states.split(',') : STATES,
    only: a.only ? a.only.split(',') : [],
    out: resolve(a.out),
    settle: Number(a.settle),
  })
}
