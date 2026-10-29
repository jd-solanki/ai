import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import type { Runs } from '../src/run-end.ts'
import type { Launch } from '../src/session.ts'
import { findFactoryUp, handleWebhook } from '../src/webhook.ts'

const secret = 'secret'
const reposDir = mkdtempSync(join(tmpdir(), 'software-factory-'))
mkdirSync(join(reposDir, 'acme/app'), { recursive: true })
after(() => rmSync(reposDir, { recursive: true }))

function reviewRequest(fullName: string, ...labels: string[]) {
  return Buffer.from(
    JSON.stringify({
      action: 'labeled',
      label: { name: 'agent:review' },
      sender: { login: 'octocat' },
      repository: { name: 'app', full_name: fullName },
      pull_request: {
        number: 12,
        title: 'Kiosk pairing',
        html_url: 'https://github.com/acme/app/pull/12',
        labels: labels.map((name) => ({ name })),
      },
    }),
  )
}

function signed(body: Buffer, key = secret) {
  return {
    'x-github-event': 'pull_request',
    'content-type': 'application/json',
    'x-hub-signature-256': `sha256=${createHmac('sha256', key).update(body).digest('hex')}`,
  }
}

function factory(ok: boolean = true, claimed = true) {
  const started: string[] = []
  const labelEdits: string[] = []
  const ghDirs: (string | undefined)[] = []
  const runs: Runs = new Map()
  return {
    started,
    labelEdits,
    ghDirs,
    runs,
    secret,
    reposDir,
    startSession: async (_launch: Launch, cwd: string) => {
      started.push(cwd)
      return ok ? { ok, output: 'claude output', tab: 'w7:t3' } : { ok, output: 'claude output' }
    },
    gh: async (args: string[], cwd?: string) => {
      ghDirs.push(cwd)
      labelEdits.push(args.slice(3).join(' '))
      return { ok: claimed, stdout: '', output: 'gh output' }
    },
    findPreferredFactoryUp: async (): Promise<string | undefined> => undefined,
  }
}

test('handleWebhook refuses a body the secret did not sign', async () => {
  const body = reviewRequest('acme/app')
  const served = factory()
  const refused = {
    status: 401,
    body: 'pull_request labeled agent:review acme/app#12: Signature mismatch',
  }
  assert.deepEqual(await handleWebhook(signed(body, 'other'), body, served), refused)
  assert.equal(
    (await handleWebhook({ ...signed(body), 'x-hub-signature-256': undefined }, body, served))
      .status,
    401,
  )
  const forged = reviewRequest('acme/app\u001B[2J')
  assert.deepEqual(await handleWebhook(signed(forged, 'other'), forged, served), {
    status: 401,
    body: 'pull_request labeled agent:review acme/app??2J#12: Signature mismatch',
  })
  const form = Buffer.from(new URLSearchParams({ payload: body.toString() }).toString())
  assert.deepEqual(await handleWebhook(signed(form, 'other'), form, served), refused)
  assert.deepEqual(await handleWebhook({}, Buffer.from(''), served), {
    status: 401,
    body: 'unknown repo: Signature mismatch',
  })
  assert.deepEqual(served.started, [])
  assert.deepEqual(served.labelEdits, [])
})

test('handleWebhook starts a session only for a trigger label on a served repo', async () => {
  const body = reviewRequest('acme/app')
  const served = factory()
  assert.equal(
    (
      await handleWebhook(
        { ...signed(body), 'content-type': 'application/x-www-form-urlencoded' },
        body,
        served,
      )
    ).status,
    415,
  )
  assert.deepEqual(
    await handleWebhook({ ...signed(body), 'x-github-event': 'ping' }, body, served),
    { status: 200, body: 'ping labeled agent:review acme/app#12: Not a trigger label for ping' },
  )
  const unserved = reviewRequest('acme/missing')
  assert.equal((await handleWebhook(signed(unserved), unserved, served)).status, 404)
  assert.deepEqual(served.started, [])
  assert.deepEqual(served.labelEdits, [])

  assert.deepEqual(await handleWebhook(signed(body), body, served), {
    status: 202,
    body: 'pull_request labeled agent:review acme/app#12: claude output',
  })
  assert.deepEqual(served.started, [join(reposDir, 'acme/app')])
})

test('handleWebhook claims the work item before the session and hands it back when the session fails to start', async () => {
  const body = reviewRequest('acme/app')
  const claim =
    '--remove-label agent:review --remove-label agent:handed-back --add-label agent:reviewing'

  const served = factory()
  await handleWebhook(signed(body), body, served)
  assert.deepEqual(served.labelEdits, [claim])

  const unstarted = factory(false)
  assert.equal((await handleWebhook(signed(body), body, unstarted)).status, 500)
  assert.deepEqual(unstarted.labelEdits, [
    claim,
    '--remove-label agent:reviewing',
    '.login',
    '--jq .[] | {id, login: .user.login, updated_at, body} | tojson',
    '--add-assignee octocat --add-label agent:handed-back',
    '--body <!-- factory -->\n@octocat the agent:review run could not start. Apply agent:review again to retry.',
  ])

  const unclaimed = factory(true, false)
  assert.deepEqual(await handleWebhook(signed(body), body, unclaimed), {
    status: 500,
    body: 'pull_request labeled agent:review acme/app#12: gh output',
  })
  assert.deepEqual(unclaimed.started, [])
})

test('handleWebhook says to remove the working label when a failed launch cannot', async () => {
  const body = reviewRequest('acme/app')
  const unstarted = factory(false)
  const gh = unstarted.gh
  unstarted.gh = async (args, cwd) =>
    args.at(-1) === 'agent:reviewing' && args.at(-2) === '--remove-label'
      ? { ok: false, stdout: '', output: 'HTTP 502' }
      : gh(args, cwd)
  assert.deepEqual(await handleWebhook(signed(body), body, unstarted), {
    status: 500,
    body: 'pull_request labeled agent:review acme/app#12: claude output\nHTTP 502',
  })
  const comment = unstarted.labelEdits.find((edit) => edit.startsWith('--body'))
  assert.match(comment ?? '', /could not remove its working label/)
  assert.doesNotMatch(comment ?? '', /Apply agent:review again to retry/)
})

test('handleWebhook ignores a trigger label on a claimed work item and removes it', async () => {
  const body = reviewRequest('acme/app', 'agent:review', 'agent:reviewing')
  const served = factory()
  assert.deepEqual(await handleWebhook(signed(body), body, served), {
    status: 200,
    body: 'pull_request labeled agent:review acme/app#12: Work item already carries agent:reviewing',
  })
  assert.deepEqual(served.labelEdits, ['--remove-label agent:review'])
  assert.deepEqual(served.started, [])
})

test("handleWebhook runs gh in the served repo's clone", async () => {
  const clone = join(reposDir, 'acme/app')
  const unstarted = factory(false)
  const body = reviewRequest('acme/app')
  await handleWebhook(signed(body), body, unstarted)
  assert.deepEqual(new Set(unstarted.ghDirs), new Set([clone]))

  const claimed = factory()
  const relabelled = reviewRequest('acme/app', 'agent:review', 'agent:reviewing')
  await handleWebhook(signed(relabelled), relabelled, claimed)
  assert.deepEqual(claimed.ghDirs, [clone])
})

test('handleWebhook tracks each run it starts', async () => {
  const body = reviewRequest('acme/app')
  const served = factory()
  await handleWebhook(signed(body), body, served)
  assert.deepEqual(
    [...served.runs.values()].map((run) => [run.tab, run.cwd, run.release.join(' ')]),
    [
      [
        'w7:t3',
        join(reposDir, 'acme/app'),
        'pr edit https://github.com/acme/app/pull/12 --remove-label agent:reviewing',
      ],
    ],
  )

  const unstarted = factory(false)
  await handleWebhook(signed(body), body, unstarted)
  assert.equal(unstarted.runs.size, 0)
})

test('handleWebhook leaves a delivery to a preferred factory that is up', async () => {
  const body = reviewRequest('acme/app')
  const served = {
    ...factory(),
    findPreferredFactoryUp: async () => 'https://office.example.ts.net/',
  }
  assert.deepEqual(await handleWebhook(signed(body), body, served), {
    status: 200,
    body: 'pull_request labeled agent:review acme/app#12: Deferred to https://office.example.ts.net/',
  })
  assert.deepEqual(served.labelEdits, [])
  assert.deepEqual(served.started, [])
})

const followUp = 'https://github.com/acme/app/issues/40'
const comments = (number: number) =>
  `api repos/acme/app/issues/${number}/comments --paginate --jq .[] | {id, login: .user.login, updated_at, body} | tojson`

function mergeOf(merged = true) {
  return Buffer.from(
    JSON.stringify({
      action: 'closed',
      sender: { login: 'octocat' },
      repository: { name: 'app', full_name: 'acme/app' },
      pull_request: {
        number: 12,
        title: 'Kiosk pairing',
        html_url: 'https://github.com/acme/app/pull/12',
        labels: [],
        merged,
      },
    }),
  )
}

// `summary` is the review summary `login` wrote on the merged pull request, `state` its follow-up's.
function merging(summary: string, { state = 'OPEN', login = 'factory' } = {}) {
  const served = factory()
  const writes: string[] = []
  served.gh = async (args, cwd) => {
    served.ghDirs.push(cwd)
    const read = {
      'api user --jq .login': 'factory\n',
      [comments(12)]: JSON.stringify({ id: 7, login, updated_at: '', body: summary }),
      [comments(40)]: '',
      'issue view 40 -R acme/app --json url,state': JSON.stringify({ url: followUp, state }),
    }[args.join(' ')]
    if (read !== undefined) return { ok: true, stdout: read, output: read }
    writes.push(args.join(' '))
    return { ok: true, stdout: '', output: '' }
  }
  return { ...served, writes }
}

const summaryFiling = (holds: string) =>
  `<!-- review-pr:summary -->\n<!-- review-pr:verdict dry -->\n<!-- review-pr:follow-up 40 ${holds} -->\n## 🔍 Review: 9/10`

test("handleWebhook hands a merged pull request's follow-up of nitpicks to the Implementer", async () => {
  const body = mergeOf()
  const served = merging(summaryFiling('nitpicks'))
  assert.deepEqual(await handleWebhook(signed(body), body, served), {
    status: 200,
    body: `pull_request closed acme/app#12: Handed ${followUp} to agent:implement`,
  })
  assert.deepEqual(served.writes, [`issue edit ${followUp} --add-label agent:implement`])
  assert.deepEqual(new Set(served.ghDirs), new Set([join(reposDir, 'acme/app')]))
  assert.deepEqual(served.started, [])
})

test('handleWebhook hands a follow-up holding an Unproven finding back to whoever merged', async () => {
  const body = mergeOf()
  const served = merging(summaryFiling('unproven'))
  assert.deepEqual(await handleWebhook(signed(body), body, served), {
    status: 200,
    body: `pull_request closed acme/app#12: Waiting on octocat: ${followUp} holds an Unproven finding`,
  })
  assert.deepEqual(served.writes, [
    `issue edit ${followUp} --add-assignee octocat --add-label agent:handed-back`,
    `issue comment ${followUp} --body <!-- factory -->\n@octocat #12 merged, and this follow-up holds an Unproven finding, so it waits on you. Each one ends in a recommendation: apply agent:implement to follow them, or edit one first.`,
  ])
})

test('handleWebhook hands on no follow-up that is closed, unfiled or from an unmerged pull request', async () => {
  const body = mergeOf()
  const declined = merging(summaryFiling('nitpicks'), { state: 'CLOSED' })
  assert.deepEqual(await handleWebhook(signed(body), body, declined), {
    status: 200,
    body: `pull_request closed acme/app#12: Its follow-up ${followUp} is closed`,
  })
  const planted = merging(summaryFiling('nitpicks'), { login: 'mallory' })
  assert.deepEqual(await handleWebhook(signed(body), body, planted), {
    status: 200,
    body: 'pull_request closed acme/app#12: Its review filed no follow-up',
  })
  const unmerged = mergeOf(false)
  const closed = merging(summaryFiling('nitpicks'))
  assert.deepEqual(await handleWebhook(signed(unmerged), unmerged, closed), {
    status: 200,
    body: 'pull_request closed acme/app#12: Not a label applied to a work item',
  })
  const deferred = {
    ...merging(summaryFiling('nitpicks')),
    findPreferredFactoryUp: async () => 'https://office.example.ts.net/',
  }
  assert.equal((await handleWebhook(signed(body), body, deferred)).status, 200)
  for (const served of [declined, planted, closed, deferred]) assert.deepEqual(served.writes, [])
})

test('handleWebhook answers 500 when it cannot read the follow-up', async () => {
  const body = mergeOf()
  const served = merging(summaryFiling('nitpicks'))
  const gh = served.gh
  served.gh = async (args, cwd) =>
    args[0] === 'issue' && args[1] === 'view'
      ? { ok: false, stdout: '', output: 'HTTP 502' }
      : gh(args, cwd)
  assert.deepEqual(await handleWebhook(signed(body), body, served), {
    status: 500,
    body: 'pull_request closed acme/app#12: gh issue view failed: HTTP 502',
  })
  assert.deepEqual(served.writes, [])
})

test('findFactoryUp returns the highest-ranked factory that answers its own HEAD', async () => {
  // A down factory behind Funnel answers 502 from tailscaled.
  const server = createServer((req, res) => res.writeHead(req.url === '/down' ? 502 : 200).end())
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const { port } = server.address() as { port: number }
  const factory = (path: string) => `http://localhost:${port}${path}`
  try {
    assert.equal(
      await findFactoryUp([factory('/down'), factory('/up'), factory('/also-up')]),
      factory('/up'),
    )
    assert.equal(await findFactoryUp([factory('/down'), 'http://localhost:1/']), undefined)
    assert.equal(await findFactoryUp([]), undefined)
  } finally {
    server.close()
  }
})
