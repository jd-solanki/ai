---
name: review-pr
description: >
  Review a PR or branch: parallel dimension reviewers raise candidates, an investigator proves or
  kills each defect, and the round ends in a task list an implementer works. A later round
  fix-verifies the fixes made for an earlier one. On a pull request it posts each task as a review
  thread and keeps one scored summary comment. Use when the user asks to review a PR or a branch,
  or to verify the fixes for a review.
disable-model-invocation: true
---

A first round runs **probe → raise → prove** and ends in a task list. It never edits the code:
whoever implements works the list. A later round, after fixes land, is **fix-verify** alone.
Handed the task list of an earlier round, run a later round. Handed none, run a first round.

You are the carrier. You probe, pick the dimensions, run `review.js` through the Workflow tool,
and write the report. The script runs every reviewing agent and sets each one's model and effort,
so your own session needs no more than medium effort. This skill telling you to call Workflow is
the opt-in that tool asks for, and the script decides how many agents run.

## What each stage is for

- **Probe** writes the range and the baseline down once. Without it every agent re-runs the same
  diff and the same check scripts.
- **Raise** goes wide through narrow agents. One agent covering ten dimensions samples each of
  them; ten agents covering one dimension each close theirs. A lens lists candidates and proves
  none of them, which is what keeps it short.
- **Prove** stands between a plausible candidate and the implementer. An investigator that did not
  raise the candidate proves it or kills it, and starts the moment its lens returns. Roughly a
  quarter of what a competent reviewer reports does not survive contact with the code.
- **Judge** sees the confirmed findings together, when two or more are left. Judging a finding in
  isolation cannot see the two that only look wrong beside each other.
- **Task list** hands what survived to the implementer, specified or not at all, because the
  implementer is the agent with the least review behind it.
- **Fix-verify** reads what the fixer wrote. New code and new prose enter the range at the moment
  no reviewer is left to read them, and that is where the next round's findings come from.

## Rounds

1. **Probe once per PR, not per round.** Its artifact is the only place environment facts are
   derived. Every agent reads it.
2. **Pin the range.** `git diff <merge-base>` — no second ref, so uncommitted fixes stay in
   scope. Pin the spec too (PR body, or the issue it closes); a reviewer with no spec reports
   style.
3. **Hand the workflow paths, not text.** Its `args` name the probe, the range and the spec.
   Candidates and evidence stay inside the workflow; only its result enters your context.
4. **Grep every Anchor before you report it.** `grep -nF` each returned finding's `anchor` against
   the file it names: confirmed, uncertain and deferred alike. A miss drops the finding. Say in
   your report which findings died here: a paraphrased quote and an invented one look identical
   from where you sit.
5. **Hold the severity gate: a defect reaches the task list, a nitpick reaches the report.**
   Blocker, major and minor are defects. An investigator proves each, and a confirmed minor is a
   task beside the majors, fixed in the same push. A nitpick is polish: nothing breaks if it
   stays. Batch nitpicks under `Nitpicks`, unverified, and let the human raise one by id. A raised
   nitpick is proved in the next round before it becomes a task.
6. **An uncertain finding is not a task.** Carry it under `Unproven` with what its investigator
   could not show — never silently. The human decides.
7. **Name what went unchecked, once.** Each `accepted_risk` marked `serious`, each
   `uncovered_files` entry and each `not_reviewed` agent gets a line in your report; the other
   risks stay in the saved round. Lines naming one surface fold into one. No agent chases them,
   so the human decides which one earns a dimension of its own. An agent that died reviewed
   nothing: its dimension is not reviewed, never clean.
8. **A round ends in its report, saved.** A first round's is the task list. A fix-verify round's
   is dry, or a new task list. Step 5 saves either.

You never edit the code under review. The implementer is someone else: an agent working the task
list, or the human.

## On a pull request

A pull request holds the review, so nothing has to survive in a session. A branch with no pull
request skips this section: its report stays in the session.

Write every thread, reply and summary comment with `/writing-for-humans`: a person reads them.

- **Check out the head, detached**: `gh pr checkout <n> --detach`. The range is read from the
  working tree, a review commits nothing, and the branch may be checked out in another worktree.
- **Each task is a review thread.** Post one review, event `COMMENT`, with one inline comment per
  task on its Anchor line: the severity mark, the id, the severity, the Problem and the task. The
  implementer works the threads and resolves each one it fixes. `COMMENT` only: a review informs,
  and a human decides the merge.
- **One summary comment, edited in place every round.** It opens with `<!-- review-pr:summary -->`,
  which is how the next round finds it, and carries the score and the rest of the report in the
  shape below. A second summary comment splits the record.
- **The round is read off the pull request.** No summary comment means a first round. One means a
  later round, and the threads of the last review are its task list.
- **A thread's state is the implementer's report.** Resolved claims `done`. Unresolved with a
  reply claims `blocked`. Unresolved and silent is open.
- **The closing round files what is left.** A round that closes the review, dry or ended, files
  every listed nitpick and every Unproven finding as one issue on the pull request's repository,
  and links it from the summary. A later round edits that issue rather than filing a second.
- **The third round is the last.** A third round that leaves tasks ends the review: the tasks go
  to a human, not to an implementer, and the summary's Action reads `Review ended: a human
  decides`. Every later round ends the same way. Rounds that do not converge spend budget with
  nobody watching.

### The summary comment

Every round rewrites it whole from this template and writes nothing beside the template's lines.
Each item appears once across all rounds: earlier rounds' items keep their place, a later round
adds only what is new, and an item that changes state moves rather than repeats. A fixed task
stays under Tasks as `fixed`; a raised nitpick leaves Nitpicks when it becomes a task. A heading is
its mark, its name and its count. `Reviews` counts the rounds, this one included. `Took` is this
round's wall-clock in minutes, from `started`, as step 5 names it, to now.

```markdown
<!-- review-pr:summary -->
## 🔍 Review: <N>/10 — <the score table's Action>

<the score's one line of reason>

### <state mark> Tasks (<fixed>/<all> fixed)

- 🟠 `<id>` · `<file:line>` · <the Problem, in a line> · <open, fixed or broken> · <link to its thread>

<details><summary>❓ Unproven (<count>)</summary>

- <one line per finding, as above, with what its investigator could not show>

</details>
<details><summary>⏭️ Nitpicks (<count>)</summary> … </details>
<details><summary>🗑️ Killed (<count>)</summary> … </details>
<details><summary>⚓ Died at the Anchor grep (<count>)</summary> … </details>
<details><summary>🙈 Unchecked (<count>)</summary> … </details>

<sub>Reviews (<n>) · Last reviewed commit: <short sha> · Took <minutes>m · Left for later: <the filed issue, once filed></sub>
```

Emoji go on headings and severities only, one meaning each: 🔴 blocker, 🟠 major, 🟡 minor. A
reader scanning finds a section by its mark. A section with nothing in it is left out, `Tasks`
excepted. The Tasks heading's state mark is the review's state: ☑️ while a task is open, ✅ once
every task is fixed, 🛑 once the review has ended.

## Step 1 — Probe

Take the time first, `date -u +%FT%TZ`: step 5 records it. Then run the probe yourself and write
`[scratchpad]/probe.md`. It is four commands' worth of facts, and an agent spends forty turns
settling what the commands settle in one. Facts only: the review starts in step 3.

1. Range: `git diff --stat <merge-base>`, `git status --short`,
   `git ls-files --others --exclude-standard`. List every file in the range, untracked included.
   Write `git diff <merge-base>` to `[scratchpad]/range.diff`; every agent reads the range there.
2. Baseline: install dependencies when the tree has none, then start the repo's check scripts
   from the root `package.json` in the background. Go straight on: the reviewers start before the
   checks finish. When each lands, append its command, exit code and wall-clock time. This is the
   one run of the checks until fix-verify.
3. Sandbox: if the range needs destructive experiments, record the recipe — the exact command
   that copies the working tree — not a copy for everyone to share. Each agent builds its own
   sandbox at `[scratchpad]/sandbox-<its label>` from that recipe.
4. Rendered surfaces: run `git diff --name-only <merge-base>` against `.vue`, `.css`, and
   `components/` or `pages/`. A hit means the review gets a Rendered surface dimension. No hit
   means it does not, and you record that decision here so nobody reopens it.
5. Dependents: for each dependency the range bumps, `git grep -l` its import and list the files.
   A lens owns them from the start; a consumer nobody listed is found late, by an agent everyone
   then waits for.

## Step 2 — Pick the dimensions

A dimension is a class of failure, not a file. Take every dimension below that the range touches,
and add what the range needs. Dimensions run side by side, so one more costs no wall-clock, and
one left out is a class nobody read. Leave one out only when the range holds nothing of its kind.

| Dimension | Kind | Covers |
| --- | --- | --- |
| Data and state safety | lens | what can move, corrupt, or mix persistent state and secrets |
| Logic and edge cases | lens | branches, loops, boundaries, failure modes, races |
| Interface and contract | lens | callers, signatures, config surfaces, back-compat |
| Build and CI | lens | pipelines, matrices, shell in job steps, injection through interpolation |
| Rendered surface | lens | only when the probe's step 4 found a hit |
| Tests | specialist | what each new or changed test holds, and the change it would let through |
| Docs and runbooks | specialist | every command and every claim in every doc the range touches |
| Project-context conformance | specialist | fences land line-exact; domain rules match the code; SSOT |
| Deletion | specialist | what the change makes dead and did not remove |

A **lens** hunts defects. It raises candidates and proves none: an investigator proves each
blocker and major. A **specialist** checks the range against something written down — a doc, a
rule, the code's own duplication — and finishes its own findings, sites and fix included. A
dimension you add is a lens whenever a blocker could hide in it.

**Dimension add-ons.** Pass as that dimension's `addon`, verbatim:

- *Project-context conformance*: `Every fence in /project-context names a file:line. Open each one
  and confirm it lands on what the fence describes. An edit in this range that shifts a cited line
  is a candidate.`
- *Deletion*: `Invoke /ponytail-review and /simplify, obey each triage gate. /simplify applies
  fixes — OVERRIDE IT. You are report-only. Name what to cut and what replaces it.`
- *Rendered surface*, with `"budget": 60`: `Load the page, drive it, report what you saw. Stacking
  context, focus order, accessible names and anything that streams are invisible to a source read.
  The run skill launches the app and Playwright CLI drives it. Start a fresh server; a server
  another agent left running serves stale routes. Run each flow once.`

## Step 3 — Run the workflow

Call the Workflow tool the moment the probe's other facts are written: a carrier that waits for
the baseline holds every reviewer for minutes they would have spent reading. Set `scriptPath` to
the absolute path of `review.js`, which sits beside this file, and pass these `args`:

```json
{
  "repo": "<absolute path of the working tree under review>",
  "scratch": "<the scratchpad>",
  "spec": "<path to the pinned spec>",
  "files": ["<every file in the range, spelled as the probe lists it>"],
  "dimensions": [
    { "key": "logic", "name": "Logic and edge cases", "covers": "<its Covers cell>", "kind": "lens" }
  ],
  "prior": "<what earlier rounds settled, when there were any>"
}
```

A `key` is short, lowercase and unique: it prefixes that dimension's finding ids, so `logic1`.

The workflow runs in the background and notifies you when it is done. Its result:

| Field | Holds | You |
| --- | --- | --- |
| `confirmed` | defects an investigator proved | write a task for each |
| `uncertain` | defects neither proved nor killed | report under `Unproven` |
| `killed` | candidates refuted, each with its reason | list by id, so a wrong kill can be caught |
| `deferred` | nitpicks; `verified` only where an investigator happened to confirm one | report under `Nitpicks` |
| `judged` | a score, merges and conflicts per confirmed finding; present for two or more | apply below |
| `accepted_risk`, `uncovered_files`, `not_reviewed` | surfaces, range files and agents nothing covered | name each in the report |

## Step 4 — Task list

Where `judged` is present, drop a finding scored 0, fold each `merged_with` into the finding that
names it, and keep the worst severity of the merged set. The workflow folds nothing itself: two
candidates on one line can be two defects. Where two nitpicks describe one thing, list it once under
both ids.

Turn the confirmed findings into a numbered task list: one task per finding, each carrying the
file, the exact edit, and how to tell it worked. A task you cannot write that concretely is a
finding that is not ready — report it under `Unproven`. The list is the deliverable of your
judging. The implementer works it rather than rebuilding it, and that is what lets them work at
medium effort: a soft finding handed to a reasoning implementer becomes a fix nobody specified.

```text
N. <id> — <file:line> — <the exact edit> — <how to tell it worked>
```

Where a finding's `sites` lists more places than its `fix` names, the task names them all. Where
two tasks touch one site, say so and name which wins. Ask the implementer to report each task
`done` or `blocked`, with one line on why: fix-verify reads that report.

Score the range `N/10` as it stands when the round ends: how ready it is to merge. Weigh the
severity and number of the confirmed findings, the complexity of the change, and how well it fits
the codebase's patterns. A confirmed blocker caps the score at 5, a major at 7 and a minor at 9, so
across rounds the score climbs only as the task list empties. Give the score one line of reason:
what holds it below 10. A 10 has none.
Every round scores again. The score informs; only the task list asks for work.

| Score | Meaning | Action |
| --- | --- | --- |
| 10/10 | Production ready | Merge |
| 8-9/10 | Minor polish needed | Merge after small fixes |
| 6-7/10 | Implementation issues | Address feedback first |
| 4-5/10 | Significant bugs | Needs rework |
| 0-3/10 | Critical problems | Major rethink needed |

Your report is the score, the task list, `Unproven`, the `Nitpicks`, the killed candidates,
the findings that died at the Anchor grep, and every line rule 7 asks for.

## Step 5 — Save the round

Every round, first or later, ends by saving itself to the review data folder on this machine:
`${XDG_DATA_HOME:-$HOME/.local/share}/review-pr/rounds/<owner>-<repo>/<PR number or branch>/round-<n>/`.
The data stays local and outlives the session; the skill is tuned from it.

- `report.md`: your report.
- `result.json`: the workflow's result, as returned.
- `args.json`: the `args` you passed.
- `round.json`:

```json
{
  "repo": "<owner/repo>", "target": "<PR number or branch>", "round": 1,
  "head": "<sha reviewed>", "base": "<merge-base, or the last review's commit for a later round>",
  "started": "<date -u +%FT%TZ, taken before your first command>", "ended": "<the same, now>",
  "score": 7, "transcripts": "<the Transcript dir the Workflow tool printed>"
}
```

## A later round — Fix-verify

This is the round a pull request sees most: it is run again after every batch of fixes, until
it comes back dry or the third round ends the review. It reads the fix diff alone, so it is short and it re-raises nothing an earlier
round already settled.

A later round's probe is three facts. Write the fix diff to `[scratchpad]/range.diff`, start the
check scripts in the background, and record the sandbox recipe. These are the checks of this
round, run once, in the repository: the verifier reads them and runs none itself. Steps 4 and 5
of the first probe are settled and stay settled. Write the last task list to
`[scratchpad]/tasks.md`: on a pull request it is the threads of the last review, and the fix diff
starts at that review's `commit_id`.

Call the same script with `repo`, `scratch`, `spec` and:

```json
{
  "mode": "fix-verify",
  "tasks": "<[scratchpad]/tasks.md>",
  "fixRange": "<the commits since the review, plus any uncommitted changes>",
  "report": "<path to the implementer's report, when one exists>",
  "raised": ["<each nitpick the human raised, as the earlier result held it>"]
}
```

The result adds `tasks`, each `correct`, `broken` or `open`. The round is `dry` when every task
is `correct`, every check exits 0, and nothing is confirmed or uncertain: `dry` closes the
review. A nitpick never holds it: the closing round files it. Anything else lands on a new task
list.

On a pull request, a fix that came back broken gets a reply on its thread saying what is wrong,
and the thread reopened. A new finding gets a new thread. Then rewrite the summary comment, and
save the round as step 5 says.

## Traps

- **`Checks: pass` is a claim, not evidence.** Run them yourself, in the repository, every round.
  A fix can be broken in ways no check covers, so
  green and broken sit together comfortably — 3 of 15 fixes came back wrong in the reference run,
  2 of them new bugs the review introduced. Ask where the command ran, too: an implementer that
  runs the gate inside its own sandbox copy reports a true `pass` about a tree nobody is shipping.
- **An unproved minor is free to raise and costly to apply.** In the reference run the unproved
  minors produced one invented anchor, one refuted claim, two that were not actionable, one that
  predated the range — and the only harmful fix of the review. A minor is proved like a major
  before it becomes a task; a nitpick waits for the human.
- **An implementer that improvises writes the bug nobody reads.** The fix is the last point the
  diff changes and the first point no reviewer is watching. Fix-verify exists for it.
- **A rendered surface skips itself.** Left as a condition an agent evaluates under load, the
  browser pass is the one that gets dropped. The reference run reached round 3 before anyone loaded
  the page, and that one browser turn found the worst bug in the PR. The probe's step 4 settles it
  once so nobody re-decides it at midnight.
- **A fix names fewer sites than its own problem does.** A reviewer writes "neither call site does
  X" with three sites present, then patches two. The `sites` field exists to make that impossible;
  do not write a task from a finding without one.
- **`/simplify` writes.** Keep the deletion dimension's report-only override when you edit it.
- **A two-ref diff hides the round.** `git diff <base> HEAD` skips every uncommitted fix, and an
  untracked file is missing whichever refs you pin. Check `git status` before you run the workflow.
- **A merge mid-review invalidates it.** If the branch needs the base branch merged, do it BEFORE
  step 1. A reviewer judging against stale context reports rules the repository no longer keeps.
- **A scratch file inside the repo dirties `git status`,** which the implementer reads. The
  session scratchpad needs no `.gitignore` entry.
- **REST hides whether a thread is resolved.** `isResolved`, and the thread id that resolving or
  reopening takes, live on GraphQL's `reviewThreads`.
- **Dimensions do not converge, and that is the design working.** Independent reviewers
  overwhelmingly flag disjoint sets of locations. Expect each dimension to return candidates the
  others missed. Two dimensions raising one defect is a strong signal, and the judge's
  `merged_with` shows it.
