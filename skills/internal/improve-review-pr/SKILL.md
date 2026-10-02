---
name: improve-review-pr
description: One pass that improves /review-pr from the reviews it ran and from what the paid review tools published since the last pass. Run it monthly.
disable-model-invocation: true
---

One pass reads what the reviews did, reads what the paid tools changed, proposes at most two
changes to `/review-pr`, proves each on the gate, and hands the owner a diff with its numbers.
You edit `skills/in-progress/review-pr/` and nothing else under `skills/`. The owner commits.

No change is a complete pass and a good result. A change with no number behind it is taste.

## Where things live

The review data folder is `${XDG_DATA_HOME:-$HOME/.local/share}/review-pr/`. It stays out of
every repository: it quotes private code.

| Path | Holds |
| --- | --- |
| `rounds/<owner>-<repo>/<target>/round-<n>/` | one saved round: `round.json`, `args.json`, `result.json`, `report.md`. `/review-pr` writes it. |
| `gate/<case>/` | one frozen review: `case.md`, `goldens.md`, `spec/`, `runs/<date>-<label>/` |
| `improve.md` | the log of passes, newest last |

In this repository: `research/` holds one dated paper per outside system, and
`docs/review-pr-speed.md` holds the reasons behind the skill's shape. `timeline.py` sits beside
this file.

## Steps

1. **Find the last pass.** Read the last entry of `improve.md`. Everything below reads what is
   newer than its date.

2. **Read the rounds.** For every round saved since, take minutes and score from `round.json` and
   the counts from `result.json`. Where a round's `transcripts` folder still exists, run
   `python3 timeline.py <the session's .jsonl>` for its per-agent times. Done when you hold one
   table per repository — target, round, minutes, score, confirmed, uncertain, killed, deferred —
   and have named, each with its number:
   - the stage or agent a round waited for longest;
   - the dimension that returned least for its minutes;
   - every task a later round found `broken`, and every candidate an investigator killed;
   - every `not_reviewed` agent;
   - the targets that took the most rounds to reach dry.

3. **Read the outside.** One background agent per paper in `research/`, web only. Each fetches
   what that system published since the paper's date — changelog, engineering blog, docs — and
   appends a `## Since <date>` section: what changed, a short quote, the URL, and whether it bears
   on a question `docs/review-pr-speed.md` leaves open. First-party sources. A paper with nothing
   new gets one dated line saying so.

4. **Propose.** At most two changes. Each names the number from step 2 or the source from step 3
   it answers, and the number it should move. Prefer a change that deletes.

5. **Gate each change, alone.** Edit the skill, then run every case in `gate/` as below. Keep the
   change when every finding under "Must be confirmed" in `goldens.md` is confirmed again and the
   minutes did not rise without a reason you can name. Otherwise revert it. Add the run to the
   case's `goldens.md` table either way: a failed change is a result.

6. **Grow the gate.** A target in `rounds/` that reached dry after a confirmed blocker or major is
   a new case: its round-1 `head` and `base` go in `case.md`, its spec in `spec/`, and its
   confirmed findings in `goldens.md`. One PR is a weak gate; it catches a collapse, not a few
   points of recall.

7. **Report and log.** Tell the owner what you read, what you changed, and the before and after
   numbers, with the diff left uncommitted. Update `docs/review-pr-speed.md` where a decision
   changed. Append the pass to `improve.md`.

## Running a gate case

A gate run is a real review of a frozen commit, started the way the pipeline starts one, on a
branch so nothing is posted. It costs about what a real review costs.

```bash
cd <the repo path in case.md>
claude --bg --name "gate <case> <label>" --worktree gate-<case>-<label> --model opus --effort medium \
  --add-dir <this repo>/skills/in-progress/review-pr <data>/gate/<case>/spec <data>/gate/<case>/runs -- "<prompt>"
```

The prompt, slots filled from `case.md`:

```text
Run a first-round review of this branch with the review-pr skill at <this repo>/skills/in-progress/review-pr:
Read its SKILL.md and follow it. That directory is the skill's base directory, and review.js sits in it.
It replaces the review-pr installed in this repository, so do not invoke that one. This is a branch
review, not a pull request: first run 'git checkout --detach <head>', the range is 'git diff <base>',
nothing is posted to GitHub, and no gh command is run. The spec is <data>/gate/<case>/spec/<file>, and
the issues it closes sit beside it. Read nothing else under <data>. When the round ends, write your
report to <data>/gate/<case>/runs/<date>-<label>/report.md and the workflow's raw result to result.json
in the same folder.
```

A later-round case swaps the first sentence for "Run a later round, fix-verify" and names the
task list and the fix diff from `case.md`.

Wait for `report.md` with one background command, then write the timeline beside it:

```bash
python3 timeline.py ~/.claude/projects/<the worktree's project folder>/<session>.jsonl > <run folder>/timeline.txt
```

Compare by what a finding says: ids change every run. Then remove what you made:
`claude rm <session id>` and `git branch -d worktree-gate-<case>-<label>` in that repo.

## Traps

- **Every reviewing agent sees the gate prompt.** The Workflow tool relays the request that
  started the run to each agent. A prompt that names a golden hands every reviewer the answer.
- **A run that can read `goldens.md` or `baseline/` is not a test.** Add only `spec/` and `runs/`
  to the session, and keep "Read nothing else" in the prompt.
- **One run is one draw.** Minors differ run to run, and so does the severity a reviewer gives a
  test gap. Judge a change on the blockers and majors, and on minutes.
- **Change one thing per run.** A run that changed the model and the effort together could not say
  which one lost the minors.
- **The installed skill is the old skill.** A frozen commit carries whatever `review-pr` was
  committed there. The prompt points at this repository's copy for that reason.
- **Transcripts expire.** Claude Code deletes old sessions, so per-agent times exist only for
  recent rounds. `round.json` keeps the minutes.
