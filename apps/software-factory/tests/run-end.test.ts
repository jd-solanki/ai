import assert from 'node:assert/strict'
import { test } from 'node:test'
import { handleRunReport, type Runs } from '../src/run-end.ts'
import { claudeArgs } from '../src/session.ts'

const pull = 'https://github.com/acme/app/pull/12'
const spec = 'https://github.com/acme/app/issues/12'

function launch(label: string) {
  const subject = {
    number: 12,
    title: 'Kiosk pairing',
    labels: [{ name: 'issue:spec' }, { name: '⬆️ Renovate' }],
  }
  const launched = claudeArgs(label === 'agent:implement' ? 'issues' : 'pull_request', {
    action: 'labeled',
    label: { name: label },
    sender: { login: 'octocat' },
    repository: { name: 'app', full_name: 'acme/app' },
    ...(label === 'agent:implement'
      ? { issue: { ...subject, html_url: spec } }
      : { pull_request: { ...subject, html_url: pull, head: { sha: 'abc' } } }),
  })
  assert.ok('args' in launched)
  return launched
}

// `github` answers the factory's reads, as `gh` would print them.
function factory({
  label = 'agent:fix',
  closes = true,
  github = (_args: string[]): string | undefined => '',
  refuses = (_args: string[]): boolean => false,
} = {}) {
  const run = launch(label)
  const runs: Runs = new Map([[run.token, { ...run, workspace: 'w7' }]])
  const writes: string[] = []
  const closed: string[] = []
  const report = (hook: string, input: object | string = {}) =>
    handleRunReport(
      `/runs/${run.token}/${hook}`,
      Buffer.from(typeof input === 'string' ? input : JSON.stringify(input)),
      {
        runs,
        gh: async (args) => {
          const read = github(args)
          if (['list', 'view', 'api'].some((verb) => args.includes(verb)))
            return read === undefined
              ? { ok: false, stdout: '', output: 'HTTP 502' }
              : { ok: true, stdout: read, output: read }
          writes.push(args.join(' '))
          return refuses(args)
            ? { ok: false, stdout: '', output: "could not add label: 'agent:review' not found" }
            : { ok: true, stdout: '', output: '' }
        },
        closeWorkspace: async (workspace) => {
          closed.push(workspace)
          return { ok: closes, output: closes ? '' : 'herdr is down' }
        },
      },
    )
  return { runs, writes, closed, report, end: () => report('Stop', { background_tasks: [] }) }
}

const summary = (updated_at: string, verdict: string, login = 'factory') =>
  JSON.stringify({
    login,
    updated_at,
    body: `<!-- review-pr:summary -->\n<!-- review-pr:verdict ${verdict} -->\n## 🔍 Review: 7/10`,
  })
const review = (...comments: string[]) =>
  factory({
    label: 'agent:review',
    github: (args) =>
      args.join(' ') === 'api user --jq .login' ? 'factory\n' : comments.join('\n'),
  })
const fresh = '2999-01-01T00:00:00Z'
const waits = (url: string, kind: string, label: string, why: string) => [
  `${kind} edit ${url} --remove-label ${label.replace(/e?$/, 'ing')}`,
  `${kind} edit ${url} --add-assignee octocat`,
  `${kind} comment ${url} --body @octocat the ${label} run ended and waits on you: ${why}.`,
]

test('a clean stop hands a fixed pull request back to the Reviewer and closes the run', async () => {
  const run = factory()
  assert.deepEqual(await run.end(), {
    status: 200,
    body: 'agent:fix app#12: Handed it to agent:review',
  })
  assert.deepEqual(run.writes, [
    `pr edit ${pull} --remove-label agent:fixing`,
    `pr edit ${pull} --add-label agent:review`,
  ])
  assert.deepEqual(run.closed, ['w7'])
})

test('a review that leaves tasks hands the pull request to the Fixer', async () => {
  const run = review(JSON.stringify({ updated_at: fresh, body: 'LGTM' }), summary(fresh, 'tasks'))
  await run.end()
  assert.deepEqual(run.writes, [
    `pr edit ${pull} --remove-label agent:reviewing`,
    `pr edit ${pull} --add-label agent:fix`,
  ])
})

test('a dry review marks the pull request ready', async () => {
  const run = review(summary(fresh, 'dry'))
  assert.equal((await run.end()).body, 'agent:review app#12: Marked ready')
  assert.deepEqual(run.writes, [
    `pr edit ${pull} --remove-label agent:reviewing`,
    `pr ready ${pull}`,
  ])
})

test("a verdict planted in someone else's comment is ignored", async () => {
  const run = review(summary(fresh, 'tasks', 'mallory'), summary(fresh, 'dry'))
  assert.equal((await run.end()).body, 'agent:review app#12: Marked ready')
})

test('a review that ended waits on whoever applied its label', async () => {
  const run = review(summary(fresh, 'ended'))
  await run.end()
  assert.deepEqual(
    run.writes,
    waits(
      pull,
      'pr',
      'agent:review',
      'the review ended, so you decide what happens to what it left open',
    ),
  )
})

test('a review run that left no verdict of its own waits on whoever applied its label', async () => {
  for (const run of [review(), review(summary('2000-01-01T00:00:00Z', 'dry'))]) {
    await run.end()
    assert.deepEqual(
      run.writes,
      waits(pull, 'pr', 'agent:review', 'this run left no review verdict on the pull request'),
    )
  }
})

test('an implement run hands its spec branch draft to the Reviewer', async () => {
  const draft = 'https://github.com/acme/app/pull/40'
  const run = factory({
    label: 'agent:implement',
    github: (args) =>
      args.join(' ') ===
      'pr list -R acme/app --head spec/12 --state open --json url,isDraft,isCrossRepository'
        ? JSON.stringify([{ url: draft, isDraft: true, isCrossRepository: false }])
        : undefined,
  })
  await run.end()
  assert.deepEqual(run.writes, [
    `issue edit ${spec} --remove-label agent:implementing`,
    `pr edit ${draft} --add-label agent:review`,
  ])
})

const forked = {
  url: 'https://github.com/acme/app/pull/41',
  isDraft: true,
  isCrossRepository: true,
}

test("an implement run skips a fork's draft from a branch of the same name", async () => {
  const draft = 'https://github.com/acme/app/pull/40'
  const run = factory({
    label: 'agent:implement',
    github: () => JSON.stringify([forked, { url: draft, isDraft: true, isCrossRepository: false }]),
  })
  await run.end()
  assert.deepEqual(run.writes, [
    `issue edit ${spec} --remove-label agent:implementing`,
    `pr edit ${draft} --add-label agent:review`,
  ])
})

test("an implement run whose only draft is a fork's waits on whoever applied its label", async () => {
  const run = factory({ label: 'agent:implement', github: () => JSON.stringify([forked]) })
  await run.end()
  assert.deepEqual(
    run.writes,
    waits(spec, 'issue', 'agent:implement', 'no open draft pull request from spec/12'),
  )
})

test('an implement run that opened no draft waits on whoever applied its label', async () => {
  const run = factory({
    label: 'agent:implement',
    github: () => JSON.stringify([{ url: 'https://github.com/acme/app/pull/40', isDraft: false }]),
  })
  await run.end()
  assert.deepEqual(
    run.writes,
    waits(spec, 'issue', 'agent:implement', 'no open draft pull request from spec/12'),
  )
})

test('an upgrade run hands new commits to the Reviewer and marks an untouched update ready', async () => {
  const moved = factory({ label: 'agent:upgrade', github: () => 'def\n' })
  await moved.end()
  assert.deepEqual(moved.writes, [
    `pr edit ${pull} --remove-label agent:upgrading`,
    `pr edit ${pull} --add-label agent:review`,
  ])

  const untouched = factory({ label: 'agent:upgrade', github: () => 'abc\n' })
  await untouched.end()
  assert.deepEqual(untouched.writes, [
    `pr edit ${pull} --remove-label agent:upgrading`,
    `pr ready ${pull}`,
  ])
})

test('a run whose next step cannot be read waits on whoever applied its label', async () => {
  const run = factory({ label: 'agent:upgrade', github: () => undefined })
  await run.end()
  assert.deepEqual(run.writes, waits(pull, 'pr', 'agent:upgrade', 'gh pr view failed: HTTP 502'))
})

test('a hand-off GitHub refuses waits on whoever applied the label', async () => {
  const run = factory({ refuses: (args) => args.includes('--add-label') })
  await run.end()
  assert.deepEqual(run.writes, [
    `pr edit ${pull} --remove-label agent:fixing`,
    `pr edit ${pull} --add-label agent:review`,
    ...waits(
      pull,
      'pr',
      'agent:fix',
      "the factory could not apply agent:review: could not add label: 'agent:review' not found",
    ).slice(1),
  ])
})

test('a run whose working label cannot be removed hands nothing on', async () => {
  const run = factory({ refuses: (args) => args.includes('--remove-label') })
  assert.equal((await run.end()).status, 500)
  assert.deepEqual(
    run.writes,
    waits(
      pull,
      'pr',
      'agent:fix',
      "the factory could not remove its working label: could not add label: 'agent:review' not found",
    ),
  )
})

test('a stop with background work left keeps the run', async () => {
  const run = factory()
  await run.report('Stop', { background_tasks: [{ type: 'shell', status: 'running' }] })
  assert.deepEqual(run.writes, [])
  assert.deepEqual(run.closed, [])
  await run.end()
  assert.equal(run.writes.length, 2)
})

const released = `pr edit ${pull} --remove-label agent:fixing`
const crashed = (why: string) =>
  `pr comment ${pull} --body @octocat the agent:fix run ${why} before it finished. Apply agent:fix again to retry.`

test('a session that exits before a clean stop crashes the run', async () => {
  const run = factory()
  await run.report('SessionEnd', { reason: 'other' })
  assert.deepEqual(run.writes, [released, crashed('exited')])
  assert.deepEqual(run.closed, ['w7'])
})

test('a turn that dies on an API error crashes the run', async () => {
  const run = factory()
  await run.report('StopFailure')
  assert.deepEqual(run.writes, [released, crashed('stopped on an API error')])
})

test('the session end that closing a run fires is ignored', async () => {
  const run = factory()
  await run.end()
  assert.deepEqual(await run.report('SessionEnd', { reason: 'other' }), {
    status: 404,
    body: 'No run in progress for this report',
  })
  assert.equal(run.writes.length, 2)
  assert.deepEqual(run.closed, ['w7'])
})

test('a run whose workspace fails to close keeps its claim', async () => {
  const run = factory({ closes: false })
  assert.deepEqual(await run.end(), { status: 500, body: 'agent:fix app#12: herdr is down' })
  assert.deepEqual(run.writes, [])
  assert.equal(run.runs.size, 1)
})

test('a session that ended releases its run even when its workspace fails to close', async () => {
  const run = factory({ closes: false })
  await run.report('SessionEnd', { reason: 'other' })
  assert.deepEqual(run.writes, [released, crashed('exited')])
  assert.equal(run.runs.size, 0)
})

test('a stop that does not say whether background work is left keeps the run', async () => {
  const run = factory()
  await run.report('Stop', {})
  assert.equal((await run.report('Stop', 'not json')).status, 400)
  assert.deepEqual(run.writes, [])
  assert.deepEqual(run.closed, [])
})
