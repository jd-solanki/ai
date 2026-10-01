import { execFile } from 'node:child_process'

const TRIGGERS = [
  { event: 'issues', label: 'agent:implement', requires: 'issue:spec', skill: 'implement', effort: 'medium', then: 'create-pr' },
  { event: 'pull_request', label: 'agent:review', skill: 'review-pr', effort: 'high' },
]

interface Subject {
  number: number
  html_url: string
  labels: { name: string }[]
}

export interface WebhookPayload {
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
    '--model',
    'opus',
    '--effort',
    trigger.effort,
    // The hook's stdin carries its JSON event, which `claude -p` would append to the prompt.
    ...(trigger.then ? ['--settings', runOnStop(`claude -p '/${trigger.then} ${url}' </dev/null`)] : []),
    `/${trigger.skill} ${url}`,
  ]
}

// ponytail: Stop fires after every turn, so a turn ending on a question, or a human follow-up, reruns `then`.
// create-pr only opens drafts and refuses a dirty tree; gate it on a done signal if stray drafts appear.
function runOnStop(command: string): string {
  return JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: 'command', command, timeout: 1800 }] }] } })
}

export function startSession(args: string[], cwd: string): Promise<{ ok: boolean, output: string }> {
  return new Promise((resolve) => {
    execFile('claude', args, { cwd }, (error, stdout, stderr) => resolve({ ok: !error, output: stdout + stderr }))
  })
}
