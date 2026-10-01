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

interface Launch {
  args: string[]
  claim: string[]
  release: string[]
}

export function claudeArgs(event: string, payload: WebhookPayload): Launch | { skip: string, unlabel?: string[] } {
  const subject = payload.issue ?? payload.pull_request
  if (payload.action !== 'labeled' || !subject)
    return { skip: 'Not a label applied to a work item' }
  const trigger = TRIGGERS.find(t => t.event === event && t.label === payload.label?.name)
  if (!trigger)
    return { skip: `Not a trigger label for ${event}` }
  if (trigger.requires && !subject.labels.some(l => l.name === trigger.requires))
    return { skip: `Work item lacks ${trigger.requires}` }

  const url = subject.html_url
  const working = `${trigger.label}ing`
  const edit = [payload.issue ? 'issue' : 'pr', 'edit', url]
  // A trigger label left on the work item could not be applied again.
  if (subject.labels.some(l => l.name === working))
    return { skip: `Work item already carries ${working}`, unlabel: [...edit, '--remove-label', trigger.label] }

  const release = [...edit, '--remove-label', working]
  // The hook's stdin carries its JSON event, which `claude -p` would append to the prompt.
  const then = trigger.then ? `claude -p '/${trigger.then} ${url}' </dev/null; ` : ''
  const args = [
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
    '--settings',
    runOnStop(`${then}gh ${release.join(' ')}`),
    `/${trigger.skill} ${url}`,
  ]
  return { args, claim: [...edit, '--remove-label', trigger.label, '--add-label', working], release }
}

// ponytail: Stop fires after every turn, so a turn ending on a question, or a human follow-up, reruns `then`
// and releases the claim while the session is still open.
// create-pr only opens drafts and refuses a dirty tree; gate both on a done signal if stray drafts appear.
function runOnStop(command: string): string {
  return JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: 'command', command, timeout: 1800 }] }] } })
}

function run(file: string, args: string[], cwd?: string): Promise<{ ok: boolean, output: string }> {
  return new Promise((resolve) => {
    execFile(file, args, { cwd }, (error, stdout, stderr) => resolve({ ok: !error, output: stdout + stderr }))
  })
}

export const startSession = (args: string[], cwd: string) => run('claude', args, cwd)
export const gh = (args: string[]) => run('gh', args)
