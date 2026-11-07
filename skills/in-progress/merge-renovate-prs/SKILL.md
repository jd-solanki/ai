---
name: merge-renovate-prs
description: >
  Land a repository's open Renovate pull requests: the Upgrader reads each, the human approves one
  plan, then each runs CI once, on a head up to date with the base branch, and merges alone on
  green. Use when asked to handle, merge or land Renovate pull requests or dependency updates.
---

Merge one pull request at a time. A pull request merges only on **green** CI for a head that is
**up to date**, and only while its updates are the ones the human **approved** in step 3.

A dependency update stays a **draft** until its turn, and drafts skip CI. Marking it ready is what
runs its CI, once, on the head that merges. A run on any earlier head is spent: the next merge
leaves that head behind.

Every wait below is a background command that exits when its condition holds or its timeout
passes, so the harness notifies you. The scripts in `scripts/`, beside this file, are those waits
and reads. Run each by its absolute path; its header gives its arguments and exit codes.

| Script          | Does                                                                                   |
| --------------- | -------------------------------------------------------------------------------------- |
| `prs.py`        | Lists open Renovate pull requests: draft or ready, head, and each update row, with the installed versions it moves from and to |
| `wait-head.sh`  | Waits for Renovate's rebuild after a rebase tick                                       |
| `wait-ci.sh`    | Waits for CI on one head and judges it green or red                                    |
| `lock-delta.py` | Summarises what a lockfile change moves: direct dependencies, transitive majors, copies |

- **Up to date**: the base branch's tip is in the head's history, `behind_by` 0 from
  `gh api repos/{owner}/{repo}/compare/{base}...{head}`, read just before you act on it.
- **Green**: `wait-ci.sh` exits 0. At least one GitHub Actions workflow run on that head, created
  after the pull request was marked ready, and every job of each completed as `success`, `skipped`
  or `neutral`. Runs on an earlier head and commit statuses such as `renovate/stability-days`
  count for nothing.
- **Approved**: a pull request's update rows, from `prs.py`, are its row in the approved plan:
  the same packages at the same versions. A pull request whose rows differ has **drifted**.

## Three kinds of update

Read each pull request's commit authors once the Upgrader has handed it back; its run can add
commits.

- **Renovate-only**: every commit is `renovate[bot]`'s. Renovate maintains the branch, and its
  rebase checkbox rebuilds it on the base's tip with a regenerated lockfile.
- **Modified**: someone else committed, usually the Upgrader. Renovate has stopped maintaining
  the branch, and its rebase checkbox would recreate it from scratch, dropping those commits. A
  modified branch catches up by merging the base instead.
- **Lock file maintenance** (`renovate/lock-file-maintenance`): moves every installed version to
  the newest its range allows, direct dependencies included. It carries no release notes, so it
  gets no Upgrader run; `lock-delta.py` builds its plan row, and it merges last.

## Steps

1. **Take stock.** Run `prs.py`. Return each ready pull request to draft with `gh pr ready --undo`,
   so no rebuild runs CI before its turn. Tell the human that a push to the base branch during the
   run sends the pull request in CI back to be brought up to date. No lock file maintenance pull
   request means no row for it; a ticked Dependency Dashboard box can be cleared without one
   opening.

   Done when each pull request is listed and a draft.

2. **Run the Upgrader.** Apply `agent:upgrade` to each pull request, lock file maintenance aside,
   that carries neither `agent:handed-back` nor a working label (`agent:*ing`). Wait until every
   one carries `agent:handed-back` and no working label.
   - No working label within 5 minutes of the trigger: the factory is down. Stop and report.
   - Still holding a working label after 2 hours: leave it out of the plan. A killed run keeps
     its label until a human removes it.
   - The factory's hand-back comment (`<!-- factory -->`) says why it waits. A wait on the merge
     alone, "it stays a draft" or an older factory's "it is marked ready", means the run
     finished. A hand-back asking for its label again, after an API error, gets one retry.
     Anything else, such as a review that ended with findings open, leaves it out with that
     reason.

   Done when each pull request is handed back waiting on its merge, or left out with its reason,
   and each has its kind.

3. **Ask once.** Show one table, in merge order:
   1. Renovate-only, smallest lockfile diff first.
   2. Modified.
   3. Lock file maintenance.

   Each row: the versions it moves from and to (`prs.py`), its kind, the Upgrader's verdict (no
   commits, or its commit subjects), the release-note items a human must weigh (breaking changes,
   deprecations, security advisories). Lock file maintenance's row is
   `lock-delta.py origin/<base> <its head>`: the direct dependencies it moves, each version no row
   above carries marked **unreviewed**, the transitive new majors, and the packages left with
   fewer copies. Wait for approval. The human may drop or reorder rows; the approved table is the
   plan.

   Re-invoked on a plan approved earlier: the approval stands for the rows that have not drifted.
   Say which those are, and ask about the rest.

   Done when the human has approved a plan.

4. **Merge in order.** For each pull request in the plan:
   1. **Bring it up to date**, unless it already is. A draft runs no CI for the new head.
      - Renovate-only: tick `<!-- rebase-check -->` in its body with `gh pr edit --body-file`,
        then run `wait-head.sh`. Exit 3: Renovate closed it; go to step 4.5. Exit 4 (box cleared,
        nothing pushed) or 5: move it to the end of the plan once, then skip it, quoting
        Renovate's "Artifact update problem" comment when there is one.
      - Modified: in a worktree of its branch, merge the base, with pnpm at the version
        `packageManager` pins (`pnpm dlx pnpm@<version>`):
        1. Replace the lockfile with the base's and regenerate it:
           `git checkout origin/<base> -- pnpm-lock.yaml`, then
           `pnpm install --lockfile-only --ignore-scripts`.
        2. Redo each lockfile-only commit the Upgrader made, such as a `pnpm dedupe` or a
           `pnpm update` that collapsed copies: regenerating drops it.
        3. Resolve a conflict outside the lockfile, such as a catalog entry in
           `pnpm-workspace.yaml`, to the base's lines plus this pull request's approved
           versions. Skip the pull request on any other conflict, naming it.
        4. Run `pnpm install --frozen-lockfile`, since the commit hook runs the checks. Commit,
           and push as a fast-forward.
      - **Check for drift**: `prs.py <repo> <n>` against its approved row, or `lock-delta.py`
        for lock file maintenance, where a new **unreviewed** version is drift. Drifted: show
        the human the rows it gained or lost, with their release-note items, and wait for an
        answer.
   2. **Mark it ready** with `gh pr ready`, and note the UTC time. Already ready, its update ran
      CI; note that push's time instead.
   3. **Wait for CI**: `wait-ci.sh <repo> <head> <that time>`.
      - 1, with every failing step outside the build and the checks (provisioning a cloud
        resource, fetching a credential): rerun with `gh run rerun --failed` once, and wait
        again.
      - 1 otherwise, 4 (no CI ran) or 5: return it to draft with `gh pr ready --undo`, so
        Renovate's later rebuilds run no CI, and skip it, naming the failing step.
   4. **Green: squash-merge** with `gh pr merge --squash --match-head-commit <head>`. Refused
      because the base moved: back to step 4.1, once. A timeout or a 5xx: read the pull request's
      state before retrying.
   5. **Take stock again** with `prs.py`. A planned pull request no longer listed was
      **superseded**: a merge installed its versions and Renovate closed it. Name the pull request
      that now carries its range bump, if one does. A pull request new since step 1 stays out of
      the plan.

   Done when every pull request in the plan is merged, skipped or superseded, each with its
   reason.

5. **Report** each pull request as merged (with its merge commit), skipped, superseded or left
   out, each with its reason, and list the pull requests opened during the run.

## Fences

- **A job that never started vouches for nothing.** GitHub fails it at once, and its annotation
  names the cause, such as a failed payment or spending limit: `wait-ci.sh` exits 9. Stop the loop
  there and report it: every later merge would land untested.
- **A lockfile is regenerated, never merged by hand.** pnpm leaves conflict markers in
  `pnpm-lock.yaml` unresolved, and a text merge that applies cleanly can still describe a tree no
  install would produce.
- **Lock file maintenance merges last, and only from an approved plan.** It moves direct
  dependencies to the newest release each range allows. Merged first, it installs the releases
  that approved pull requests carry: Renovate closes those, folds their range bumps into a group
  pull request, and the group shows no release notes. Merged by Renovate's automerge, it lands
  minor releases nobody reviewed.
- **The first merge can carry unrelated lockfile churn.** A package manager upgrade reshapes
  peer-dependency entries in whichever lockfile is regenerated next, so the first merge lands
  that churn once, and every rebuild after it shows only its own bump.
