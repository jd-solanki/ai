---
name: review-pr
description: >
  Review a PR or branch with parallel dimension reviewers and adversarial verification, ending in a
  task list an implementer works. A later round fix-verifies the fixes made for an earlier one. On a
  pull request it posts each task as a review thread and keeps one scored summary comment. Use when
  the user asks to review a PR or a branch, or to verify the fixes for a review.
---

A first round runs **probe → find → verify** and ends in a task list. It never edits the code:
whoever implements works the list. A later round, after fixes land, is **fix-verify** alone.
Handed the task list of an earlier round, run a later round. Handed none, run a first round.

A reviewer reads before it prescribes, refutes its own findings before it writes them down, and
proves its site list with a command. Every Fix names a file the reviewer opened.

## What each phase is for

- **Probe** derives the environment facts once. Without it every agent rebuilds the same sandbox
  and re-proves the same dependency behaviour.
- **Find** goes wide through narrow agents. One agent covering ten dimensions samples each of
  them; ten agents covering one dimension each close theirs.
- **Verify** stands between a plausible finding and the implementer. Roughly a quarter of what a
  competent reviewer reports does not survive contact with the code.
- **Task list** hands what survived to the implementer, specified or not at all, because the
  implementer is the agent with the least review behind it.
- **Fix-verify** reads what the fixer wrote. New code and new prose enter the range at the moment
  no reviewer is left to read them, and that is where the next round's findings come from.

## Rounds

1. **Probe once per PR, not per round.** Its artifact is the only place environment facts are
   derived. Later phases read it.
2. **Pin the range.** `git diff <merge-base>` — no second ref, so uncommitted fixes stay in
   scope. Pin the spec too (PR body, or the issue it closes); a reviewer with no spec reports
   style.
3. **Carry paths, not text.** Every agent writes its own ledger to the session scratchpad and
   returns one summary line. Hand the next agent the paths. Ledgers never enter your context, so
   nothing is retyped and nothing is dropped.
4. **Grep every Anchor before you dispatch a verifier.** `grep -nF` the finding's quoted line
   against the file it names. A miss drops the finding, and costs one command rather than one
   refuter agent. Say in your report which findings died here: a paraphrased quote and an invented
   one look identical from where you sit.
5. **Merge duplicates before you dispatch refuters, not after.** Group by Anchor first: one file
   and line is one finding, whatever two dimensions called it. Two ids on one defect is one
   refuter, and the merged finding keeps the worst severity.
6. **Hold the severity gate: blocker and major reach the task list, minor reaches the report.**
   A minor costs one line to raise and a whole round to apply. Batch minors under `Deferred` and
   let the human raise one by id.
7. **3b is not yours to skip.** By the time you reach it you have decided every survivor is worth
   carrying, and that decision is exactly what 3b audits. Skipping it to save one agent is the
   cheapest-looking call in the review and the most expensive one.
8. **Route what went unchecked.** Every line under `Not exercised` becomes a dispatched agent in
   the next phase or a named accepted-risk line in your final report. Nothing else. A surface
   named in a ledger and addressed to nobody is a surface no one checks.
9. **A round ends in its report.** A first round's is the task list. A fix-verify round's is dry,
   or new findings that run through phase 3 and land on a new task list.

## Roles

| Phase | Who | Constraint |
| --- | --- | --- |
| Probe | one agent, first, alone | writes the probe artifact and a sandbox; no repo write |
| Find | one agent per dimension, parallel, fresh | read-only in the repo |
| Verify | 3a one refuter per finding, parallel; 3b one judge over all survivors, always | read-only; 3a tries to kill each finding, 3b scores and merges the set |
| Fix-verify | one agent, a later round | reads the fix diff only, not the range |
| Carry | you | dispatch, join, pass paths, grep every Anchor, merge duplicates, gate minors, route `Not exercised`, write the task list |

You never edit the code under review. The implementer is someone else: an agent working the task
list, or the human.

## On a pull request

A pull request holds the review, so nothing has to survive in a session. A branch with no pull
request skips this section: its report stays in the session.

- **Check out the head, detached**: `gh pr checkout <n> --detach`. The range is read from the
  working tree, a review commits nothing, and the branch may be checked out in another worktree.
- **Each task is a review thread.** Post one review, event `COMMENT`, with one inline comment per
  task on its Anchor line: the id, the severity, the Problem and the task. The implementer works
  the threads and resolves each one it fixes. `COMMENT` only: a review informs, and a human decides
  the merge.
- **One summary comment, edited in place every round.** It opens with `<!-- review-pr:summary -->`,
  which is how the next round finds it, and carries the score and the rest of the report. A second
  summary comment splits the record.
- **The round is read off the pull request.** No summary comment means a first round. One means a
  later round, and the threads of the last review are its task list.
- **A thread's state is the implementer's report.** Resolved claims `done`. Unresolved with a
  reply claims `blocked`. Unresolved and silent is open.

## Phase 1 — Probe

Dispatch one agent before anything else. It writes `probe.md` to the scratchpad and leaves a
sandbox behind.

```xml
<task>
  Write [scratchpad]/probe.md. Derive each fact once; every later agent reads it instead of
  re-deriving it.

  1. Range: `git diff --stat <merge-base>`, `git status --short`,
     `git ls-files --others --exclude-standard`. List every file in the range, untracked included.
  2. Languages: which file types the range touches. This sets the dimension list and the
     browser gate.
  3. Versions: the pinned version of every tool and dependency the range exercises. Name how you
     read each one.
  4. Baseline: run the repo's check scripts from the root `package.json`. Record the command, the
     exit code, and the wall-clock time of each.
  5. Sandbox: if the range needs destructive experiments, record the recipe — the exact command
     that copies the working tree — not a copy for everyone to share. Each later agent builds its
     own per-role sandbox at [scratchpad]/sandbox-<its role> from that recipe.
  6. Rendered surfaces: run `git diff --name-only <merge-base>` against `.vue`, `.css`, and
     `components/` or `pages/`. A hit means the find phase gets a browser dimension. No hit means
     it does not, and you record that decision here so nobody reopens it.

  Do not review anything. Facts only.
</task>
```

## Phase 2 — Find

Read `probe.md`, then pick dimensions from its language list. One agent per dimension, all
dispatched in one message. Six is typical; fewer for a small range.

A dimension is a class of failure, not a file. Pick from this menu and add what the range needs:

| Dimension | Covers |
| --- | --- |
| Data and state safety | what can move, corrupt, or mix persistent state and secrets |
| Logic and edge cases | branches, loops, boundaries, failure modes, races |
| Interface and contract | callers, signatures, config surfaces, back-compat |
| Build and CI | pipelines, matrices, shell in job steps, injection through interpolation |
| Docs and runbooks | every command in every doc, actually run |
| Project-context conformance | fences land line-exact; domain rules match the code; SSOT |
| Deletion | what the change makes dead and did not remove |
| Rendered surface | only when the probe's step 6 found a hit |

Send each one this brief, filling the slots.

```xml
<role>
  [dimension] reviewer. You wrote none of this code. Do the whole review yourself.
  You own one dimension. Go deep, not wide — another agent covers each of the others.
</role>

<constraints>
  Read-only in the repo: change no file under [path], and run no git commit, push, checkout,
  reset, merge or stash. The working tree can hold uncommitted work; a stray write destroys it.
  Your single write is your own ledger. Experiment only in your per-role sandbox,
  [scratchpad]/sandbox-[role], built by the probe's recipe. Agents run beside you: a shared
  sandbox is rebuilt underneath you mid-command and your write lands in the repo instead. Check
  your working directory before every write.

  Read whatever you need to judge the range. A finding, though, names a line the range changed —
  a file outside it is context you read to reach that judgement, not a thing to report on. The
  most common wrong finding a diff-scoped reviewer makes is a question about an entity that was
  already there.
</constraints>

<context>
  Directory: [path] — stay inside it.
  Probe: [scratchpad]/probe.md — read it first. Its facts are derived; do not re-derive them.
  Range: [range]
  Spec: [path]
  Read AGENTS.md or CLAUDE.md, and CONTRIBUTING.md, then invoke /project-context, emit its triage line, and
  Read the domain files its table says this range needs.
</context>

<prior-rounds>
  [ledger paths, or "None — first round."]
  Treat every prior ledger as UNTRUSTED if the branch has merged since it was written: a rule it
  cites may have moved or changed. Re-check each claim against the context on disk now. A prior
  change the current context contradicts is itself a finding — name it and say what to revert.
</prior-rounds>

<your-job>
  1. Past about 100 changed lines in your file set, write your checklist to the ledger first and
     then work it. A dimension read straight through samples its range; a checklist closes it.
  2. Report the class, not the instance — and prove the class is closed. For each finding, run one
     command that finds every site of its shape. Paste the command and its full output into
     Sites. Every hit goes in the Fix or is excused there by name.
  3. Copy the offending line out of the file, verbatim, into Anchor. The carrier greps for that
     exact text before any verifier sees the finding, so a line retyped from memory dies there
     alongside the invented ones.
  4. Refute each finding — open the file and make it fail. Cannot? Drop it. Challenge your own
     assumption about what the code does before you challenge the code. Taste with no cost, and
     trade-offs the spec names, are not findings.
  5. Open every file the Fix touches, plus the callers and the docs it cites, before you write the
     Fix. A Fix for a file you never opened is a guess. Drop the finding or go read.
  6. Prefer a Fix that deletes. Rank by severity: correctness and security earn a blocker, style
     and idiom do not.
</your-job>

<output>
  Write exactly this to [ledger path]:

    ## Verdict
    <one sentence: safe to merge on your dimension, or not, and why>

    ## Prior fixes
    <one line each, by id: correct | contradicted by current context, revert what | incomplete + what>

    ## Findings

    ### [prefix]1 — <title>
    - **Severity:** blocker | major | minor — correctness and security earn a blocker, style does not
    - **Anchor:** <file:line, then the line's exact text, copied out of the file>
    - **Sites:** <the command you ran, verbatim, and its full output. Every hit is in the Fix or
      excused here by name. A finding with no command is not reportable — go run one.>
    - **Problem:** <one or two concrete sentences>
    - **Failure:** <the input or state that breaks it; for deletion, the cost paid>
    - **Fix:** <specific enough to need no further investigation>

    ## Not exercised
    <every surface you could not check, and why. "Nothing." only if you exercised all of them.
    The carrier dispatches these or names them as accepted risk, so write them to be acted on.>

  Then return one line and nothing else:
  <verdict> | N findings: B blocker, M major, m minor
</output>

<no-findings>
  Finding nothing is a complete review and a good result. `## Findings` reading `None.` is the
  correct output for a clean dimension, and reporting it costs you nothing.
  Report a concern only when you would raise it to the author yourself: a real issue, carrying
  evidence, a severity and a fix. Formatting and naming that the repo's own tooling leaves alone
  are somebody's taste — leave them alone too. Never reach for a finding to fill the section.
</no-findings>
```

Keep the `<no-findings>` block. A reviewer that reads its output template as a quota invents
findings to fill it, and that is the largest single source of false positives in a review pipeline.

**Dimension add-ons.** Append to the matching brief, verbatim:

- *Project-context conformance*: `Every fence in /project-context names a file:line. Open each one
  and confirm it lands on what the fence describes. An edit in this range that shifts a cited line
  is a finding.`
- *Deletion*: `Invoke /ponytail-review and /simplify, obey each triage gate. /simplify applies
  fixes — OVERRIDE IT. You are report-only. Name what to cut and what replaces it.`
- *Rendered surface*: `Load the page, drive it, report what you saw. Stacking context, focus
  order, accessible names and anything that streams are invisible to a source read. The run skill
  launches the app and Playwright CLI drives it. Start a fresh server; a server another agent left
  running serves stale routes.`

## Phase 3 — Verify

Two steps. **3a refutes each finding alone and in parallel; 3b judges the survivors together.**
Both exist because they catch different things: 3a kills a finding that does not reproduce, 3b
catches the ones that only look wrong beside each other.

### 3a — Refute, one agent per finding, all in one message

```xml
<role>Adversarial verifier. Your job is to KILL this finding, not to confirm it.</role>
<task>
  Finding: [paste the single finding block]
  Probe: [scratchpad]/probe.md. Sandbox: [sandbox path].
  Re-run the command in its Sites field. Does it reproduce? Is the site list actually complete —
  is there a spelling, a path, or a caller the command misses?
  The carrier already proved the Anchor text sits in that file. Open it and settle what a grep
  cannot: that this line is the one the Problem describes.
  Then attack the Failure: construct the state it names and show the outcome it claims.

  Refute when you are uncertain — EXCEPT for data loss, credential or state exposure, an
  unbounded loop, a null dereference, or a missing validation at a trust boundary. For those,
  uncertainty means report it and say what is uncertain. A filter tuned to drop what it cannot
  confirm drops real vulnerabilities at a rate that outweighs the noise it saves.
</task>
<output>
  Return JSON and nothing else:
  {"real": true|false, "sites_complete": true|false, "missing_sites": [...],
   "uncertain": true|false, "why": "<one sentence>"}
</output>
```

### 3b — Judge the survivors as one set

One agent, one call, seeing every surviving finding at once. Judging a finding in isolation
cannot see what judging the set can. Run it every round, including the round where the set is
small and you can already see the answer — that round is the one it is for.

```xml
<role>Judge. You see every surviving finding together.</role>
<task>
  Findings: [paste all survivors]. Probe: [scratchpad]/probe.md.

  1. Score each 0-10 for whether a maintainer would act on it. Give a one-line rationale per score.
  2. Score 0, which drops it, when the finding is: a naming, comment, or formatting preference the
     repo's own tooling does not enforce; a restatement of something the range deliberately chose;
     or a question about an entity defined OUTSIDE the range that the reviewer never opened.
     A deliberate choice states itself wherever the author had room: the spec, an ADR, or a fence
     in the file's own comments. Open the file before you score. A finding that argues with a
     fence is a proposal for the human, not a defect for the implementer.
  3. Where two findings touch one site, say so and name which wins. Two dimensions reviewing the
     same line reach opposite conclusions often enough to plan for.
  4. Where the same defect appears under two ids, merge them and keep the worst severity. A merged
     finding is never less alarming than its worst half.
</task>
<output>
  Return JSON: [{"id": ..., "score": 0-10, "why": ..., "merged_with": [...], "conflicts_with": ...}]
</output>
```

Drop `real: false` and score 0. Carry anything marked `uncertain` through with its uncertainty
stated — never silently. Where `sites_complete` is false, append `missing_sites` to the finding.

## Task list

Turn the surviving findings into a numbered task list: one task per finding, each carrying the
file, the exact edit, and how to tell it worked. A task you cannot write that concretely is a
finding that is not ready — send it back to 3a or defer it. The list is the deliverable of your
judging. The implementer works it rather than rebuilding it, and that is what lets them work at
medium effort: a soft finding handed to a reasoning implementer becomes a fix nobody specified.

```text
N. <id> — <file:line> — <the exact edit> — <how to tell it worked>
```

Where a finding carries `missing_sites`, its task names them; the reviewer's Fix under-counted.
Where two tasks touch one site, say so and name which wins. Ask the implementer to report each task
`done` or `blocked`, with one line on why: fix-verify reads that report.

Score the range `N/5` as it stands when the round ends: how ready it is to merge. Weigh the
severity and number of the verified findings, the complexity of the change, and how well it fits
the codebase's patterns. Give the score one line of reason. Every round scores again. The score
informs; only the task list asks for work.

| Score | Meaning | Action |
| --- | --- | --- |
| 5/5 | Production ready | Merge |
| 4/5 | Minor polish needed | Merge after small fixes |
| 3/5 | Implementation issues | Address feedback first |
| 2/5 | Significant bugs | Needs rework |
| 0-1/5 | Critical problems | Major rethink needed |

Your report is the score, the task list, the `Deferred` minors, the findings that died at the
Anchor grep, and every accepted risk. The ledgers stay the evidence behind each task.

## Phase 4 — Fix-verify

A later round is this phase alone. One agent, cheap, reading the fix diff and nothing else.

A scratchpad lasts one session, so a later round in a new session holds no probe and no ledgers.
Run phase 1 again when `probe.md` is gone, and work from the task list when the ledgers are. On a
pull request the fix diff starts at the last review's `commit_id`.

```xml
<role>
  Fix verifier. You wrote none of this and you are not reviewing the pull request.
  You review ONE diff: the changes made for the last task list.
</role>
<constraints>Read-only. Your single write is your ledger.</constraints>
<task>
  The task list and the findings behind it: [paths]. The fix diff: [range: the commits since the
  review, plus any uncommitted changes]. The implementer's report, if one exists: [path].
  Probe: [scratchpad]/probe.md.

  1. For each task, open the file and confirm it does what the finding asked, at EVERY site in
     that finding's Sites field. For a task reported `blocked`, confirm the file really holds what
     the implementer says it holds — a blocked task is a claim too, and a wrong one hides a fix
     that was never applied. A task with no report is open until the file shows otherwise.
  2. Find every edit in the diff that no task asked for. Nobody has reviewed the reason for them;
     review them as new code.
  3. Review the diff's new code and new prose as if it arrived in a pull request. Run the commands
     the new prose tells a reader to run. A runbook step nobody has executed is the most reliable
     way for a fix to ship broken.
  4. Check the fixes against each other. Two fixes on one file can disagree.
  5. Re-run the repo's check scripts yourself, in the repository rather than a copy.
</task>
<output>
  Write [scratchpad]/fix-verify-[N].md in the find phase's Findings format, then return one line:
  <dry | not dry> | N findings: B blocker, M major, m minor | fixes: X correct, Y broken
</output>
```

`dry` closes the review. Anything else goes through phase 3 and lands on a new task list.

On a pull request, a fix that came back broken gets a reply on its thread saying what is wrong,
and the thread reopened. A new finding gets a new thread. Then edit the summary comment with the
new score.

## Traps

- **`Checks: pass` is a claim, not evidence.** Run them yourself, in the repository. A fix can be
  broken in ways no check covers, so green and broken sit together comfortably — 3 of 15 fixes came
  back wrong in the reference run, 2 of them new bugs the review introduced. Ask where the command
  ran, too: an implementer that runs the gate inside its own sandbox copy reports a true `pass`
  about a tree nobody is shipping.
- **A minor is free to raise and costs a round to apply.** In the reference run every genuine
  defect arrived as a blocker or a major, while the minors produced one invented anchor, one
  refuted claim, two that were not actionable, one that predated the range — and the only harmful
  fix of the review. The severity gate is the cheapest filter in the pipeline and it sits in front
  of the most expensive phase.
- **An implementer that improvises writes the bug nobody reads.** The fix is the last point the
  diff changes and the first point no reviewer is watching. Fix-verify's step 2 exists for it.
- **A rendered surface skips itself.** Left as a condition an agent evaluates under load, the
  browser pass is the one that gets dropped. The reference run reached round 3 before anyone loaded
  the page, and that one browser turn found the worst bug in the PR. The probe's step 6 settles it
  once so nobody re-decides it at midnight.
- **A Fix names fewer sites than its own Problem does.** A reviewer writes "neither call site does
  X" with three sites present, then patches two. The Sites field exists to make that impossible;
  do not accept a finding without one.
- **`/simplify` writes.** Keep the deletion dimension's report-only override when you edit it.
- **A two-ref diff hides the round.** `git diff <base> HEAD` skips every uncommitted fix, and an
  untracked file is missing whichever refs you pin. Check `git status` before you dispatch.
- **A merge mid-review invalidates it.** If the branch needs the base branch merged, do it BEFORE
  phase 1. A reviewer judging against stale context reports rules the repository no longer keeps.
- **A ledger inside the repo dirties `git status`,** which the implementer reads. The session
  scratchpad needs no `.gitignore` entry.
- **REST hides whether a thread is resolved.** `isResolved`, and the thread id that resolving or
  reopening takes, live on GraphQL's `reviewThreads`.
- **Dimensions do not converge, and that is the design working.** Independent reviewers overwhelmingly
  flag disjoint sets of locations. Expect each dimension to return findings the others missed. Two
  dimensions agreeing is a strong signal; two disagreeing is normal, and phase 3b settles it.
