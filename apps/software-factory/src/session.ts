import { execFile } from 'node:child_process'

const TRIGGERS = [
  {
    event: 'issues',
    label: 'agent:implement',
    requires: 'issue:spec',
    skill: 'implement-spec',
    effort: 'medium',
    handOff: 'Once the draft pull request is open, hand it to the Reviewer: apply the agent:review label to the pull request as your last action.',
  },
  {
    event: 'pull_request',
    label: 'agent:review',
    skill: 'review-pr',
    effort: 'high',
    allow: ['Bash(gh pr ready:*)', 'Bash(gh pr edit:*)'],
    handOff: 'Once the round is saved: a dry round is the approval, so rewrite the pull request body in the shape /create-pr gives one, keeping every Closes line, and mark the pull request ready for review. A body Renovate wrote stays as it is: its release notes are the Upgrader\'s spec. A round that left tasks, in a review that has not ended, goes to the Fixer: apply the agent:fix label to the pull request as your last action.',
  },
  {
    event: 'pull_request',
    label: 'agent:fix',
    skill: 'implement',
    effort: 'medium',
    handOff: 'The work is the unresolved threads of the pull request\'s last review. Check the pull request out detached: its branch may be checked out in another worktree. Before fixing a thread, confirm its problem still holds in the current code: one that no longer does gets a reply saying why and stays unresolved. Each fix is its own commit, with a Conventional Commit subject naming the fix and no Closes footer. Push to the pull request\'s branch and resolve each thread you fixed, then hand back to the Reviewer: apply the agent:review label to the pull request as your last action.',
  },
  {
    event: 'pull_request',
    label: 'agent:upgrade',
    requires: '⬆️ Renovate',
    skill: 'implement',
    effort: 'medium',
    allow: ['Bash(gh pr ready:*)'],
    handOff: 'The work is upgrading the code for the dependency update this pull request makes: leave the code as it would read had it been written against the new versions. The release notes in the pull request body are the spec; follow their links where they defer to a migration guide. Check the pull request out detached: its branch may be checked out in another worktree. Each change is its own commit, with a Conventional Commit subject; an update the code needs nothing from gets no commit. Search this repository\'s open issues and pull requests for the upstream issues and pull requests the release notes name. Comment on each match, not on this pull request, linking this pull request and saying what the release changes for it. A commit that does an open issue\'s work ends with Closes <owner>/<repo>#<n>, so the merge closes it; never close one yourself, and an issue the release does not make doable gets a comment at most. Say on this pull request what you changed or why nothing needed to. With commits, push to the pull request\'s branch and hand it to the Reviewer: apply the agent:review label to the pull request as your last action. With none, there is no code to review: mark the pull request ready for review as your last action.',
  },
]

interface Subject {
  number: number
  html_url: string
  labels: { name: string }[]
}

export interface WebhookPayload {
  action?: string
  label?: { name: string }
  sender?: { login: string }
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
  if (payload.action !== 'labeled' || !subject || !payload.sender)
    return { skip: 'Not a label applied to a work item' }
  const trigger = TRIGGERS.find(t => t.event === event && t.label === payload.label?.name)
  if (!trigger)
    return { skip: `Not a trigger label for ${event}` }
  if (trigger.requires && !subject.labels.some(l => l.name === trigger.requires))
    return { skip: `Work item lacks ${trigger.requires}` }

  const url = subject.html_url
  const working = trigger.label.replace(/e?$/, 'ing')
  const edit = [payload.issue ? 'issue' : 'pr', 'edit', url]
  // A trigger label left on the work item could not be applied again.
  if (subject.labels.some(l => l.name === working))
    return { skip: `Work item already carries ${working}`, unlabel: [...edit, '--remove-label', trigger.label] }

  const release = [...edit, '--remove-label', working]
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
    '--append-system-prompt',
    `You run unattended for the software factory: nobody answers a question. @${payload.sender.login} applied ${trigger.label}: mention them wherever you stop for a human. ${trigger.handOff}`,
    '--settings',
    // The owner's `baseRef: head` would branch from whatever the clone has checked out, skills and all.
    JSON.stringify({ ...runWhenIdle(`gh ${release.join(' ')}`), permissions: { allow: trigger.allow ?? [] }, worktree: { baseRef: 'fresh' } }),
    `/${trigger.skill} ${url}`,
  ]
  return { args, claim: [...edit, '--remove-label', trigger.label, '--add-label', working], release }
}

// Stop fires after every turn, and a turn that ends while subagents run is not the end of the run.
// ponytail: a turn that ends on a question with nothing running still releases the claim while the session is open.
// Sessions are told nobody answers; gate on a done signal if a re-trigger ever doubles a run.
function runWhenIdle(command: string) {
  const idle = `node -e 'process.exit(JSON.parse(require("fs").readFileSync(0)).background_tasks.length ? 1 : 0)'`
  return { hooks: { Stop: [{ hooks: [{ type: 'command', command: `${idle} && ${command}`, timeout: 60 }] }] } }
}

function run(file: string, args: string[], cwd?: string): Promise<{ ok: boolean, output: string }> {
  return new Promise((resolve) => {
    execFile(file, args, { cwd }, (error, stdout, stderr) => resolve({ ok: !error, output: stdout + stderr }))
  })
}

// `fresh` branches from origin/HEAD: it moves only on a fetch, and follows a changed default branch only on set-head.
export async function startSession(args: string[], cwd: string) {
  await run('git', ['fetch', 'origin'], cwd)
  await run('git', ['remote', 'set-head', 'origin', '--auto'], cwd)
  return run('claude', args, cwd)
}
export const gh = (args: string[]) => run('gh', args)
