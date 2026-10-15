import type { gh as ghCommand, Launch, WorkItem } from './session.ts'

type Gh = typeof ghCommand
// The next agent's trigger label, on another work item when `url` says so, or a human step.
type Step = { to: string; url?: string } | { ready: true } | { wait: string }

const NEXT_STEPS: Record<string, (work: WorkItem, gh: Gh) => Promise<Step>> = {
  'agent:implement': async (work, gh) => {
    const pulls: { url: string; isDraft: boolean; isCrossRepository: boolean }[] = JSON.parse(
      await read(gh, [
        'pr',
        'list',
        '-R',
        work.repo,
        '--head',
        `spec/${work.number}`,
        '--state',
        'open',
        '--json',
        'url,isDraft,isCrossRepository',
      ]),
    )
    const draft = pulls.find((pull) => pull.isDraft && !pull.isCrossRepository)
    return draft
      ? { to: 'agent:review', url: draft.url }
      : { wait: `no open draft pull request from spec/${work.number}` }
  },
  'agent:review': async (work, gh) => {
    const verdict = await readVerdict(work, gh)
    if (verdict === 'dry') return { ready: true }
    if (verdict === 'tasks') return { to: 'agent:fix' }
    if (verdict === 'ended')
      return { wait: 'the review ended, so you decide what happens to what it left open' }
    return { wait: 'this run left no review verdict on the pull request' }
  },
  'agent:fix': async () => ({ to: 'agent:review' }),
  'agent:upgrade': async (work, gh) => {
    const head = await read(gh, [
      'pr',
      'view',
      work.url,
      '--json',
      'headRefOid',
      '--jq',
      '.headRefOid',
    ])
    return head.trim() === work.head ? { ready: true } : { to: 'agent:review' }
  },
}

// A run hands its work item on at its clean stop, from what GitHub shows then.
// The release is its own write, so a hand-off GitHub refuses still releases the claim.
export async function handOff({ release, work }: Pick<Launch, 'release' | 'work'>, gh: Gh) {
  const released = await gh(release)
  let step = await nextStep(work, gh)
  if ('to' in step) {
    const handed = step.url
      ? await gh(['pr', 'edit', step.url, '--add-label', step.to])
      : await gh([work.kind, 'edit', work.url, '--add-label', step.to])
    if (handed.ok) return { outcomes: [released], did: `Handed ${step.url ?? 'it'} to ${step.to}` }
    step = { wait: `the factory could not apply ${step.to}: ${handed.output.trim()}` }
  }
  if ('ready' in step) {
    const marked = await gh(['pr', 'ready', work.url])
    if (marked.ok) return { outcomes: [released], did: 'Marked ready' }
    step = { wait: `the factory could not mark it ready: ${marked.output.trim()}` }
  }
  // An assignment queues the work item under the human's assigned items; a mention from the owner's own login never notifies the owner.
  return {
    outcomes: [
      released,
      await gh([work.kind, 'edit', work.url, '--add-assignee', work.sender]),
      await gh([
        work.kind,
        'comment',
        work.url,
        '--body',
        `@${work.sender} the ${work.trigger} run ended and waits on you: ${step.wait}.`,
      ]),
    ],
    did: `Waiting on ${work.sender}: ${step.wait}`,
  }
}

async function nextStep(work: WorkItem, gh: Gh): Promise<Step> {
  const next = NEXT_STEPS[work.trigger]
  if (!next) return { wait: `the factory knows no next step after ${work.trigger}` }
  try {
    return await next(work, gh)
  } catch (error) {
    return { wait: (error as Error).message }
  }
}

// A verdict counts only from a summary this run edited: an older one belongs to an earlier round.
// shortcut: compares this machine's clock with GitHub's, so a clock seconds off misreads a review that ends within seconds of its claim, compare the reviewed head instead if that happens.
async function readVerdict(work: WorkItem, gh: Gh) {
  const comments = await read(gh, [
    'api',
    `repos/${work.repo}/issues/${work.number}/comments`,
    '--paginate',
    '--jq',
    '.[] | {updated_at, body} | tojson',
  ])
  const summary = comments
    .split('\n')
    .filter(Boolean)
    .map((line): { updated_at: string; body: string } => JSON.parse(line))
    .find(({ body }) => body.includes('<!-- review-pr:summary -->'))
  if (!summary || Date.parse(summary.updated_at) < Date.parse(work.claimedAt)) return undefined
  return /<!-- review-pr:verdict (\w+) -->/.exec(summary.body)?.[1]
}

async function read(gh: Gh, args: string[]) {
  const { ok, stdout, output } = await gh(args)
  if (!ok) throw new Error(`gh ${args.slice(0, 2).join(' ')} failed: ${output.trim()}`)
  return stdout
}
