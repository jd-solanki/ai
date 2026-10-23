---
name: merge-renovate-prs
description: >
  Land a repository's open Renovate pull requests: the Upgrader reads each, the human approves one
  plan, then each merges alone on green CI for a head up to date with the base branch. Use when
  asked to handle, merge or land Renovate pull requests or dependency updates.
---

Merge one pull request at a time. A pull request merges only on **green** CI for a head that is
**up to date**, and only after the human approves the plan in step 3.

- **Up to date**: the base branch's tip is in the head's history, `behind_by` 0 from
  `gh api repos/{owner}/{repo}/compare/{base}...{head}`.
- **Green**: every check run on that head completed as `success`, `skipped` or `neutral`.

Every wait below (an Upgrader run, a Mend rebuild, CI) is a background command that exits when its
condition holds or its timeout passes, so the harness notifies you.

## Two kinds of update

Read each pull request's commit authors.

- **Renovate-only**: every commit is `renovate[bot]`'s. Renovate maintains the branch, and its
  rebase checkbox rebuilds it on the base's tip with a regenerated lockfile.
- **Modified**: someone else committed, usually the Upgrader. Renovate has stopped maintaining
  the branch, and its rebase checkbox would recreate it from scratch, dropping those commits. A
  modified branch catches up by merging the base instead.

## Steps

1. **Take stock.** List the open pull requests carrying `⬆️ Renovate`. Done when each is listed
   with its kind.

2. **Run the Upgrader.** Apply `agent:upgrade` to each pull request that carries neither
   `agent:handed-back` nor a working label (`agent:*ing`). Wait until every one carries
   `agent:handed-back` and no working label.
   - No working label within 5 minutes of the trigger: the factory is down. Stop and report.
   - Still holding a working label after 2 hours: leave it out of the plan. A killed run keeps
     its label until a human removes it.
   - Handed back as a draft: its review ended with findings open. Leave it out.

   Done when each pull request is handed back ready, or left out with its reason.

3. **Ask once.** Show one table, in merge order:
   1. The lock file maintenance pull request (`renovate/lock-file-maintenance`).
   2. Renovate-only, smallest lockfile diff first.
   3. Modified.

   Each row: the versions it moves from and to, its kind, the Upgrader's verdict (no commits, or
   its commit subjects), the release-note items a human must weigh (breaking changes,
   deprecations, security advisories), and the CI result on its current head. Wait for approval.
   The human may drop or reorder rows; the approved table is the plan.

4. **Merge in order.** For each pull request in the plan:
   1. **Bring it up to date**, unless it already is.
      - Renovate-only: tick `<!-- rebase-check -->` in its body with `gh pr edit --body-file`, and
        wait up to 20 minutes for its head to change. Confirm every commit is still
        `renovate[bot]`'s and the versions are still the approved ones; a rebuild that moved to a
        newer release skips the pull request, since the Upgrader never read that release.
      - Modified: in a worktree of its branch, merge the base. Replace the lockfile with the
        base's and regenerate it with a lockfile-only install (`git checkout origin/<base> --
        pnpm-lock.yaml`, then `pnpm install --lockfile-only --ignore-scripts`). Commit, and push
        as a fast-forward.
   2. **Wait for CI** on that head, up to 45 minutes, until every check run completes.
   3. **Green: squash-merge** with `gh pr merge --squash`. **Red: skip it** and note the failing
      check.

   Done when every pull request in the plan is merged or skipped with a reason.

5. **Report** each pull request as merged (with its merge commit), skipped, or left out, each
   with its reason.

## Fences

- **A check run that never started vouches for nothing.** GitHub fails it at once, and its
  annotation names the cause, such as a failed payment or spending limit. Stop the loop at the
  first one and report it: every later merge would land untested.
- **A lockfile is regenerated, never merged by hand.** pnpm 12 leaves conflict markers in
  `pnpm-lock.yaml` unresolved, and a text merge that applies cleanly can still describe a tree no
  install would produce.
- **Mend has no completion signal.** Its job can die (`kernel-out-of-memory`) and leave the head
  unchanged. When a rebuild times out, read the pull request for Renovate's "Artifact update
  problem" comment, skip it, and report what the comment says.
- **The first merge can carry unrelated lockfile churn.** A package manager upgrade reshapes
  peer-dependency entries in whichever lockfile is regenerated next. Merging the lock file
  maintenance pull request first, or else the smallest, lands that churn once, and every rebuild
  after it shows only its own bump.
