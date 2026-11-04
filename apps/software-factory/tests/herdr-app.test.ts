import assert from 'node:assert/strict'
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, beforeEach, test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { closeTab, startSession } from '../src/herdr-app.ts'
import { claudeArgs } from '../src/session.ts'

const launched = claudeArgs('pull_request', {
  action: 'labeled',
  label: { name: 'agent:review' },
  sender: { login: 'octocat' },
  repository: { name: 'app', full_name: 'acme/app' },
  pull_request: {
    number: 12,
    title: 'Kiosk pairing',
    html_url: 'https://github.com/acme/app/pull/12',
    labels: [],
  },
})
assert.ok('args' in launched)

// Stubs on PATH: hc logs each call and runs its session command through sh, herdr-app logs each rename, claude exits before its hooks load, curl logs its report.
const bin = realpathSync(mkdtempSync(join(tmpdir(), 'software-factory-herdr-app-')))
after(() => rmSync(bin, { recursive: true }))
const stub = (name: string, body: string) => {
  writeFileSync(join(bin, name), `#!/bin/sh\n${body}\n`)
  chmodSync(join(bin, name), 0o755)
}
stub(
  'hc',
  `case "$1" in
  ls) [ -n "$RUN_FAILS" ] && exit 1; echo "{\\"terminals\\":\${TERMINALS:-[]}}" ;;
  get) echo "get $2" >> "${bin}/hc.log"
    [ "$2" = gone ] && exit 3
    [ "$2" = t4 ] && { echo '{"labels":{"herdr.space":"sp2"}}'; exit 0; }
    [ "$2" = t3 ] && echo '{"labels":{"herdr.space":"sp1"}}' || echo '{"labels":{}}' ;;
  run) echo "$1 $2 $3 $4 $5 $6 $7 $8 $9 \${10} \${11} \${12}" >> "${bin}/hc.log"
    [ -n "$RUN_FAILS" ] && { echo '{"error":{"kind":"spawn_failed"}}' >&2; exit 1; }
    [ -n "$NO_ADDRESS" ] && { echo '{"state":"live"}'; exit 0; }
    sh -c "\${13}"; echo warning >&2; echo '{"address":"t7","state":"live"}' ;;
  kill) echo "$1 $2 $3" >> "${bin}/hc.log"
    [ -z "$KILL_ERROR" ] || { echo "{\\"error\\":{\\"kind\\":\\"$KILL_ERROR\\"}}" >&2; exit 3; } ;;
esac`,
)
stub(
  'herdr-app',
  `tries=$(($(wc -l < "${bin}/app.log") + 1))
echo "$1 $2 $3 $4 $5 $6" >> "${bin}/app.log"
[ "$tries" -le "\${RENAME_MISSES:-0}" ] && { echo '{ "error": "no tab" }'; exit 1; }
[ -n "$RENAME_ERROR" ] && { echo '{ "error": "no window" }'; exit 1; }
echo '{ "ok": true }'`,
)
stub('claude', 'exit 1')
stub('curl', `echo "$@" >> "${bin}/curl.log"`)
process.env.PATH = `${bin}:${process.env.PATH}`
beforeEach(() => {
  for (const log of ['hc.log', 'app.log', 'curl.log']) writeFileSync(join(bin, log), '')
})
const log = (name: string) => readFileSync(join(bin, name), 'utf8')
const withEnv = (t: { after: (fn: () => void) => void }, key: string, value: string) => {
  t.after(() => delete process.env[key])
  process.env[key] = value
}
const renames = () => log('app.log').split('\n').filter(Boolean).length
// The rename runs on after startSession returns, and must not reach the next test's log.
const waitForRenames = async (count: number) => {
  for (let tries = 0; tries < 200 && renames() < count; tries++) await sleep(10)
  assert.equal(renames(), count)
}

test('startSession opens the run in the repo workspace of the first labelled terminal at the clone', async (t) => {
  withEnv(
    t,
    'TERMINALS',
    JSON.stringify([
      { address: 't1', cwd: join(bin, 'worktree') },
      { address: 't2', cwd: bin },
      { address: 't3', cwd: bin },
      { address: 't4', cwd: bin },
    ]),
  )
  assert.deepEqual(await startSession(launched, bin), { ok: true, output: '', tab: 't7' })
  await waitForRenames(1)
  const [get2, get3, started] = log('hc.log').split('\n')
  assert.deepEqual([get2, get3], ['get t2', 'get t3'])
  // Without --no-parent a session is the server's child, and ends with it.
  const tab = /herdr\.tab=(tb[0-9a-f]{32})/.exec(started)?.[1]
  assert.equal(
    started,
    `run --bg --json --no-parent --rm --cwd ${bin} --label herdr.space=sp1 --label herdr.tab=${tab} --`,
  )
  assert.equal(log('app.log'), `do tab.rename --id ${tab} --name 🔍 #12 Kiosk pairing\n`)
  // The shell reports the end of a claude that exits before its hooks load.
  assert.equal(
    log('curl.log'),
    `-fsS --retry 5 --retry-all-errors --retry-delay 1 -X POST http://localhost:3456/runs/${launched.token}/SessionEnd\n`,
  )
})

test('startSession looks past a terminal that exited since the list', async (t) => {
  withEnv(
    t,
    'TERMINALS',
    JSON.stringify([
      { address: 'gone', cwd: bin },
      { address: 't3', cwd: bin },
    ]),
  )
  // A clone reached through a symlink still matches the real path hc lists.
  const link = `${bin}-link`
  symlinkSync(bin, link)
  t.after(() => rmSync(link))
  assert.equal((await startSession(launched, link)).ok, true)
  await waitForRenames(1)
  assert.match(log('hc.log'), /--label herdr\.space=sp1 /)
})

test('startSession opens a workspace of its own when no terminal sits at the clone', async () => {
  assert.equal((await startSession(launched, bin)).ok, true)
  await waitForRenames(1)
  assert.match(log('hc.log'), /--label herdr\.space=sp[0-9a-f]{32} --label herdr\.tab=tb/)
})

// A run registers when startSession returns, and an end reported before that finds no run: a crash lost, its claim held.
test('startSession returns before the window adopts the tab, and renames it once it does', async (t) => {
  withEnv(t, 'RENAME_MISSES', '2')
  assert.equal((await startSession(launched, bin)).ok, true)
  assert.ok(renames() < 3)
  await waitForRenames(3)
})

test('startSession keeps the run, and stops renaming, when the window refuses for another reason', async (t) => {
  withEnv(t, 'RENAME_ERROR', '1')
  assert.deepEqual(await startSession(launched, bin), { ok: true, output: '', tab: 't7' })
  await waitForRenames(1)
  await sleep(300)
  assert.equal(renames(), 1)
})

test('startSession fails the launch and names no tab when hc starts nothing', async (t) => {
  withEnv(t, 'RUN_FAILS', '1')
  const failed = await startSession(launched, bin)
  assert.equal(failed.ok, false)
  assert.match(failed.output, /^hc run: .*spawn_failed/)
  await sleep(300)
  assert.equal(log('app.log'), '')
})

test('startSession fails the launch when hc run names no terminal', async (t) => {
  withEnv(t, 'NO_ADDRESS', '1')
  assert.equal((await startSession(launched, bin)).ok, false)
})

test('closeTab kills the terminal, and counts one already removed as closed', async (t) => {
  assert.equal((await closeTab('t7')).ok, true)
  assert.equal(log('hc.log'), 'kill t7 --json\n')
  // --rm removes a terminal as it dies, so even a kill that worked can answer not_found.
  withEnv(t, 'KILL_ERROR', 'not_found')
  assert.equal((await closeTab('t7')).ok, true)
  withEnv(t, 'KILL_ERROR', 'internal')
  assert.equal((await closeTab('t7')).ok, false)
})
