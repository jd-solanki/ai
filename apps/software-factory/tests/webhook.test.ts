import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { handleWebhook } from '../src/webhook.ts'

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

function factory(ok = true, claimed = true) {
  const started: string[] = []
  const labelEdits: string[] = []
  return {
    started,
    labelEdits,
    secret,
    reposDir,
    startSession: async (_args: string[], cwd: string) => {
      started.push(cwd)
      return { ok, output: 'claude output' }
    },
    gh: async (args: string[]) => {
      labelEdits.push(args.slice(3).join(' '))
      return { ok: claimed, output: 'gh output' }
    },
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

test('handleWebhook claims the work item before the session and releases it when the session fails to start', async () => {
  const body = reviewRequest('acme/app')
  const claim = '--remove-label agent:review --add-label agent:reviewing'

  const served = factory()
  await handleWebhook(signed(body), body, served)
  assert.deepEqual(served.labelEdits, [claim])

  const unstarted = factory(false)
  assert.equal((await handleWebhook(signed(body), body, unstarted)).status, 500)
  assert.deepEqual(unstarted.labelEdits, [claim, '--remove-label agent:reviewing'])

  const unclaimed = factory(true, false)
  assert.deepEqual(await handleWebhook(signed(body), body, unclaimed), {
    status: 500,
    body: 'pull_request labeled agent:review acme/app#12: gh output',
  })
  assert.deepEqual(unclaimed.started, [])
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
