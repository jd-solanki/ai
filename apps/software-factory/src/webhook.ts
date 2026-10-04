import { createHmac, timingSafeEqual } from 'node:crypto'
import { existsSync } from 'node:fs'
import type { IncomingHttpHeaders } from 'node:http'
import { join } from 'node:path'
import { claudeArgs, type gh, type startSession, type WebhookPayload } from './session.ts'

interface Factory {
  secret: string
  reposDir: string
  startSession: typeof startSession
  gh: typeof gh
}

export async function handleWebhook(headers: IncomingHttpHeaders, body: Buffer, { secret, reposDir, startSession, gh }: Factory): Promise<{ status: number, body?: string }> {
  const event = String(headers['x-github-event'] ?? '')
  if (!isSigned(body, headers['x-hub-signature-256'] as string | undefined, secret))
    return { status: 401, body: `${claimed(event, body)}: Signature mismatch` }
  if (!headers['content-type']?.startsWith('application/json'))
    return { status: 415, body: `${claimed(event, body)}: Set the webhook content type to application/json` }

  const payload: WebhookPayload = JSON.parse(body.toString())
  // Replying with every delivery's outcome turns the webhook's Recent Deliveries into the dispatch log.
  const reply = (status: number, outcome: string) => ({ status, body: `${received(event, payload)}: ${outcome}` })

  const launch = claudeArgs(event, payload)
  if ('skip' in launch) {
    if (launch.unlabel)
      await gh(launch.unlabel)
    return reply(200, launch.skip)
  }

  const cwd = join(reposDir, payload.repository.full_name)
  if (!existsSync(cwd))
    return reply(404, `No checkout at ${cwd}`)

  const claim = await gh(launch.claim)
  if (!claim.ok)
    return reply(500, claim.output.trim())

  const { ok, output } = await startSession(launch.args, cwd)
  // The trigger label stays off: re-applying it sends `labeled`, which starts this run again.
  if (!ok)
    await gh(launch.release)
  return reply(ok ? 202 : 500, output.trim())
}

function received(event: string, { action, label, repository, issue, pull_request }: WebhookPayload): string {
  const number = (issue ?? pull_request)?.number
  return [event, action, label?.name, repository && `${repository.full_name}${number ? `#${number}` : ''}`].filter(Boolean).join(' ')
}

// A refused delivery is unverified text bound for the owner's terminal: control characters must not reach it.
function claimed(event: string, body: Buffer): string {
  const text = body.toString()
  let payload = {} as WebhookPayload
  try {
    payload = JSON.parse(new URLSearchParams(text).get('payload') ?? text) ?? payload
  }
  catch {}
  return received(event, payload).replace(/[^\w ./#:-]/g, '?') || 'unknown repo'
}

function isSigned(body: Buffer, signature: string | undefined, secret: string): boolean {
  const expected = Buffer.from(`sha256=${createHmac('sha256', secret).update(body).digest('hex')}`)
  const received = Buffer.from(signature ?? '')
  return received.length === expected.length && timingSafeEqual(received, expected)
}
