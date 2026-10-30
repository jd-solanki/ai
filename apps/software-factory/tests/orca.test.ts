import assert from 'node:assert/strict'
import { chmodSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, beforeEach, test } from 'node:test'
import { closeTab, startSession } from '../src/orca.ts'
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

// Stubs on PATH: orca logs each call and runs the --command it is given through sh, claude exits before its hooks load, curl logs its report.
const bin = realpathSync(mkdtempSync(join(tmpdir(), 'software-factory-orca-')))
after(() => rmSync(bin, { recursive: true }))
const stub = (name: string, body: string) => {
  writeFileSync(join(bin, name), `#!/bin/sh\n${body}\n`)
  chmodSync(join(bin, name), 0o755)
}
stub(
  'orca',
  `echo "$1 $2 $3 $4 $5 $6" >> "${bin}/calls.log"
case "$1 $2" in
  "repo add") exit "\${REPO_EXIT:-0}" ;;
  "terminal create") [ -n "$CREATE_FAILS" ] && { echo '{"ok":false,"error":{"code":"selector_not_found"}}'; exit 1; }
    sh -c "$8"; echo '{"ok":true,"result":{"terminal":{"handle":"term_1"}}}' ;;
  "terminal close") exit "\${CLOSE_EXIT:-0}" ;;
esac`,
)
stub('claude', 'exit 1')
stub('curl', `echo "$@" >> "${bin}/curl.log"`)
process.env.PATH = `${bin}:${process.env.PATH}`
beforeEach(() => {
  writeFileSync(join(bin, 'calls.log'), '')
  writeFileSync(join(bin, 'curl.log'), '')
})

test('startSession registers the clone, then opens a titled tab that runs the session', async () => {
  assert.deepEqual(await startSession(launched, bin), { ok: true, output: '', tab: 'term_1' })
  assert.deepEqual(readFileSync(join(bin, 'calls.log'), 'utf8').split('\n'), [
    `repo add --path ${bin} --json `,
    `terminal create --worktree path:${bin} --title 🔍 #12 Kiosk pairing`,
    '',
  ])
  // The shell reports the end of a claude that exits before its hooks load.
  assert.equal(
    readFileSync(join(bin, 'curl.log'), 'utf8'),
    `-sS -X POST http://localhost:3456/runs/${launched.token}/SessionEnd\n`,
  )
})

test('startSession opens no tab in a clone Orca refuses', async (t) => {
  t.after(() => delete process.env.REPO_EXIT)
  process.env.REPO_EXIT = '1'
  const failed = await startSession(launched, bin)
  assert.equal(failed.ok, false)
  assert.match(failed.output, /^orca repo add: /)
  assert.equal(readFileSync(join(bin, 'calls.log'), 'utf8'), `repo add --path ${bin} --json \n`)
})

test('startSession fails the launch when Orca opens no terminal', async (t) => {
  t.after(() => delete process.env.CREATE_FAILS)
  process.env.CREATE_FAILS = '1'
  const failed = await startSession(launched, bin)
  assert.equal(failed.ok, false)
  assert.match(failed.output, /^orca terminal create: .*selector_not_found/)
})

test('closeTab counts a stale handle as a failed close', async (t) => {
  assert.equal((await closeTab('term_1')).ok, true)
  assert.equal(
    readFileSync(join(bin, 'calls.log'), 'utf8'),
    'terminal close --terminal term_1 --tab --json\n',
  )
  t.after(() => delete process.env.CLOSE_EXIT)
  process.env.CLOSE_EXIT = '1'
  assert.equal((await closeTab('term_1')).ok, false)
})
