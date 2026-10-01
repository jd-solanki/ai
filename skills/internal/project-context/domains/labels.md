# Labels

## Words

**Claim**:
A run's hold on a work item, shown by the working label.
_Avoid_: lock, assignment

## Rules

- A work item's `agent:*` label is its state. A trigger label means work is requested, a
  working label means a run holds the claim, and neither means no agent is on it.
- Claiming swaps the labels: static code removes the trigger label and applies the
  working label. The working label stays exactly as long as the run.
- Only static code applies or removes a working label. A human applies a trigger label,
  or a run does when it hands the work item to the next agent.
- A label records state only where GitHub keeps no record of its own. No label marks a
  work item done, reviewed, approved or failed.
- `issue:*` labels name an issue's kind and never trigger an agent. `pipeline.md` owns
  their meaning.

## Reasons

- GitHub is the only state store: the factory keeps nothing between runs, so a restart
  loses only in-flight claims, and any teammate sees where a work item stands.
- The team starts, watches and re-runs agents from the issue or pull request page, never
  from the factory machine.
- Applying a label needs the Triage role, so a label is authorization: an issue's author
  cannot start a run.
- No outcome labels: GitHub already records a review, a merge and a closed issue, and a
  label copying one drifts when a review is dismissed or a branch is pushed.

## Fences

- **A trigger label left on a work item cannot be applied again.** GitHub sends `labeled`
  only when a label is added, so the claim removes the trigger: that is what lets a human
  re-apply it to resume or retry. `server.ts:claudeArgs`

## Where it lives

`server.ts` (`TRIGGERS`, `claudeArgs`), `README.md` (Add a project: the labels a served
repo needs).
