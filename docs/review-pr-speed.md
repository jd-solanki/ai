# review-pr: from an hour to a quarter of one

Why `/review-pr` is shaped the way it is: where a run spent its time, what other review
systems do about the same costs, what was tried, and what five test runs measured.
Researched and measured 2026-10-02.

The outside evidence sits in four papers under `research/`: `code-review-greptile.md`,
`code-review-coderabbit.md`, `code-review-alibaba.md` (Alibaba's `open-code-review`), and
`code-review-landscape.md` (Bugbot, Cloudflare, Anthropic, Sentry, Uber, Qodo, Kodus,
Codex, Copilot, and the benchmarks).

## The run that started this

One pull request in a private repository, first round, 71.6 minutes to the task list. The range was 10 source
files, +534/−158, behind a 33-file skills-update commit. The pipeline launched it with
`--effort high`, and every first-round agent ran Opus 5.5 at that effort because a
subagent copies its parent's.

| Phase | Minutes | What held it |
| --- | --- | --- |
| Setup | 1.3 | checkout, range, spec |
| Probe | 8.9 | one agent, 43 turns, for 61 seconds of check scripts |
| Brief and dispatch | 2.5 | the batch starts only when the dispatch message ends |
| Find, 8 agents | 15.9 | slowest was Deletion: 128 tool calls, four minors |
| Collate | 1.6 | Anchor greps, duplicates merged |
| Verify | 31.1 | refuter 13.5; a finder routed from `Not exercised` 31.1, one minor |
| Judge | 9.6 | scored 12 minors the severity gate already excludes |

It ended with one major and ten minors. Verification removed nothing.

## What the research settles

- **Narrow agents are faster and no worse.** Greptile v5 moved to one agent per bug
  hypothesis and its median review went from 5:04 to 2:25 while its address rate rose.
  Sentry gives each hypothesis its own verifier.
- **Bug finding does not survive a cheaper setting.** The one per-effort benchmark
  (Macroscope, Opus 5) gives recall 57 / 69 / 77% at low / medium / high, with precision
  flat, so the loss is silent. No source tested Opus 5.5 at medium against high.
- **A verifier told to kill also kills real findings.** Kodus doubled delivered recall by
  requiring a concrete refutation. Alibaba's filter deleted 8 real findings in 22 removals
  until its rule became "remove only what the diff proves wrong".
- **Measured and rejected elsewhere:** identical voting passes, verifier voting, one agent
  per file or hunk, a larger model on every step.
- **No-quality-loss is proved one way everywhere:** a frozen set of past PRs with known
  findings, re-run after each change.

## The shape

The carrier probes with commands, then hands the review to `review.js`, a Workflow script
shipped in the skill folder.

- **Raise.** One agent per dimension. A lens lists candidates and proves none. A
  specialist finishes its own findings.
- **Prove.** One investigator per blocker or major, started the moment its raiser
  returns. It proves the candidate or kills it, and kills only with a concrete refutation.
- **Judge.** One agent, only when two or more findings are confirmed.

Every agent runs the session's model at high effort. The carrier runs at medium.

## The gate

That pull request's range, frozen at the commit first reviewed and reviewed as a branch so
nothing is posted. Each run is a `claude --bg` session in a fresh worktree, the way the
pipeline starts one. Goldens, reports, raw results and timelines are kept outside any
repository, in the review data folder `/improve-review-pr` names.

| | Original | Run 1 | Run 2 | Run 3 | Run 4 |
| --- | --- | --- | --- | --- | --- |
| Minutes to the report | 71.6 | 35.3 | 15.3 | 23.0 | 15.8 |
| The major | found | confirmed | confirmed | confirmed | confirmed |
| Majors the original lacked | | 1 | 0 | 2 | 0 |
| Minors reported | 10 | 6 | 5 | 4 | 6 |
| Original minors found again | | 2 | 2 | 3 | 3 |

What each run changed, and what it showed:

- **Run 1: the shape above, with specialists on Sonnet at medium and a follow-up reviewer
  for every unchecked surface marked serious.** The three Sonnet specialists returned in
  under a minute and found one minor where the original found six. A browser follow-up
  ran 20 minutes and returned a duplicate of the major. Everything else was done by
  minute 15.6.
- **Run 2: every agent on Opus at high, no follow-ups.** 15.3 minutes. The carrier picked
  six dimensions and left Docs out, though the range changed a README.
- **Run 3: every dimension the range touches, nine in all.** Two test gaps were confirmed
  as majors, and the major was proved twice under two ids. The carrier slept four
  minutes waiting for the baseline checks. Two different findings anchored on the one
  line of a version bump, and the script folded one into the other.

- **Run 4: the carrier starts the workflow without waiting for the baseline, and the
  script folds nothing by line.** The reviewers started at minute 1.2. Nine dimensions,
  15.8 minutes, scored 7/10 under the cap a confirmed major sets.

## The later round

A pull request is reviewed again after every batch of fixes, so the later round is the
one that runs most. Measured on the commit that fixed the major, with the task list of
run 2: 6.4 minutes, one task `correct`, six checks green, nothing new, dry. The original
run's two later rounds took about 9 and 17 minutes.

- The carrier took 1.5 minutes, the verifier 4.1, the report 0.7.
- The checks ran twice in that test, once by the carrier and once by the verifier. They
  now run once, by the carrier, and the verifier reads them. Not yet run again.
- A later round reads the fix diff alone. That is what lets a loop settle: a second full
  review would re-roll the minors, and the score would never hold still.

## What the gate says

- **Serious findings hold.** The original major was confirmed in all four runs, each
  time by a reproduction. The new shape also confirmed two test gaps the original missed,
  in two of the four runs; the other two rated the same gap minor.
- **Minors are fewer and unstable.** Four to six a run against the original's ten, and a
  different handful each time. Of the four minors the owner had fixed after the original
  review, the runs found two, one, two and two. One original run cannot say how many of its
  own ten it would find twice.
- **A first round is about 16 minutes on this range, not 10.** The floor is one lens at high
  effort, 7 to 10 minutes, then its investigator, about 4, with 3 to 4 of carrier work
  around them.

## Tried and dropped

- **A probe agent.** 43 turns for facts four commands settle.
- **Sonnet at medium for specialists.** Failed the gate in run 1.
- **Follow-up reviewers for unchecked surfaces.** The last thing two rounds waited for,
  31 and 20 minutes, one minor each time. Unchecked surfaces go to the report instead.
- **Folding candidates by `file:line`.** Dropped a real finding in run 3.
- **A judge over minors, and a judge for a lone finding.** Nothing for it to compare.

## Open

- One frozen PR is a weak gate: it catches a collapse, not a few points of recall. Mine
  fix commits back to the pull request that introduced the bug to grow the set.
- Whether Opus at medium holds for Docs, Conformance and Deletion. Run 1 changed model and
  effort together, so it does not say.
- Whether raising the tool-call budgets (40 for a lens, 60 for a specialist) brings the
  minors back, and what it costs in minutes.
- The pipeline's session effort for a review can drop to medium once the new skill is
  installed in every repository it serves. Before that, the old skill's agents copy the
  session's effort, and lowering it would run every reviewer at medium.
- Every workflow agent is shown the request that started the run. Each brief opens by
  saying which part of it is the agent's; a brief without that preamble reruns the review.
