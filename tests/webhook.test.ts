import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { handleWebhook } from '../src/webhook.ts'

const secret = 'secret'
const reposDir = mkdtempSync(join(tmpdir(), 'cl-factory-'))
mkdirSync(join(reposDir, 'acme/app'), { recursive: true })
after(() => rmSync(reposDir, { recursive: true }))

function reviewRequest(fullName: string) {
  return Buffer.from(JSON.stringify({
    action: 'labeled',
    label: { name: 'agent:review' },
    repository: { name: 'app', full_name: fullName },
    pull_request: { number: 12, html_url: 'https://github.com/acme/app/pull/12', labels: [] },
  }))
}

function signed(body: Buffer, key = secret) {
  return {
    'x-github-event': 'pull_request',
    'content-type': 'application/json',
    'x-hub-signature-256': `sha256=${createHmac('sha256', key).update(body).digest('hex')}`,
  }
}

function factory(ok = true) {
  const started: string[] = []
  return {
    started,
    secret,
    reposDir,
    startSession: async (_args: string[], cwd: string) => {
      started.push(cwd)
      return { ok, output: 'claude output' }
    },
  }
}

test('handleWebhook refuses a body the secret did not sign', async () => {
  const body = reviewRequest('acme/app')
  const served = factory()
  const refused = { status: 401, body: 'pull_request labeled agent:review acme/app#12: Signature mismatch' }
  assert.deepEqual(await handleWebhook(signed(body, 'other'), body, served), refused)
  assert.equal((await handleWebhook({ ...signed(body), 'x-hub-signature-256': undefined }, body, served)).status, 401)
  const forged = reviewRequest('acme/app\u001B[2J')
  assert.deepEqual(await handleWebhook(signed(forged, 'other'), forged, served), { status: 401, body: 'pull_request labeled agent:review acme/app??2J#12: Signature mismatch' })
  const form = Buffer.from(new URLSearchParams({ payload: body.toString() }).toString())
  assert.deepEqual(await handleWebhook(signed(form, 'other'), form, served), refused)
  assert.deepEqual(await handleWebhook({}, Buffer.from(''), served), { status: 401, body: 'unknown repo: Signature mismatch' })
  assert.deepEqual(served.started, [])
})

test('handleWebhook starts a session only for a trigger label on a served repo', async () => {
  const body = reviewRequest('acme/app')
  const served = factory()
  assert.equal((await handleWebhook({ ...signed(body), 'content-type': 'application/x-www-form-urlencoded' }, body, served)).status, 415)
  assert.deepEqual(await handleWebhook({ ...signed(body), 'x-github-event': 'ping' }, body, served), { status: 200, body: 'ping labeled agent:review acme/app#12: Not a trigger label for ping' })
  const unserved = reviewRequest('acme/missing')
  assert.equal((await handleWebhook(signed(unserved), unserved, served)).status, 404)
  assert.deepEqual(served.started, [])

  assert.deepEqual(await handleWebhook(signed(body), body, served), { status: 202, body: 'pull_request labeled agent:review acme/app#12: claude output' })
  assert.deepEqual(served.started, [join(reposDir, 'acme/app')])
  assert.equal((await handleWebhook(signed(body), body, factory(false))).status, 500)
})
