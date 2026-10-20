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
  const runs: Runs = new Map([[run.token, { ...run, tab: 'w7:t3', cwd: '/repos/acme/app' }]])
  const writes: string[] = []
  const ghDirs = new Set<string | undefined>()
  const closed: string[] = []
  const ended = new Set<string>()
  const sessionEnds: { status: number; body?: string }[] = []
  const report = (hook: string, input: object | string = {}) =>
    handleRunReport(
      `/runs/${run.token}/${hook}`,
      Buffer.from(typeof input === 'string' ? input : JSON.stringify(input)),
      {
        runs,
        gh: async (args, cwd) => {
          ghDirs.add(cwd)
          const read = github(args)
          // A PATCH through `gh api` is a write.
          if (
            ['list', 'view'].some((verb) => args.includes(verb)) ||
            (args[0] === 'api' && !args.includes('-X'))
          )
            return read === undefined
              ? { ok: false, stdout: '', output: 'HTTP 502' }
              : { ok: true, stdout: read, output: read }
          writes.push(args.join(' '))
          return refuses(args)
            ? { ok: false, stdout: '', output: "could not add label: 'agent:review' not found" }
            : { ok: true, stdout: '', output: '' }
        },
        // herdr's first close that succeeds ends the session, which reports SessionEnd before the close returns.
        closeTab: async (tab) => {
          closed.push(tab)
          if (closes && !ended.has(tab)) {
            ended.add(tab)
            sessionEnds.push(await report('SessionEnd', { reason: 'other' }))
          }
          return { ok: closes, output: closes ? '' : 'herdr is down' }
        },
      },
    )
  return {
    runs,
    writes,
    ghDirs,
    closed,
    sessionEnds,
    report,
    end: () => report('Stop', { background_tasks: [] }),
  }
}

const comment = (marker: string, verdict: string, updated_at: string, login: string, tail = '') =>
  JSON.stringify({
    id: 7,
    login,
    updated_at,
    body: `<!-- ${marker} -->\n<!-- ${marker.split(':')[0]}:verdict ${verdict} -->\n## 7/10${tail}`,
  })
const summary = (updated_at: string, verdict: string, login = 'factory', reviewed = 'abc1234') =>
  comment(
    'review-pr:summary',
    verdict,
    updated_at,
    login,
    `\n<sub>Reviews (1) · Last reviewed commit: ${reviewed}</sub>`,
  )
const qaReport = (updated_at: string, verdict: string) =>
  comment('verify-pr:report', verdict, updated_at, 'factory')
const comments =
  'api repos/acme/app/issues/12/comments --paginate --jq .[] | {id, login: .user.login, updated_at, body} | tojson'
const scenarios =
  '## QA steps\n\n- [ ] **Saving shows a toast**\n  1. Click Save → a toast appears.\n\n## Notes\n'
// `body` is the pull request body a dry review leaves.
const pullRequest = (label: string, body: string, ...said: string[]) =>
  factory({
    label,
    github: (args) =>
      ({
        'api user --jq .login': 'factory\n',
        [comments]: said.join('\n'),
        [`pr view ${pull} --json body --jq .body`]: body,
        [`pr view ${pull} --json headRefOid --jq .headRefOid`]: 'abc1234def\n',
      })[args.join(' ')],
  })
const review = (...said: string[]) => pullRequest('agent:review', '', ...said)
const verify = (...said: string[]) => pullRequest('agent:verify', scenarios, ...said)
const upgrade = (head: string) =>
  factory({
    label: 'agent:upgrade',
    github: (args) =>
      args.join(' ') === `pr view ${pull} --json headRefOid --jq .headRefOid` ? head : undefined,
  })

const fresh = '2999-01-01T00:00:00Z'
const told = (url: string, kind: string, message: string) => [
  `${kind} edit ${url} --add-assignee octocat`,
  `${kind} edit ${url} --add-label agent:handed-back`,
  `${kind} comment ${url} --body <!-- factory -->\n@octocat ${message}`,
]
const waits = (url: string, kind: string, label: string, why: string) => [
  `${kind} edit ${url} --remove-label ${label.replace(/e?$/, 'ing')}`,
  ...told(url, kind, `the ${label} run ended and waits on you: ${why}.`),
]
// A pull request marked ready waits on whoever applied the label, to merge it.
const markedReady = (label: string) => {
  const [released, ...wait] = waits(pull, 'pr', label, 'it is marked ready for you to merge')
  return [released, `pr ready ${pull}`, ...wait]
}

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
  assert.deepEqual(run.closed, ['w7:t3'])
})

test("a run's end reads and writes GitHub from the served repo's clone", async () => {
  const handedOn = review(summary(fresh, 'dry'))
  await handedOn.end()
  assert.deepEqual([...handedOn.ghDirs], ['/repos/acme/app'])

  const crashed = factory()
  await crashed.report('SessionEnd', { reason: 'other' })
  assert.deepEqual([...crashed.ghDirs], ['/repos/acme/app'])
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
  assert.equal(
    (await run.end()).body,
    'agent:review app#12: Waiting on octocat: it is marked ready for you to merge',
  )
  assert.deepEqual(run.writes, markedReady('agent:review'))
})

test('a dry review of an older head hands the pull request back to the Reviewer', async () => {
  const run = review(summary(fresh, 'dry', 'factory', '1111111'))
  await run.end()
  assert.deepEqual(run.writes, [
    `pr edit ${pull} --remove-label agent:reviewing`,
    `pr edit ${pull} --add-label agent:review`,
  ])
})

test('a dry review whose summary names no readable commit waits rather than reviewing again', async () => {
  const why =
    "the dry review's summary names no commit the factory can read, so it cannot tell whether the head was reviewed"
  const reworded = review(
    comment('review-pr:summary', 'dry', fresh, 'factory', '\n<sub>Reviews (1)</sub>'),
  )
  await reworded.end()
  assert.deepEqual(reworded.writes, waits(pull, 'pr', 'agent:review', why))

  const passed = verify(
    comment(
      'review-pr:summary',
      'dry',
      '2000-01-01T00:00:00Z',
      'factory',
      '\n<sub>Reviews (1)</sub>',
    ),
    qaReport(fresh, 'pass'),
  )
  await passed.end()
  assert.deepEqual(passed.writes, waits(pull, 'pr', 'agent:verify', why))

  // A commit in backticks still reads.
  const quoted = review(summary(fresh, 'dry', 'factory', '`abc1234`'))
  await quoted.end()
  assert.deepEqual(quoted.writes, markedReady('agent:review'))
})

test('a dry review hands a pull request with QA scenarios to the Verifier', async () => {
  const run = pullRequest('agent:review', scenarios, summary(fresh, 'dry'))
  assert.equal((await run.end()).body, 'agent:review app#12: Handed it to agent:verify')
  assert.deepEqual(run.writes, [
    `pr edit ${pull} --remove-label agent:reviewing`,
    `pr edit ${pull} --add-label agent:verify`,
  ])
})

test('a dry review marks ready a pull request whose QA steps hold no scenario', async () => {
  for (const body of [
    '## QA steps\n\n1. Run it.\n',
    '## Notes\n\n- [ ] not a scenario\n',
    '## QA steps\n\n1. Run it.\n\n## Notes\n\n- [ ] not a scenario\n',
  ]) {
    const run = pullRequest('agent:review', body, summary(fresh, 'dry'))
    await run.end()
    assert.deepEqual(run.writes, markedReady('agent:review'))
  }
})

test('a passing QA run marks the pull request ready and a failing one hands it to the Fixer', async () => {
  const passed = verify(summary('2000-01-01T00:00:00Z', 'dry'), qaReport(fresh, 'pass'))
  await passed.end()
  assert.deepEqual(passed.writes, markedReady('agent:verify'))

  // A pass with no dry review goes to the Reviewer, whose dry round hands it back.
  const unreviewed = verify(qaReport(fresh, 'pass'))
  await unreviewed.end()
  assert.deepEqual(unreviewed.writes, [
    `pr edit ${pull} --remove-label agent:verifying`,
    `pr edit ${pull} --add-label agent:review`,
  ])

  // A dry review of an earlier commit leaves the head unreviewed.
  const stale = verify(
    summary('2000-01-01T00:00:00Z', 'dry', 'factory', '1111111'),
    qaReport(fresh, 'pass'),
  )
  await stale.end()
  assert.deepEqual(stale.writes, [
    `pr edit ${pull} --remove-label agent:verifying`,
    `pr edit ${pull} --add-label agent:review`,
  ])

  const failed = verify(summary(fresh, 'dry'), qaReport(fresh, 'fail'))
  await failed.end()
  assert.deepEqual(failed.writes, [
    `pr edit ${pull} --remove-label agent:verifying`,
    `pr edit ${pull} --add-label agent:fix`,
  ])
})

test('a QA run that ended or left no verdict of its own waits on whoever applied its label', async () => {
  const ended = verify(qaReport(fresh, 'ended'))
  await ended.end()
  assert.deepEqual(
    ended.writes,
    waits(
      pull,
      'pr',
      'agent:verify',
      'QA ended with scenarios still failing, so you decide what happens to them',
    ),
  )
  // A review's verdict is not a QA verdict.
  for (const run of [
    verify(summary(fresh, 'dry')),
    verify(qaReport('2000-01-01T00:00:00Z', 'pass')),
  ]) {
    await run.end()
    assert.deepEqual(
      run.writes,
      waits(pull, 'pr', 'agent:verify', 'this run left no QA verdict on the pull request'),
    )
  }
})

test('the factory edits its own comment in place rather than adding one', async () => {
  const factoryComment = (id: number, login: string) =>
    JSON.stringify({ id, login, updated_at: fresh, body: '<!-- factory -->\n@octocat earlier' })
  const run = review(factoryComment(98, 'mallory'), factoryComment(99, 'factory'))
  await run.end()
  assert.deepEqual(run.writes, [
    `pr edit ${pull} --remove-label agent:reviewing`,
    `pr edit ${pull} --add-assignee octocat`,
    `pr edit ${pull} --add-label agent:handed-back`,
    `api -X PATCH repos/acme/app/issues/comments/99 -f body=<!-- factory -->\n@octocat the agent:review run ended and waits on you: this run left no review verdict on the pull request.`,
  ])
})

test("a verdict planted in someone else's comment is ignored", async () => {
  const run = review(summary(fresh, 'tasks', 'mallory'), summary(fresh, 'dry'))
  await run.end()
  assert.deepEqual(run.writes, markedReady('agent:review'))
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
  const moved = upgrade('def\n')
  await moved.end()
  assert.deepEqual(moved.writes, [
    `pr edit ${pull} --remove-label agent:upgrading`,
    `pr edit ${pull} --add-label agent:review`,
  ])

  const untouched = upgrade('abc\n')
  await untouched.end()
  assert.deepEqual(untouched.writes, markedReady('agent:upgrade'))
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
  told(pull, 'pr', `the agent:fix run ${why} before it finished. Apply agent:fix again to retry.`)

test('a session that exits before a clean stop crashes the run', async () => {
  const run = factory()
  await run.report('SessionEnd', { reason: 'other' })
  assert.deepEqual(run.writes, [released, ...crashed('exited')])
  assert.deepEqual(run.closed, ['w7:t3'])
})

test('a turn that dies on an API error crashes the run', async () => {
  const run = factory()
  const input = { error: 'rate_limit', last_assistant_message: 'API Error: Rate limit reached' }
  assert.deepEqual(await run.report('StopFailure', input), {
    status: 200,
    body: `agent:fix app#12: Crashed: ${JSON.stringify(input)}`,
  })
  assert.deepEqual(run.writes, [released, ...crashed('stopped on an API error')])
})

test('the session end that closing a run fires is ignored', async () => {
  const run = factory()
  await run.end()
  assert.deepEqual(run.sessionEnds, [{ status: 404, body: 'No run in progress for this report' }])
  assert.equal(run.writes.length, 2)
  assert.deepEqual(run.closed, ['w7:t3'])
})

test('a run whose tab fails to close keeps its claim', async () => {
  const run = factory({ closes: false })
  assert.deepEqual(await run.end(), { status: 500, body: 'agent:fix app#12: herdr is down' })
  assert.deepEqual(run.writes, [])
  assert.deepEqual(run.sessionEnds, [])
  assert.equal(run.runs.size, 1)
})

test('a session that ended releases its run even when its tab fails to close', async () => {
  const run = factory({ closes: false })
  await run.report('SessionEnd', { reason: 'other' })
  assert.deepEqual(run.writes, [released, ...crashed('exited')])
  assert.equal(run.runs.size, 0)
})

test('a stop that does not say whether background work is left keeps the run', async () => {
  const run = factory()
  await run.report('Stop', {})
  assert.equal((await run.report('Stop', 'not json')).status, 400)
  assert.deepEqual(run.writes, [])
  assert.deepEqual(run.closed, [])
})
