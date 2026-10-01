import { createHmac, timingSafeEqual } from 'node:crypto'
import { existsSync } from 'node:fs'
import type { IncomingHttpHeaders } from 'node:http'
import { join } from 'node:path'
import { claudeArgs, type startSession, type WebhookPayload } from './session.ts'

interface Factory {
  secret: string
  reposDir: string
  startSession: typeof startSession
}

export async function handleWebhook(headers: IncomingHttpHeaders, body: Buffer, { secret, reposDir, startSession }: Factory): Promise<{ status: number, body?: string }> {
  if (!isSigned(body, headers['x-hub-signature-256'] as string | undefined, secret))
    return { status: 401, body: 'Signature mismatch' }
  if (!headers['content-type']?.startsWith('application/json'))
    return { status: 415, body: 'Set the webhook content type to application/json' }

  const event = String(headers['x-github-event'])
  const payload: WebhookPayload = JSON.parse(body.toString())
  // Replying with every delivery's outcome turns the webhook's Recent Deliveries into the dispatch log.
  const reply = (status: number, outcome: string) => ({ status, body: `${received(event, payload)}: ${outcome}` })

  const launch = claudeArgs(event, payload)
  if ('skip' in launch)
    return reply(200, launch.skip)

  const cwd = join(reposDir, payload.repository.full_name)
  if (!existsSync(cwd))
    return reply(404, `No checkout at ${cwd}`)

  const { ok, output } = await startSession(launch.args, cwd)
  return reply(ok ? 202 : 500, output.trim())
}

function received(event: string, { action, label, repository, issue, pull_request }: WebhookPayload): string {
  const number = (issue ?? pull_request)?.number
  return [event, action, label?.name, repository && `${repository.full_name}${number ? `#${number}` : ''}`].filter(Boolean).join(' ')
}

function isSigned(body: Buffer, signature: string | undefined, secret: string): boolean {
  const expected = Buffer.from(`sha256=${createHmac('sha256', secret).update(body).digest('hex')}`)
  const received = Buffer.from(signature ?? '')
  return received.length === expected.length && timingSafeEqual(received, expected)
}
