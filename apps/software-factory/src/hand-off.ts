import { UNTOUCHED, type gh as ghCommand, type Launch, type WorkItem } from './session.ts'

type Gh = typeof ghCommand
// The next agent's trigger label, on another work item when `url` says so, or a human step.
// `merge` marks it ready and hands the merge to GitHub's auto-merge.
type Step = { to: string; url?: string } | { ready: true } | { merge: true } | { wait: string }

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
    const summary = await readOwnComment(work, gh, '<!-- review-pr:summary -->')
    const verdict = /<!-- review-pr:verdict (\w+) -->/.exec(summary)?.[1]
    if (verdict === 'dry')
      return /^## .*Review: 10\/10/m.test(summary) && !(await awaitsOwnerStep(work, gh))
        ? { merge: true }
        : { ready: true }
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
    if (head.trim() !== work.head) return { to: 'agent:review' }
    // A blocked Upgrader pushes nothing either, so only its word that nothing needed to change merges.
    return (await readOwnComment(work, gh, UNTOUCHED)) ? { merge: true } : { ready: true }
  },
}

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
  if ('ready' in step || 'merge' in step) {
    const marked = await gh(['pr', 'ready', work.url])
    if (!marked.ok) step = { wait: `the factory could not mark it ready: ${marked.output.trim()}` }
    else if ('ready' in step) return { outcomes: [released], did: 'Marked ready' }
  }
  if ('merge' in step) {
    const merging = await mergeOnceChecksPass(work, gh)
    if (merging.ok) return { outcomes: [released], did: 'Set to merge once checks pass' }
    step = { wait: `the factory did not set it to merge: ${merging.output.trim()}` }
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

// GitHub's auto-merge waits only on required checks: with none, it merges at once, failing checks included.
async function mergeOnceChecksPass(work: WorkItem, gh: Gh) {
  if (!work.head) return { ok: false, output: 'the factory recorded no head to pin the merge to' }
  try {
    const base = (
      await read(gh, ['pr', 'view', work.url, '--json', 'baseRefName', '--jq', '.baseRefName'])
    ).trim()
    const rules = await read(gh, [
      'api',
      `repos/${work.repo}/rules/branches/${base}`,
      '--jq',
      '.[].type',
    ])
    if (!rules.split('\n').includes('required_status_checks'))
      return { ok: false, output: `no ruleset on ${base} requires status checks` }
  } catch (error) {
    return { ok: false, output: (error as Error).message }
  }
  // The head this run started from is the one reviewed or left untouched: a later push must not merge with it.
  return gh(['pr', 'merge', work.url, '--auto', '--squash', '--match-head-commit', work.head])
}

// An Owner step blocks merge until a human ticks it in the spec the pull request closes.
async function awaitsOwnerStep(work: WorkItem, gh: Gh) {
  const specs = await read(gh, [
    'api',
    'graphql',
    '-f',
    'query=query($url: URI!) { resource(url: $url) { ... on PullRequest { closingIssuesReferences(first: 50) { nodes { body } } } } }',
    '-f',
    `url=${work.url}`,
    '--jq',
    '.data.resource.closingIssuesReferences.nodes[].body',
  ])
  return /^- \[ \] Before merge:/m.test(specs)
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

// The body of the comment opening with `marker` that this run wrote or edited: an older one belongs to an earlier run.
// It counts only from the factory's own login too: an HTML comment does not render, so anyone could plant one.
// shortcut: compares this machine's clock with GitHub's, so a clock seconds off misreads a run that ends within seconds of its claim, compare the reviewed head instead if that happens.
async function readOwnComment(work: WorkItem, gh: Gh, marker: string) {
  const me = (await read(gh, ['api', 'user', '--jq', '.login'])).trim()
  const comments = await read(gh, [
    'api',
    `repos/${work.repo}/issues/${work.number}/comments`,
    '--paginate',
    '--jq',
    '.[] | {login: .user.login, updated_at, body} | tojson',
  ])
  const comment = comments
    .split('\n')
    .filter(Boolean)
    .map((line): { login: string; updated_at: string; body: string } => JSON.parse(line))
    .find(
      ({ login, updated_at, body }) =>
        login === me &&
        body.startsWith(marker) &&
        Date.parse(updated_at) >= Date.parse(work.claimedAt),
    )
  return comment?.body ?? ''
}

async function read(gh: Gh, args: string[]) {
  const { ok, stdout, output } = await gh(args)
  if (!ok) throw new Error(`gh ${args.slice(0, 2).join(' ')} failed: ${output.trim()}`)
  return stdout
}
