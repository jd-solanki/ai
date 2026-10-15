import assert from 'node:assert/strict'
import { test } from 'node:test'
import { handleRunReport, type Runs } from '../src/run-end.ts'
import { claudeArgs } from '../src/session.ts'

function review() {
  const launch = claudeArgs('pull_request', {
    action: 'labeled',
    label: { name: 'agent:review' },
    sender: { login: 'octocat' },
    repository: { name: 'app', full_name: 'acme/app' },
    pull_request: { number: 12, html_url: 'https://github.com/acme/app/pull/12', labels: [] },
  })
  assert.ok('args' in launch)
  return launch
}

function factory(closes = true) {
  const launch = review()
  const runs: Runs = new Map([[launch.token, { ...launch, workspace: 'w7' }]])
  const ghCalls: string[] = []
  const closed: string[] = []
  const report = (hook: string, input: object | string = {}) =>
    handleRunReport(
      `/runs/${launch.token}/${hook}`,
      Buffer.from(typeof input === 'string' ? input : JSON.stringify(input)),
      {
        runs,
        gh: async (args) => {
          ghCalls.push(args.slice(3).join(' '))
          return { ok: true, output: '' }
        },
        closeWorkspace: async (workspace) => {
          closed.push(workspace)
          return { ok: closes, output: closes ? '' : 'herdr is down' }
        },
      },
    )
  return { runs, ghCalls, closed, report }
}

const released = '--remove-label agent:reviewing'
const crashed = (why: string) =>
  `--body @octocat the agent:review run ${why} before it finished. Apply agent:review again to retry.`

test('a clean stop releases the claim and closes the run', async () => {
  const run = factory()
  assert.deepEqual(await run.report('Stop', { background_tasks: [] }), {
    status: 200,
    body: 'agent:review app#12: Ended',
  })
  assert.deepEqual(run.ghCalls, [released])
  assert.deepEqual(run.closed, ['w7'])
})

test('a stop with background work left keeps the run', async () => {
  const run = factory()
  await run.report('Stop', { background_tasks: [{ type: 'shell', status: 'running' }] })
  assert.deepEqual(run.ghCalls, [])
  assert.deepEqual(run.closed, [])
  await run.report('Stop', { background_tasks: [] })
  assert.deepEqual(run.ghCalls, [released])
})

test('a session that exits before a clean stop crashes the run', async () => {
  const run = factory()
  await run.report('SessionEnd', { reason: 'other' })
  assert.deepEqual(run.ghCalls, [released, crashed('exited')])
  assert.deepEqual(run.closed, ['w7'])
})

test('a turn that dies on an API error crashes the run', async () => {
  const run = factory()
  await run.report('StopFailure')
  assert.deepEqual(run.ghCalls, [released, crashed('stopped on an API error')])
})

test('the session end that closing a run fires is ignored', async () => {
  const run = factory()
  await run.report('Stop', { background_tasks: [] })
  assert.deepEqual(await run.report('SessionEnd', { reason: 'other' }), {
    status: 404,
    body: 'No run in progress for this report',
  })
  assert.deepEqual(run.ghCalls, [released])
  assert.deepEqual(run.closed, ['w7'])
})

test('a run whose workspace fails to close keeps its claim', async () => {
  const run = factory(false)
  assert.deepEqual(await run.report('Stop', { background_tasks: [] }), {
    status: 500,
    body: 'agent:review app#12: herdr is down',
  })
  assert.deepEqual(run.ghCalls, [])
  assert.equal(run.runs.size, 1)
})

test('a stop that does not say whether background work is left keeps the run', async () => {
  const run = factory()
  await run.report('Stop', {})
  assert.equal((await run.report('Stop', 'not json')).status, 400)
  assert.deepEqual(run.ghCalls, [])
  assert.deepEqual(run.closed, [])
})
