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
    return { status: 401 }
  if (!headers['content-type']?.startsWith('application/json'))
    return { status: 415, body: 'Set the webhook content type to application/json' }

  const payload: WebhookPayload = JSON.parse(body.toString())
  const args = claudeArgs(String(headers['x-github-event']), payload)
  if (!args)
    return { status: 204 }

  const cwd = join(reposDir, payload.repository.full_name)
  if (!existsSync(cwd))
    return { status: 404, body: `No checkout at ${cwd}` }

  // Replying with the launch output turns the webhook's Recent Deliveries into the dispatch log.
  const { ok, output } = await startSession(args, cwd)
  return { status: ok ? 202 : 500, body: output }
}

function isSigned(body: Buffer, signature: string | undefined, secret: string): boolean {
  const expected = Buffer.from(`sha256=${createHmac('sha256', secret).update(body).digest('hex')}`)
  const received = Buffer.from(signature ?? '')
  return received.length === expected.length && timingSafeEqual(received, expected)
}
