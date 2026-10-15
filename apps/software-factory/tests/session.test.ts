import assert from 'node:assert/strict'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { claudeArgs, startSession, type WebhookPayload } from '../src/session.ts'

const repository = { name: 'app', full_name: 'acme/app' }
const labeled = { action: 'labeled', sender: { login: 'octocat' }, repository }
function subject(...labels: string[]) {
  return {
    number: 12,
    title: 'Kiosk pairing',
    html_url: 'https://github.com/acme/app/issues/12',
    labels: labels.map((name) => ({ name })),
  }
}
function launch(event: string, label: string, work: Partial<WebhookPayload>) {
  const launched = claudeArgs(event, { ...labeled, label: { name: label }, ...work })
  assert.ok('args' in launched, JSON.stringify(launched))
  return launched
}
const flag = (args: string[], name: string) => args[args.indexOf(name) + 1]
const implement = () => launch('issues', 'agent:implement', { issue: subject('issue:spec') })
const review = () => launch('pull_request', 'agent:review', { pull_request: subject() })
const fix = () => launch('pull_request', 'agent:fix', { pull_request: subject() })
const upgrade = () =>
  launch('pull_request', 'agent:upgrade', { pull_request: subject('⬆️ Renovate') })

test('claudeArgs starts the trigger label skill in an interactive session of its own', () => {
  const { args } = implement()
  assert.ok(!args.includes('--bg'))
  assert.equal(flag(args, '--worktree'), 'implement-spec-12')
  assert.equal(flag(args, '--permission-mode'), 'auto')
  assert.equal(args.at(-1), '/implement-spec https://github.com/acme/app/issues/12')
  assert.equal(review().args.at(-1), '/review-pr https://github.com/acme/app/issues/12')
  assert.equal(fix().args.at(-1), '/implement https://github.com/acme/app/issues/12')
})

test('claudeArgs names the session for the trigger label and work item', () => {
  assert.equal(review().name, 'agent:review app#12')
  assert.equal(upgrade().name, 'agent:upgrade app#12')
})

test('claudeArgs labels the run tab with the work item number and title', () => {
  assert.equal(implement().tabLabel, 'Issue #12 - Kiosk pairing')
  assert.equal(review().tabLabel, 'PR #12 - Kiosk pairing')
  const pullRequest = { ...subject(), title: 'Kiosk\x1b[2J pairing\n' }
  assert.equal(
    launch('pull_request', 'agent:fix', { pull_request: pullRequest }).tabLabel,
    'PR #12 - Kiosk[2J pairing',
  )
})

test('claudeArgs starts nothing for a label event that is not a trigger', () => {
  const skip = (event: string, payload: WebhookPayload) => claudeArgs(event, payload)
  assert.deepEqual(skip('ping', { repository }), { skip: 'Not a label applied to a work item' })
  assert.deepEqual(
    skip('issues', {
      ...labeled,
      action: 'unlabeled',
      label: { name: 'agent:implement' },
      issue: subject('issue:spec'),
    }),
    { skip: 'Not a label applied to a work item' },
  )
  assert.deepEqual(
    skip('issues', { ...labeled, label: { name: 'agent:review' }, issue: subject() }),
    { skip: 'Not a trigger label for issues' },
  )
  assert.deepEqual(
    skip('issues', { ...labeled, label: { name: 'agent:implement' }, issue: subject() }),
    { skip: 'Work item lacks issue:spec' },
  )
  assert.deepEqual(
    skip('pull_request', { ...labeled, label: { name: 'agent:upgrade' }, pull_request: subject() }),
    { skip: 'Work item lacks ⬆️ Renovate' },
  )
})

test('claudeArgs runs review at higher effort than implementation', () => {
  const rank = ['low', 'medium', 'high', 'xhigh', 'max']
  const effort = ({ args }: { args: string[] }) => rank.indexOf(flag(args, '--effort') ?? '')
  assert.ok(effort(review()) > effort(implement()))
})

test('claudeArgs tells each session who to mention and leaves the hand-off to the factory', () => {
  const prompt = ({ args }: { args: string[] }) => flag(args, '--append-system-prompt') ?? ''
  assert.match(prompt(implement()), /@octocat applied agent:implement/)
  assert.match(
    prompt(implement()),
    /goes on https:\/\/github.com\/acme\/app\/issues\/12, mentioning them\.$/,
  )
  assert.match(prompt(review()), /keeping every Closes line/)
  for (const launched of [implement(), review(), fix(), upgrade()])
    assert.doesNotMatch(prompt(launched), /label|ready for review/)
  const allowed = ({ args }: { args: string[] }) =>
    JSON.parse(flag(args, '--settings') ?? '').permissions.allow
  assert.deepEqual(allowed(review()), ['Bash(gh pr edit:*)'])
  assert.deepEqual(allowed(upgrade()), [])
})

test('claudeArgs claims a work item with the working label of its trigger', () => {
  assert.equal(implement().claim.at(-1), 'agent:implementing')
  assert.equal(upgrade().claim.at(-1), 'agent:upgrading')
})

test('claudeArgs has each run-ending hook report to the factory server under the run token', () => {
  const launched = review()
  const hooks = JSON.parse(flag(launched.args, '--settings') ?? '').hooks
  for (const hook of ['Stop', 'StopFailure', 'SessionEnd'])
    assert.equal(
      hooks[hook][0].hooks[0].command,
      `curl -sS --data-binary @- http://localhost:3456/runs/${launched.token}/${hook}`,
    )
  assert.notEqual(review().token, launched.token)
})

// Stubs on PATH: herdr runs the typed command through sh, claude exits before its hooks load, curl logs its report.
const bin = mkdtempSync(join(tmpdir(), 'software-factory-bin-'))
after(() => rmSync(bin, { recursive: true }))
const stub = (name: string, body: string) => {
  writeFileSync(join(bin, name), `#!/bin/sh\n${body}\n`)
  chmodSync(join(bin, name), 0o755)
}
stub(
  'herdr',
  `echo "$1 $2" >> "${bin}/calls.log"
case "$1 $2" in
  "workspace create") echo '{"result":{"root_pane":{"pane_id":"p1","tab_id":"t1","workspace_id":"w1"}}}' ;;
  "tab rename") echo "$3|$4" >> "${bin}/herdr.log"; exit "\${RENAME_EXIT:-0}" ;;
  "pane wait-output") exit "\${WAIT_EXIT:-0}" ;;
  "pane run") sh -c "$4"; exit "\${RUN_EXIT:-0}" ;;
  "workspace close") exit "\${CLOSE_EXIT:-0}" ;;
esac`,
)
stub('claude', 'exit 1')
stub('curl', `echo "$@" >> "${bin}/curl.log"`)
process.env.PATH = `${bin}:${process.env.PATH}`

test('startSession has the shell report the end of a claude that exits before its hooks load', async () => {
  const launched = review()
  assert.deepEqual(await startSession(launched, bin), {
    ok: true,
    stdout: '',
    output: '',
    workspace: 'w1',
  })
  assert.equal(
    readFileSync(join(bin, 'curl.log'), 'utf8'),
    `-sS -X POST http://localhost:3456/runs/${launched.token}/SessionEnd\n`,
  )
})

test('startSession keeps the claim of a failed launch whose workspace will not close', async (t) => {
  t.after(() => {
    delete process.env.RUN_EXIT
    delete process.env.CLOSE_EXIT
  })
  process.env.RUN_EXIT = '1'
  process.env.CLOSE_EXIT = '1'
  const kept = await startSession(review(), bin)
  assert.equal(kept.ok, true)
  assert.equal(kept.ok && kept.workspace, 'w1')
  process.env.CLOSE_EXIT = '0'
  assert.equal((await startSession(review(), bin)).ok, false)
})

test('startSession labels the run tab, and a rename herdr refuses still launches', async (t) => {
  t.after(() => delete process.env.RENAME_EXIT)
  process.env.RENAME_EXIT = '1'
  writeFileSync(join(bin, 'herdr.log'), '')
  assert.equal((await startSession(review(), bin)).ok, true)
  assert.equal(readFileSync(join(bin, 'herdr.log'), 'utf8'), 't1|PR #12 - Kiosk pairing\n')
})

test('startSession types the command only once the new pane shows its prompt', async () => {
  writeFileSync(join(bin, 'calls.log'), '')
  assert.equal((await startSession(review(), bin)).ok, true)
  assert.deepEqual(readFileSync(join(bin, 'calls.log'), 'utf8').split('\n'), [
    'workspace create',
    'tab rename',
    'pane wait-output',
    'pane run',
    '',
  ])
})

test('startSession closes the workspace of a pane whose prompt never shows', async (t) => {
  t.after(() => delete process.env.WAIT_EXIT)
  process.env.WAIT_EXIT = '1'
  writeFileSync(join(bin, 'calls.log'), '')
  const failed = await startSession(review(), bin)
  assert.equal(failed.ok, false)
  assert.match(failed.output, /^herdr pane wait-output: /)
  assert.deepEqual(readFileSync(join(bin, 'calls.log'), 'utf8').split('\n'), [
    'workspace create',
    'tab rename',
    'pane wait-output',
    'workspace close',
    '',
  ])
})
