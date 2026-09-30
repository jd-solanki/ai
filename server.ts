import { execFile } from 'node:child_process'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { existsSync } from 'node:fs'
import { createServer } from 'node:http'
import { join } from 'node:path'

const PORT = 3456

const TRIGGERS = [
  { event: 'issues', label: 'agent:implement', requires: 'issue:spec', skill: 'implement', then: 'create-pr' },
  { event: 'pull_request', label: 'pr:review', skill: 'review-pr' },
]

// ponytail: Stop fires after every turn, so a turn ending on a question, or a human follow-up, reruns `then`.
// create-pr only opens drafts and refuses a dirty tree; gate it on a done signal if stray drafts appear.
function runOnStop(command: string): string {
  return JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: 'command', command, timeout: 1800 }] }] } })
}

interface Subject {
  number: number
  html_url: string
  labels: { name: string }[]
}

interface WebhookPayload {
  action?: string
  label?: { name: string }
  repository: { name: string, full_name: string }
  issue?: Subject
  pull_request?: Subject
}

export function claudeArgs(event: string, payload: WebhookPayload): string[] | undefined {
  const trigger = TRIGGERS.find(t => t.event === event && t.label === payload.label?.name)
  const subject = payload.issue ?? payload.pull_request
  if (payload.action !== 'labeled' || !trigger || !subject)
    return
  if (trigger.requires && !subject.labels.some(l => l.name === trigger.requires))
    return

  const url = subject.html_url
  return [
    '--bg',
    '--name',
    `${trigger.label} ${payload.repository.name}#${subject.number}`,
    // Concurrent sessions in one checkout clobber each other; a re-trigger reuses its worktree.
    '--worktree',
    `${trigger.skill}-${subject.number}`,
    // The hook's stdin carries its JSON event, which `claude -p` would append to the prompt.
    ...(trigger.then ? ['--settings', runOnStop(`claude -p '/${trigger.then} ${url}' </dev/null`)] : []),
    `/${trigger.skill} ${url}`,
  ]
}

export function isSigned(body: Buffer, signature: string | undefined, secret: string): boolean {
  const expected = Buffer.from(`sha256=${createHmac('sha256', secret).update(body).digest('hex')}`)
  const received = Buffer.from(signature ?? '')
  return received.length === expected.length && timingSafeEqual(received, expected)
}

if (import.meta.main) {
  const { GITHUB_WEBHOOK_SECRET: secret, REPOS_DIR: reposDir } = process.env
  if (!secret || !reposDir)
    throw new Error('Set GITHUB_WEBHOOK_SECRET and REPOS_DIR')
  // `claude --bg` may spawn the long-lived background service, which hands this env to every later session.
  delete process.env.GITHUB_WEBHOOK_SECRET

  createServer(async (req, res) => {
    const chunks: Buffer[] = []
    for await (const chunk of req)
      chunks.push(chunk)
    const body = Buffer.concat(chunks)
    if (!isSigned(body, req.headers['x-hub-signature-256'] as string | undefined, secret))
      return res.writeHead(401).end()
    if (!req.headers['content-type']?.startsWith('application/json'))
      return res.writeHead(415).end('Set the webhook content type to application/json')

    const payload: WebhookPayload = JSON.parse(body.toString())
    const args = claudeArgs(String(req.headers['x-github-event']), payload)
    if (!args)
      return res.writeHead(204).end()

    const cwd = join(reposDir, payload.repository.full_name)
    if (!existsSync(cwd))
      return res.writeHead(404).end(`No checkout at ${cwd}`)

    // Replying with claude's output turns the webhook's Recent Deliveries into the dispatch log.
    execFile('claude', args, { cwd }, (error, stdout, stderr) => {
      res.writeHead(error ? 500 : 202).end(stdout + stderr)
    })
  }).listen(PORT)
}
