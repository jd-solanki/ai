import { createHmac, timingSafeEqual } from 'node:crypto'
import { existsSync } from 'node:fs'
import type { IncomingHttpHeaders } from 'node:http'
import { join } from 'node:path'
import type { Runs } from './run-end.ts'
import { claudeArgs, type gh, type startSession, type WebhookPayload } from './session.ts'

interface Factory {
  secret: string
  reposDir: string
  runs: Runs
  startSession: typeof startSession
  gh: typeof gh
  findPreferredFactoryUp: () => Promise<string | undefined>
}

export async function handleWebhook(
  headers: IncomingHttpHeaders,
  body: Buffer,
  { secret, reposDir, runs, startSession, gh, findPreferredFactoryUp }: Factory,
): Promise<{ status: number; body?: string }> {
  const event = String(headers['x-github-event'] ?? '')
  if (!isSigned(body, headers['x-hub-signature-256'] as string | undefined, secret))
    return { status: 401, body: `${claimed(event, body)}: Signature mismatch` }
  if (!headers['content-type']?.startsWith('application/json'))
    return {
      status: 415,
      body: `${claimed(event, body)}: Set the webhook content type to application/json`,
    }

  const payload: WebhookPayload = JSON.parse(body.toString())
  // Replying with every delivery's outcome turns the webhook's Recent Deliveries into the dispatch log.
  const reply = (status: number, outcome: string) => ({
    status,
    body: `${received(event, payload)}: ${outcome}`,
  })

  const launch = claudeArgs(event, payload)
  const cwd = join(reposDir, payload.repository.full_name)
  if ('skip' in launch) {
    if (launch.unlabel && existsSync(cwd)) await gh(launch.unlabel, cwd)
    return reply(200, launch.skip)
  }

  if (!existsSync(cwd)) return reply(404, `No checkout at ${cwd}`)

  // Every factory gets every delivery, and two claims on one work item both succeed.
  const preferredFactory = await findPreferredFactoryUp()
  if (preferredFactory) return reply(200, `Deferred to ${preferredFactory}`)

  const claim = await gh(launch.claim, cwd)
  if (!claim.ok) return reply(500, claim.output.trim())

  const started = await startSession(launch, cwd)
  if (started.ok) runs.set(launch.token, { ...launch, workspace: started.workspace, cwd })
  // The trigger label stays off: re-applying it sends `labeled`, which starts this run again.
  else await gh(launch.release, cwd)
  return reply(started.ok ? 202 : 500, started.output.trim())
}

const UP_CHECK_TIMEOUT_MS = 2000

/** The first of `factoryUrls` whose factory is up. */
export async function findFactoryUp(factoryUrls: string[]): Promise<string | undefined> {
  // Only a factory's own HEAD answer counts: a Funnel URL whose server is down still answers 502.
  const upChecks = factoryUrls.map((url) =>
    fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(UP_CHECK_TIMEOUT_MS) }).then(
      (res) => res.ok,
      () => false,
    ),
  )
  // Checked at once, so a fallback waits one timeout however many factories rank above it.
  for (const [index, url] of factoryUrls.entries()) if (await upChecks[index]) return url
}

function received(
  event: string,
  { action, label, repository, issue, pull_request }: WebhookPayload,
): string {
  const number = (issue ?? pull_request)?.number
  return [
    event,
    action,
    label?.name,
    repository && `${repository.full_name}${number ? `#${number}` : ''}`,
  ]
    .filter(Boolean)
    .join(' ')
}

// A refused delivery is unverified text bound for the owner's terminal: control characters must not reach it.
function claimed(event: string, body: Buffer): string {
  const text = body.toString()
  let payload = {} as WebhookPayload
  try {
    payload = JSON.parse(new URLSearchParams(text).get('payload') ?? text) ?? payload
  } catch {}
  return received(event, payload).replace(/[^\w ./#:-]/g, '?') || 'unknown repo'
}

function isSigned(body: Buffer, signature: string | undefined, secret: string): boolean {
  const expected = Buffer.from(`sha256=${createHmac('sha256', secret).update(body).digest('hex')}`)
  const received = Buffer.from(signature ?? '')
  return received.length === expected.length && timingSafeEqual(received, expected)
}
