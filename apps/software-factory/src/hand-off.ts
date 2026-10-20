import { HANDED_BACK, type gh as ghCommand, type Launch, type WorkItem } from './session.ts'

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
    const verdict = await readVerdict(work, gh, 'review-pr:summary')
    if (verdict === 'dry') {
      const head = await reviewedHead(work, gh)
      if (head !== 'current') return head ? { to: 'agent:review' } : { wait: UNREAD_HEAD }
      return (await hasQaScenarios(work, gh)) ? { to: 'agent:verify' } : { ready: true }
    }
    if (verdict === 'tasks') return { to: 'agent:fix' }
    if (verdict === 'ended')
      return { wait: 'the review ended, so you decide what happens to what it left open' }
    return { wait: 'this run left no review verdict on the pull request' }
  },
  // A fix after QA goes back through review too, so no fix reaches ready unreviewed.
  'agent:fix': async () => ({ to: 'agent:review' }),
  'agent:verify': async (work, gh) => {
    const verdict = await readVerdict(work, gh, 'verify-pr:report')
    if (verdict === 'pass') {
      const head = await reviewedHead(work, gh, null)
      if (head !== 'current') return head ? { to: 'agent:review' } : { wait: UNREAD_HEAD }
      return { ready: true }
    }
    if (verdict === 'fail') return { to: 'agent:fix' }
    if (verdict === 'ended')
      return { wait: 'QA ended with scenarios still failing, so you decide what happens to them' }
    return { wait: 'this run left no QA verdict on the pull request' }
  },
  'agent:upgrade': async (work, gh) =>
    (await currentHead(work, gh)) === work.head ? { ready: true } : { to: 'agent:review' },
}

const UNREAD_HEAD =
  "the dry review's summary names no commit the factory can read, so it cannot tell whether the head was reviewed"

// A push since the dry review, a fix's or a human's, leaves the head unreviewed.
// A dry summary with no commit to read is undefined, not unreviewed: dry rounds never reach the review cap, so handing it back to review would loop.
// shortcut: reads the commit off the summary's footer, so a reworded footer waits on a human, have /review-pr write a marker if that happens.
async function reviewedHead(work: WorkItem, gh: Gh, since?: string | null) {
  const review = (await readComment(work, gh, 'review-pr:summary', since)) ?? ''
  if (!review.includes('<!-- review-pr:verdict dry -->')) return 'unreviewed'
  const reviewed = /Last reviewed commit: `?([0-9a-f]{7,40})\b/.exec(review)?.[1]
  if (!reviewed) return undefined
  return (await currentHead(work, gh)).startsWith(reviewed) ? 'current' : 'unreviewed'
}

const currentHead = async (work: WorkItem, gh: Gh) =>
  (await read(gh, ['pr', 'view', work.url, '--json', 'headRefOid', '--jq', '.headRefOid'])).trim()

// A run hands its work item on at its clean stop, from what GitHub shows then.
// The release is its own write, so a hand-off GitHub refuses still releases the claim.
export async function handOff({ release, work }: Pick<Launch, 'release' | 'work'>, gh: Gh) {
  const released = await gh(release)
  let step: Step = released.ok
    ? await nextStep(work, gh)
    : { wait: `the factory could not remove its working label: ${released.output.trim()}` }
  if ('to' in step) {
    const handed = step.url
      ? await gh(['pr', 'edit', step.url, '--add-label', step.to])
      : await gh([work.kind, 'edit', work.url, '--add-label', step.to])
    if (handed.ok) return { outcomes: [released], did: `Handed ${step.url ?? 'it'} to ${step.to}` }
    step = { wait: `the factory could not apply ${step.to}: ${handed.output.trim()}` }
  }
  if ('ready' in step) {
    const marked = await gh(['pr', 'ready', work.url])
    step = {
      wait: marked.ok
        ? 'it is marked ready for you to merge'
        : `the factory could not mark it ready: ${marked.output.trim()}`,
    }
  }
  return {
    outcomes: [
      released,
      ...(await tell(work, `the ${work.trigger} run ended and waits on you: ${step.wait}.`, gh)),
    ],
    did: `Waiting on ${work.sender}: ${step.wait}`,
  }
}

// A crash hands nothing on: whoever applied the trigger label retries.
export const tellCrash = (work: WorkItem, why: string, gh: Gh) =>
  tell(
    work,
    `the ${work.trigger} run ${why} before it finished. Apply ${work.trigger} again to retry.`,
    gh,
  )

const FACTORY = '<!-- factory -->'

// One factory comment per work item, edited in place, so a run's crashes and waits never pile up.
// An assignment queues the work item under the human's assigned items: an edit notifies nobody, and a mention from the owner's own login never notified the owner.
// The label sets it apart from their other assignments, in its own edit so a repo still lacking the label keeps the assignment.
export async function tell(work: WorkItem, message: string, gh: Gh) {
  const body = `${FACTORY}\n@${work.sender} ${message}`
  // A comment list GitHub refuses gets a second comment: better than saying nothing.
  const said = await ownComments(work, gh).then(
    (comments) => comments.find((comment) => comment.body.startsWith(FACTORY)),
    () => undefined,
  )
  return [
    await gh([work.kind, 'edit', work.url, '--add-assignee', work.sender]),
    await gh([work.kind, 'edit', work.url, '--add-label', HANDED_BACK]),
    said
      ? await gh([
          'api',
          '-X',
          'PATCH',
          `repos/${work.repo}/issues/comments/${said.id}`,
          '-f',
          `body=${body}`,
        ])
      : await gh([work.kind, 'comment', work.url, '--body', body]),
  ]
}

// Static code reads only what the factory's own login wrote: an HTML comment does not render, so anyone could plant one.
async function ownComments(work: WorkItem, gh: Gh) {
  const me = (await read(gh, ['api', 'user', '--jq', '.login'])).trim()
  const comments = await read(gh, [
    'api',
    `repos/${work.repo}/issues/${work.number}/comments`,
    '--paginate',
    '--jq',
    '.[] | {id, login: .user.login, updated_at, body} | tojson',
  ])
  return comments
    .split('\n')
    .filter(Boolean)
    .map((line): { id: number; login: string; updated_at: string; body: string } =>
      JSON.parse(line),
    )
    .filter(({ login }) => login === me)
}

// A dry review's body was just rewritten by /create-pr, so a QA scenario left in it is one the Verifier can run.
async function hasQaScenarios(work: WorkItem, gh: Gh) {
  const body = await read(gh, ['pr', 'view', work.url, '--json', 'body', '--jq', '.body'])
  const section = body.split(/^## QA steps[ \t]*$/m)[1]?.split(/^## /m)[0] ?? ''
  return /^- \[[ xX]\] /m.test(section)
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

// A skill's comment counts only when edited since `since`, this run's claim unless null: an older one belongs to an earlier round.
// `marker` opens the comment, `<skill>:<name>`.
// shortcut: compares this machine's clock with GitHub's, so a clock seconds off misreads a run that ends within seconds of its claim, compare the reviewed head instead if that happens.
async function readComment(
  work: WorkItem,
  gh: Gh,
  marker: string,
  since: string | null = work.claimedAt,
) {
  const comment = (await ownComments(work, gh)).find(({ body }) =>
    body.startsWith(`<!-- ${marker} -->`),
  )
  if (!comment || (since && Date.parse(comment.updated_at) < Date.parse(since))) return undefined
  return comment.body
}

// The skill's verdict line follows its marker in this run's comment.
async function readVerdict(work: WorkItem, gh: Gh, marker: string) {
  const skill = marker.split(':')[0]
  const body = await readComment(work, gh, marker)
  return body && new RegExp(`<!-- ${skill}:verdict (\\w+) -->`).exec(body)?.[1]
}

async function read(gh: Gh, args: string[]) {
  const { ok, stdout, output } = await gh(args)
  if (!ok) throw new Error(`gh ${args.slice(0, 2).join(' ')} failed: ${output.trim()}`)
  return stdout
}
