import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'

// Where the factory server listens, for GitHub and for a session's run reports.
export const PORT = 3456

const TRIGGERS = [
  {
    event: 'issues',
    label: 'agent:implement',
    requires: 'issue:spec',
    skill: 'implement-spec',
    effort: 'medium',
  },
  {
    event: 'pull_request',
    label: 'agent:review',
    skill: 'review-pr',
    effort: 'high',
    allow: ['Bash(gh pr edit:*)'],
    instructions:
      "Once the round is saved: a dry round is the approval, so rewrite the pull request body in the shape /create-pr gives one, keeping every Closes line. A body Renovate wrote stays as it is: its release notes are the Upgrader's spec.",
  },
  {
    event: 'pull_request',
    label: 'agent:fix',
    skill: 'implement',
    effort: 'medium',
    instructions:
      "The work is the unresolved threads of the pull request's last review. Check the pull request out detached: its branch may be checked out in another worktree. Before fixing a thread, confirm its problem still holds in the current code: one that no longer does gets a reply saying why and stays unresolved. Each fix is its own commit, with a Conventional Commit subject naming the fix and no Closes footer. Push to the pull request's branch and resolve each thread you fixed.",
  },
  {
    event: 'pull_request',
    label: 'agent:upgrade',
    requires: '⬆️ Renovate',
    skill: 'implement',
    effort: 'medium',
    instructions:
      "The work is upgrading the code for the dependency update this pull request makes: leave the code as it would read had it been written against the new versions. The release notes in the pull request body are the spec; follow their links where they defer to a migration guide. Check the pull request out detached: its branch may be checked out in another worktree. Each change is its own commit, with a Conventional Commit subject; an update the code needs nothing from gets no commit. Search this repository's open issues and pull requests for the upstream issues and pull requests the release notes name. Comment on each match, not on this pull request, linking this pull request and saying what the release changes for it. A commit that does an open issue's work ends with Closes <owner>/<repo>#<n>, so the merge closes it; never close one yourself, and an issue the release does not make doable gets a comment at most. Say on this pull request what you changed or why nothing needed to, and push your commits to the pull request's branch.",
  },
]

interface Subject {
  number: number
  html_url: string
  labels: { name: string }[]
  head?: { sha: string }
}

export interface WebhookPayload {
  action?: string
  label?: { name: string }
  sender?: { login: string }
  repository: { name: string; full_name: string }
  issue?: Subject
  pull_request?: Subject
}

// What a run's hand-off reads GitHub for.
export interface WorkItem {
  trigger: string
  kind: 'issue' | 'pr'
  url: string
  repo: string
  number: number
  sender: string
  // The upgrade's head before the run, so its end can tell whether it pushed.
  head?: string
  claimedAt: string
}

export interface Launch {
  args: string[]
  name: string
  // A session reports to the server under it; anyone who can reach the server could otherwise end a run.
  token: string
  work: WorkItem
  claim: string[]
  release: string[]
  crash: (why: string) => string[]
}

export function claudeArgs(
  event: string,
  payload: WebhookPayload,
): Launch | { skip: string; unlabel?: string[] } {
  const subject = payload.issue ?? payload.pull_request
  if (payload.action !== 'labeled' || !subject || !payload.sender)
    return { skip: 'Not a label applied to a work item' }
  const trigger = TRIGGERS.find((t) => t.event === event && t.label === payload.label?.name)
  if (!trigger) return { skip: `Not a trigger label for ${event}` }
  if (trigger.requires && !subject.labels.some((l) => l.name === trigger.requires))
    return { skip: `Work item lacks ${trigger.requires}` }

  const url = subject.html_url
  const working = trigger.label.replace(/e?$/, 'ing')
  const kind = payload.issue ? 'issue' : 'pr'
  const edit = [kind, 'edit', url]
  // A trigger label left on the work item could not be applied again.
  if (subject.labels.some((l) => l.name === working))
    return {
      skip: `Work item already carries ${working}`,
      unlabel: [...edit, '--remove-label', trigger.label],
    }

  const name = `${trigger.label} ${payload.repository.name}#${subject.number}`
  const mention = `@${payload.sender.login}`
  const token = randomUUID()
  const args = [
    '--name',
    name,
    // Concurrent sessions in one checkout clobber each other; a re-trigger reuses its worktree.
    '--worktree',
    `${trigger.skill}-${subject.number}`,
    '--model',
    'opus',
    '--effort',
    trigger.effort,
    // Every trigger's `allow` and instructions assume auto mode, whatever the owner's default is.
    '--permission-mode',
    'auto',
    '--append-system-prompt',
    `You run unattended for the software factory: nobody reads this terminal or answers a question asked in it. ${mention} applied ${trigger.label}: anything they must do or decide goes on ${url}, mentioning them. ${trigger.instructions ?? ''}`.trimEnd(),
    '--settings',
    JSON.stringify({
      hooks: hooks(token),
      permissions: { allow: trigger.allow ?? [] },
      // The owner's `baseRef: head` would branch from whatever the clone has checked out, skills and all.
      worktree: { baseRef: 'fresh' },
    }),
    `/${trigger.skill} ${url}`,
  ]
  return {
    args,
    name,
    token,
    work: {
      trigger: trigger.label,
      kind,
      url,
      repo: payload.repository.full_name,
      number: subject.number,
      sender: payload.sender.login,
      head: subject.head?.sha,
      claimedAt: new Date().toISOString(),
    },
    claim: [...edit, '--remove-label', trigger.label, '--add-label', working],
    release: [...edit, '--remove-label', working],
    crash: (why) => [
      kind,
      'comment',
      url,
      '--body',
      `${mention} the ${trigger.label} run ${why} before it finished. Apply ${trigger.label} again to retry.`,
    ],
  }
}

// The server decides how a run ends: each hook only hands it the hook's input.
function hooks(token: string) {
  const report = (hook: string) => [
    {
      hooks: [
        {
          type: 'command',
          command: `curl -sS --data-binary @- http://localhost:${PORT}/runs/${token}/${hook}`,
          timeout: 60,
        },
      ],
    },
  ]
  return {
    Stop: report('Stop'),
    StopFailure: report('StopFailure'),
    SessionEnd: report('SessionEnd'),
  }
}

// herdr pane run types its command into the pane's shell; the system prompt and settings must each reach claude as one argument.
const shell = (args: string[]) => args.map((arg) => `'${arg.replaceAll("'", `'\\''`)}'`).join(' ')

interface Outcome {
  ok: boolean
  output: string
}

function run(file: string, args: string[], cwd?: string): Promise<Outcome & { stdout: string }> {
  return new Promise((resolve) => {
    execFile(file, args, { cwd }, (error, stdout, stderr) =>
      // A missing binary prints nothing. Its code says why; its message would repeat the whole command line.
      resolve({
        ok: !error,
        stdout,
        output: stdout + stderr || (error ? `${file} failed: ${error.code ?? error.signal}` : ''),
      }),
    )
  })
}

// `fresh` branches from origin/HEAD: it moves only on a fetch, and follows a changed default branch only on set-head.
// A herdr workspace puts the session in the owner's agent list; herdr must be running.
export async function startSession(
  { args, name }: Launch,
  cwd: string,
): Promise<(Outcome & { ok: false }) | (Outcome & { ok: true; workspace: string })> {
  await run('git', ['fetch', 'origin'], cwd)
  await run('git', ['remote', 'set-head', 'origin', '--auto'], cwd)
  const created = await run('herdr', [
    'workspace',
    'create',
    '--cwd',
    cwd,
    '--label',
    name,
    '--no-focus',
  ])
  let pane: { pane_id: string; workspace_id: string }
  try {
    // A warning on stderr must not break the parse.
    pane = JSON.parse(created.stdout).result.root_pane
    if (!pane.pane_id) throw new Error('no root pane')
  } catch {
    // Thrown, it would crash the server with the claim held.
    return { ok: false, output: `herdr workspace create: ${created.output}` }
  }
  // A command typed before the shell's prompt is up loses its Enter.
  const prompt = await run('herdr', [
    'pane',
    'wait-output',
    pane.pane_id,
    '--regex',
    '\\S',
    '--timeout',
    '10000',
  ])
  // `agent start` waits until claude is ready for input, which a session working on its prompt never is.
  const started = prompt.ok
    ? await run('herdr', ['pane', 'run', pane.pane_id, shell(['claude', ...args])])
    : prompt
  if (started.ok) return { ...started, ok: true, workspace: pane.workspace_id }
  // The claim is released on failure, so a session that came up late must not run unclaimed.
  await closeWorkspace(pane.workspace_id)
  return { ok: false, output: `herdr pane ${prompt.ok ? 'run' : 'wait-output'}: ${started.output}` }
}
export async function closeWorkspace(workspace: string): Promise<Outcome> {
  const closed = await run('herdr', ['workspace', 'close', workspace])
  // A workspace a human closed first is closed all the same.
  return { ...closed, ok: closed.ok || closed.output.includes('workspace_not_found') }
}
export const gh = (args: string[]) => run('gh', args)
