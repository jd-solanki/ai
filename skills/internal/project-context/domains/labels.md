# Labels

## Words

**Claim**:
A run's hold on a work item, shown by the working label.
_Avoid_: lock, assignment

**Preferred factory**:
A factory that another, its **fallback**, defers every delivery to while it is up. A
fallback names its preferred factories in `DEFER_TO`.
_Avoid_: primary, higher-priority factory

## Rules

- A work item's `agent:*` label is its state. A trigger label means work is requested, a
  working label means a run holds the claim, `agent:handed-back` means a run left it to a
  human, and none means no agent is on it.
- Claiming swaps the labels: static code removes the trigger label and `agent:handed-back`,
  and applies the working label. The working label stays exactly as long as the run.
- Static code applies `agent:handed-back` with the assignment whenever a run waits on a
  human, as `pipeline.md` says.
- A trigger label re-applied while its working label is on is ignored: static code logs it
  and removes the trigger label.
- Only static code applies or removes a working label. A human applies a trigger label,
  or static code does when a run hands the work item to the next agent.
- A label records state only where GitHub keeps no record of its own. No label marks a
  work item done, reviewed, approved or failed.
- `issue:*` labels name an issue's kind and never trigger an agent. `pipeline.md` owns
  their meaning.

## Reasons

- GitHub is the only state store: the factory keeps nothing between runs, so a restart
  loses only in-flight claims, and any teammate sees where a work item stands.
- The team starts and re-runs agents from the issue or pull request page, never from the
  factory machine. The owner also watches runs live in herdr there.
- Applying a label needs the Triage role, so a label is authorization: an issue's author
  cannot start a run.
- No outcome labels: GitHub already records a review, a merge and a closed issue, and a
  label copying one drifts when a review is dismissed or a branch is pushed.
- `agent:handed-back` is state, not an outcome: it says whose turn it is, which GitHub keeps
  nowhere a filter reaches, since an assignment mixes with every other. `is:open
  label:agent:handed-back assignee:@me` lists what waits on a human across served repos,
  from any device. One label, not a past tense per agent: the factory comment and the pull
  request's draft or ready state say how far it got.
- The claim removes `agent:handed-back` so a re-triggered work item leaves that list, which
  its assignment never does.

## Fences

- **A trigger label left on a work item cannot be applied again.** GitHub sends `labeled`
  only when a label is added, so the claim removes the trigger: that is what lets a human
  re-apply it to resume or retry. `apps/software-factory/src/session.ts:claudeArgs`
- **A claim is a label swap, not a lock.** Two factories that receive the same delivery
  both claim it and both start a run, so a fallback defers to its preferred factory.
  `apps/software-factory/src/webhook.ts:handleWebhook`
- **A fallback defers by liveness, not by repo or claim.** It defers whenever a preferred
  factory is up, so a repo that factory doesn't serve is lost, and so is a delivery it
  drops before claiming. `apps/software-factory/src/webhook.ts:findFactoryUp`
- **`gh` fails the whole edit on a label the repo lacks.** A served repo set up before
  `agent:handed-back` existed would refuse every claim that removes it, so the claim removes
  it only from a work item that carries it, and `tell` adds it in an edit of its own, apart
  from the assignment. `apps/software-factory/src/session.ts:claudeArgs`

## Where it lives

`apps/software-factory/src/session.ts` (`TRIGGERS`, `claudeArgs`), `apps/software-factory/src/webhook.ts` (`handleWebhook`: what a
GitHub event must pass to start a run), `apps/software-factory/src/run-end.ts` (`handleRunReport`: when
a run's working label comes off), `apps/software-factory/src/hand-off.ts` (`handOff`: the
trigger label a run's end applies; `tell`: `agent:handed-back`), `apps/software-factory/README.md` (Add a project: the labels a served
repo needs; Run on more than one machine: a fallback's setup).
