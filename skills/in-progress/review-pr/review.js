export const meta = {
  name: 'review-pr',
  description: 'Raise candidates per dimension, prove or kill each serious one, judge the survivors',
  phases: [
    { title: 'Raise', detail: 'one agent per dimension lists candidates' },
    { title: 'Prove', detail: 'one investigator per blocker or major candidate' },
    { title: 'Judge', detail: 'one judge when two or more findings are confirmed' },
  ],
}

// args: { repo, scratch, spec, files, dimensions: [{ key, name, covers, kind, addon?, budget? }],
//         prior?, mode?: 'fix-verify', tasks?, fixRange?, report?, raised?: [candidate] }
const a = args
const str = { type: 'string' }
const list = items => ({ type: 'array', items })
const SEVERITY = { type: 'string', enum: ['blocker', 'major', 'minor'] }
const CANDIDATE = {
  type: 'object',
  properties: {
    title: str, severity: SEVERITY, file: str, line: { type: 'integer' }, anchor: str,
    problem: str, failure: str, confirm_by: str, kill_by: str, sites: str, fix: str,
  },
  required: ['title', 'severity', 'file', 'line', 'anchor', 'problem', 'failure'],
}
const UNCHECKED = {
  type: 'object',
  properties: { surface: str, why: str, serious: { type: 'boolean' } },
  required: ['surface', 'why', 'serious'],
}
const RAISED = {
  type: 'object',
  properties: { verdict: str, candidates: list(CANDIDATE), covered: list(str), not_exercised: list(UNCHECKED) },
  required: ['verdict', 'candidates', 'covered', 'not_exercised'],
}
const PROVED = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['confirmed', 'killed', 'uncertain'] },
    why: str, severity: SEVERITY, sites: str, problem: str, failure: str, fix: str, check: str,
  },
  required: ['verdict', 'why'],
}
const JUDGED = {
  type: 'object',
  properties: {
    scores: list({
      type: 'object',
      properties: { id: str, score: { type: 'integer' }, why: str, merged_with: list(str), conflicts_with: str },
      required: ['id', 'score', 'why'],
    }),
  },
  required: ['scores'],
}
const FIXED = {
  type: 'object',
  properties: {
    tasks: list({
      type: 'object',
      properties: { id: str, status: { type: 'string', enum: ['correct', 'broken', 'open'] }, why: str },
      required: ['id', 'status', 'why'],
    }),
    candidates: list(CANDIDATE),
  },
  required: ['tasks', 'candidates'],
}

const BUDGET = { lens: 40, specialist: 60 }
// Every agent runs the session's model at high effort; no call names a smaller model. A specialist
// on Sonnet at medium returned in under a minute and missed every minor its dimension found at high.
const STRONG = { effort: 'high' }

// The harness shows every agent the request that started the run and ranks it above the brief.
// Without this an agent reads the carrier's instructions as its own and reruns the review.
const PART = `<your-part>
  A review is already running. The request above started it, and its carrier runs it. You are
  one agent inside it. Everything that request asks for beyond the task below — probing, running
  the workflow, writing the task list, posting anywhere — is the carrier's. Your part is the task
  below, and your structured result is all you hand back.
</your-part>`

const CONSTRAINTS = `<constraints>
  Read-only in the repo: change no file under ${a.repo}, and run no git commit, push, checkout,
  reset, merge or stash. The working tree can hold uncommitted work; a stray write destroys it.
  Experiment only in your own sandbox, ${a.scratch}/sandbox-<your label>, built by the probe's
  recipe. Agents run beside you: a shared sandbox is rebuilt underneath you mid-command and your
  write lands in the repo instead. Check your working directory before every write.

  Read whatever you need to judge the range. A candidate, though, names a line the range changed —
  a file outside it is context you read to reach that judgement, not a thing to report on. The
  most common wrong finding a diff-scoped reviewer makes is a question about an entity that was
  already there.
</constraints>

<context>
  Directory: ${a.repo} — stay inside it.
  Probe: ${a.scratch}/probe.md — read it first. Its facts are derived; do not re-derive them.
  The baseline is the one run of the repo's check scripts. It lands in the probe while you work:
  read it there when a candidate turns on a check, and run a single test only when one turns on it.
  Range: ${a.scratch}/range.diff, plus the untracked files the probe lists.
  Spec: ${a.spec}
  Read CONTRIBUTING.md, then invoke /project-context, emit its triage line, and Read the domain
  files its table says this range needs.
  Prior rounds: ${a.prior || 'None — first round.'} A rule a prior round cites may have moved
  since: re-check each claim against the context on disk now.
</context>`

const NOTHING = `<no-findings>
  Raising nothing is a complete review and a good result: an empty candidates list is the
  correct output for a clean dimension, and returning it costs you nothing.
  Raise a concern only when you would raise it to the author yourself. Formatting and naming
  that the repo's own tooling leaves alone are somebody's taste — leave them alone too. Never
  reach for a candidate to fill the list.
</no-findings>`

const CLOSING = budget => `covered: every file of the range you read for your dimension, spelled as the probe spells it.
     not_exercised: every surface you could not check, and why; serious is true when a blocker or
     a major could hide there.
  Budget: ${budget} tool calls. At the budget, return what you hold and name the rest under
  not_exercised.`

const LENS = d => `<your-job>
  You raise candidates. A separate investigator proves or kills each blocker and major, so spend
  your budget reading the range closely and leave harnesses and reproductions to it.
  1. List the changed units of your dimension first, then work the list. A range read straight
     through is sampled; a list is closed.
  2. Raise a candidate wherever you can name the input or state that breaks the code and say
     what the code then does. Challenge your own assumption about what the code does before you
     challenge the code. Taste with no cost, and trade-offs the spec names, are not candidates.
  3. Copy the offending line out of the file, verbatim, into anchor. The investigator greps for
     that exact text first, so a line retyped from memory dies there.
  4. confirm_by and kill_by: the one observation that proves the candidate, and the one that
     kills it. The investigator starts from them.
  5. severity is what the candidate earns if it is true: correctness and security earn a
     blocker, style and idiom earn a minor at most.
  6. ${CLOSING(d.budget || BUDGET.lens)}
</your-job>`

const SPECIALIST = d => `<your-job>
  1. Past about 100 changed lines in your file set, list what you will check first and then
     work the list. A dimension read straight through samples its range; a list closes it.
  2. Report the class, not the instance — and prove the class is closed. For each candidate, run
     one command that finds every site of its shape, and put the command and its matching output
     in sites. Every hit goes in the fix or is excused there by name.
  3. Copy the offending line out of the file, verbatim, into anchor. A line retyped from memory
     dies at the grep that follows you.
  4. Refute each candidate — open the file and make it fail. Cannot? Drop it. Challenge your own
     assumption about what the code does before you challenge the code. Taste with no cost, and
     trade-offs the spec names, are not candidates.
  5. Open every file the fix touches, plus the callers and the docs it cites, before you write
     the fix. Prefer a fix that deletes.
  6. severity: correctness and security earn a blocker, style and idiom earn a minor at most.
  7. ${CLOSING(d.budget || BUDGET.specialist)}
</your-job>`

const raisePrompt = d => `${PART}

<role>
  ${d.name} reviewer. You wrote none of this code. You own one dimension: ${d.covers}.
  Go deep, not wide — another agent covers each of the other dimensions.
</role>

${CONSTRAINTS}

${d.kind === 'specialist' ? SPECIALIST(d) : LENS(d)}
${d.addon ? `
<dimension-rules>
  ${d.addon}
</dimension-rules>
` : ''}
${NOTHING}`

const provePrompt = c => `${PART}

<role>
  Investigator. You did not raise this candidate. Settle it: prove it or kill it.
</role>

${CONSTRAINTS}

<candidate>
${JSON.stringify(c, null, 2)}
</candidate>

<your-job>
  1. grep -nF the anchor against the file it names. A miss, with no changed line the problem
     describes, is killed: say "anchor not found" in why.
  2. Challenge the candidate's assumption about what the code does before you challenge the
     code. Open the file, its callers and the docs it cites.
  3. Settle it by the cheapest means that settles it: read and trace first, then a one-file
     script in your sandbox, then a browser when only a page shows the failure. Start from
     confirm_by and kill_by.
  4. confirmed: you showed the failure. The state it names is constructed and the outcome
     observed, or a trace of file:line steps leads from the input to the wrong outcome.
  5. killed: you hold a concrete refutation — the line, the command output, or the run that
     contradicts the failure. Killed as well: the range chose this on purpose, and the spec, an
     ADR or a fence in the file's own comments says so; a question about an entity outside the
     range; a naming, comment or formatting preference the repo's own tooling does not enforce.
  6. uncertain: neither, at the budget. Say in why what is left unproven. Doubt never kills: a
     verifier that drops what it cannot confirm drops real defects.
  7. For confirmed and uncertain, finish the finding.
     sites: one command that finds every site of its shape, and its matching output. Every hit
     is in the fix or excused there by name — report the class, not the instance.
     fix: specific enough to need no further investigation. Open every file it touches first.
     Prefer a fix that deletes.
     check: how the implementer tells the fix worked.
     severity: what it earns now that you know. problem and failure: corrected where the
     candidate had them wrong.
  Budget: 40 tool calls.
</your-job>`

const judgePrompt = findings => `${PART}

<role>
  Judge. You see every confirmed finding together. You judge the evidence the investigators
  returned: open a file to check a fence, and leave reproduction to them. Read-only.
</role>

<findings>
${JSON.stringify(findings, null, 2)}
</findings>

<your-job>
  Repo: ${a.repo}. Probe: ${a.scratch}/probe.md. Spec: ${a.spec}.
  1. Score each 0-10 for whether a maintainer would act on it, with a one-line reason.
  2. Score 0 when the finding is: a naming, comment, or formatting preference the repo's own
     tooling does not enforce; a restatement of something the range deliberately chose; or a
     question about an entity defined outside the range. A deliberate choice states itself
     wherever the author had room: the spec, an ADR, or a fence in the file's own comments. Open
     the file before you score. A finding that argues with a fence is a proposal for the human,
     not a defect for the implementer.
  3. Where two findings touch one site, say so in conflicts_with and name which wins.
  4. Where the same defect appears under two ids, list them in merged_with. A merged finding
     keeps the worst severity.
</your-job>`

const fixVerifyPrompt = () => `${PART}

<role>
  Fix verifier. You wrote none of this and you are not reviewing the pull request.
  You review ONE diff: the changes made for the last task list.
</role>

${CONSTRAINTS}

<your-job>
  The task list and the findings behind it: ${a.tasks}. The fix diff: ${a.fixRange}.
  The implementer's report, if one exists: ${a.report || 'none'}.
  1. For each task, open the file and confirm it does what the finding asked, at EVERY site the
     finding names. For a task reported blocked, confirm the file really holds what the
     implementer says it holds — a blocked task is a claim too. A task with no report is open
     until the file shows otherwise.
  2. Find every edit in the diff that no task asked for. Nobody has reviewed the reason for
     them; review them as new code.
  3. Review the diff's new code and new prose as if it arrived in a pull request. Run the
     commands the new prose tells a reader to run.
  4. Check the fixes against each other. Two fixes on one file can disagree.
  5. Read the checks in the probe before you return: the carrier re-ran them in the repository
     after the fixes. A check that fails is a candidate.
  A new defect is a candidate: anchor copied verbatim from the file, the input or state that
  breaks it in failure, severity as it would be if true.
</your-job>

${NOTHING}`

const out = { confirmed: [], uncertain: [], killed: [], deferred: [], accepted_risk: [], not_reviewed: [] }
const covered = new Set()

async function prove(c) {
  const p = await agent(provePrompt(c), { label: `prove:${c.id}`, phase: 'Prove', schema: PROVED, ...STRONG })
  if (!p) {
    out.not_reviewed.push(`prove:${c.id}`)
    out.uncertain.push({ ...c, verdict: 'uncertain', why: 'its investigator died; nothing is proved' })
    return
  }
  const f = { ...c, ...p }
  if (p.verdict === 'killed') out.killed.push({ id: c.id, title: c.title, file: c.file, line: c.line, why: p.why })
  else if (f.severity === 'minor' && !c.raised_by_human) out.deferred.push({ ...f, verified: p.verdict === 'confirmed' })
  else out[p.verdict].push(f)
}

// Resolves true once a raiser's result is dealt with; a dead raiser resolves false.
async function settle(raised, d) {
  if (!raised) return false
  ;(raised.covered || []).forEach(f => covered.add(f))
  // No agent chases these. Twice a follow-up reviewer was the last thing a round waited for,
  // 20 and 31 minutes, and returned one minor each time. The human reads them and decides.
  raised.not_exercised.forEach(n => out.accepted_risk.push({ ...n, from: d.name }))
  // Every candidate keeps its own id and nothing is folded by anchor: a version bump is the one
  // changed line for everything it breaks, so two candidates on a line can be two defects.
  const jobs = []
  raised.candidates.forEach((c, i) => {
    const cand = { ...c, id: `${d.key}${i + 1}`, raised_by: d.name }
    if (c.severity === 'minor') out.deferred.push(cand)
    else jobs.push(() => prove(cand))
  })
  await parallel(jobs)
  return true
}

if (a.mode === 'fix-verify') {
  const fv = await agent(fixVerifyPrompt(), { label: 'fix-verify', phase: 'Raise', schema: FIXED, ...STRONG })
  if (fv) out.tasks = fv.tasks
  else out.not_reviewed.push('fix-verify')
  await parallel([
    () => settle(fv && { candidates: fv.candidates, not_exercised: [] }, { key: 'fv', name: 'Fix-verify' }),
    // A minor the human raised is proved before it becomes a task.
    ...(a.raised || []).map(c => () => prove({ ...c, raised_by_human: true })),
  ])
} else {
  const done = await pipeline(
    a.dimensions,
    d => agent(raisePrompt(d), { label: `raise:${d.key}`, phase: 'Raise', schema: RAISED, ...STRONG }),
    (raised, d) => settle(raised, d),
  )
  a.dimensions.forEach((d, i) => done[i] || out.not_reviewed.push(`raise:${d.key}`))
  out.uncovered_files = (a.files || []).filter(f => !covered.has(f))
}

if (out.confirmed.length > 1) {
  const judged = await agent(judgePrompt(out.confirmed), { label: 'judge', phase: 'Judge', schema: JUDGED, ...STRONG })
  if (judged) out.judged = judged.scores
  else out.not_reviewed.push('judge')
}

return out
