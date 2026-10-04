# Pipeline

## Words

**Spec branch**:
The one branch a spec is delivered on: `spec/<n>`, `<n>` being the spec's number.
_Avoid_: feature branch, worktree branch, integration branch

**Frontier**:
The sub-issues outside the done set whose blocking siblings are all inside it.

**Owner step**:
A human step a spec lists for its pull request: it blocks merge or production, never an
AFK issue.

**Implementer**, **Reviewer**, **Fixer**, **Upgrader**:
The agents that `agent:implement`, `agent:review`, `agent:fix` and `agent:upgrade` request.

**Dependency update**:
A pull request that bumps dependency versions and carries their release notes in its body,
as Renovate opens one.

## Rules

- The stages, in order:
  1. `/grill-with-docs` reaches shared understanding and records its decisions in project
     context.
  2. The human runs `/create-spec`. It commits those records to the spec branch, then
     files the spec and its sub-issues, each with the siblings that block it. It never
     applies a trigger label.
  3. A teammate reads the spec and applies `agent:implement`.
  4. The Implementer runs `/implement-spec`. It works the frontier until every sub-issue
     is done, leaving one commit per AFK issue on the spec branch. It then reviews the
     branch with `/code-review`, fixes what that finds, and opens a draft pull request
     with `/create-pr`.
  5. The Implementer hands the draft over with `agent:review` and exits. Review runs and
     Fixer runs alternate until a review comes back dry, which is the approval: `/review-pr`
     defines dry, and files what the review leaves for later as one issue. The pull request body is then rewritten with `/create-pr`, keeping every
     `Closes` line, and the pull request is marked ready for review.
  6. A human merges, then does the Owner steps.
- A dependency update enters the pipeline at its pull request: a teammate applies
  `agent:upgrade`, which acts only on a pull request carrying `⬆️ Renovate`. The Upgrader
  runs `/implement` with instructions appended: the release notes are the spec, and the code
  ends as it would read had it been written against the new versions. With commits, it pushes
  them onto the update's branch and hands it to the Reviewer, and stage 5 follows. With none,
  it marks the pull request ready for review. Renovate's body stays: it carries the
  Upgrader's spec.
- The Upgrader matches the upstream issues and pull requests the release notes name against the
  repository's open issues and pull requests, and comments on each match. A commit that does an
  open issue's work carries `Closes <owner>/<repo>#<n>`; an issue the release does not make
  doable gets a comment at most.
- One spec, one spec branch, one pull request. Work too big for one pull request is two
  specs.
- When `/create-spec` pushed no records, the spec branch is cut from the default branch.
- `/create-spec` defines what a spec and its sub-issues contain.
- `/implement-spec` runs on every spec. A spec with no AFK sub-issue is its own AFK issue,
  blocked by every HITL sub-issue it has.
- A sub-issue waits on the siblings GitHub lists as blocking it. The frontier's AFK
  issues run at once, each in its own worktree, and each lands on the spec branch as it
  finishes.
- Every spec carries `issue:spec`, and `agent:implement` acts only on an issue that
  carries it. Every sub-issue lives in the spec's repository and carries exactly one of
  `issue:AFK` or `issue:HITL`.
- The done set: an AFK issue is done when a commit on the spec branch, and not on the
  default branch, has a message ending in `Closes <owner>/<repo>#<n>`. A HITL issue is done when it
  carries `issue:HITL-done`. Open or closed state never counts.
- An undone HITL issue holds back only the sub-issues it blocks. When the frontier holds
  only HITL issues, the Implementer comments on the spec, mentions whoever applied
  `agent:implement`, and stops. The human applies `issue:HITL-done` to each, then
  `agent:implement` to the spec.
- Re-applying `agent:implement` resumes a spec wherever it stopped: the done set says
  where.
- Agents run non-interactively. An agent that cannot continue, that must change a
  decision recorded in project context, or that finds a line of its spec wrong files a
  HITL issue naming it, blocking the sub-issues that wait on the answer, and stops as
  above.
- A sub-issue title is a Conventional Commit subject: it becomes the commit subject.
- A review fix is its own commit, with a Conventional Commit subject naming the fix and
  no `Closes` footer: only an AFK issue's commit marks it done.
- The pull request body carries `Closes <owner>/<repo>#<n>` for the spec.
- A review run runs `/review-pr`, which posts each finding as a review thread on the
  pull request.
- A Fixer run runs `/implement` with instructions appended: work the review's threads,
  each checked against the current code first, and resolve each one it fixes.
- Every review run updates one summary comment on the pull request, carrying a score for
  how ready it is to merge. `/review-pr` defines the scale. The score informs; only open
  findings block.
- `/review-pr` caps the review runs a pull request gets and counts them in the summary
  comment. A last review that leaves findings open ends the alternation: the pull
  request stays a draft, and a human decides what happens to the open findings.

## Reasons

- Completion lives in commits and labels, never in open or closed state: only the merge
  may close an issue, and a sub-issue closed earlier reads as done while its code sits in
  an unmerged draft.
- The done marker is `Closes <owner>/<repo>#<n>`, so the merge that lands an AFK issue's commit also
  closes the issue.
- One pull request per spec: a pull request per sub-issue has the Reviewer judging
  fragments of one change.
- Sub-issues run as a graph: implementation time is the factory's bottleneck, and a
  series makes sub-issues that share no blocker wait on each other.
- One skill for every spec: a second skill for specs without sub-issues needs its own
  HITL stop, resume and pull request step.
- One resume path: the trigger label that starts a spec also resumes it, so a HITL stop
  needs no trigger of its own.
- The Implementer reviews its branch before the pull request exists, so no pull request
  opens on unreviewed work. The Reviewer's read is a second one, made for the maintainer.
- The cap counts reviews, not fixes, so the alternation always ends on a review: a
  last fix with no review after it leaves the pull request's final code unreviewed.
- The Fixer resolves the threads it fixes so the pull request's conversation reads
  resolved.
- The Fixer and the Upgrader reuse `/implement` because the skill stays as written: what a
  fix or an upgrade adds rides in the appended instructions.
- The Upgrader comments on the matched issue or pull request, not on the update's: the update
  merges and its conversation goes unread, while the link shows on both.
- A match is a shared upstream reference, not a shared package name: a package name alone
  matches issues the release does nothing for.
- An upgrade with no commit skips review: its diff is Renovate's version bump, which CI checks
  once the pull request is ready, and a review would only repeat the Upgrader's reading.
- The Upgrader's instructions name the outcome, not a list of changes: a release can ask any
  change of the code, and a list misses the next kind.
- `/create-spec` never triggers: a human reads a spec before an unattended run spends
  budget, and the skill stays usable in repos the factory does not serve.
- Merge stays human: the Reviewer has no track record yet.
- A changed decision or a wrong spec line goes to a human because the owner holds the
  one-way doors; by the pull request, the code already rests on the agent's call.
- This file is the only definition of the pipeline, so served repos carry no copy.

## Fences

- **A review cannot approve the pull request natively.** Every run acts as the factory
  owner's GitHub login, and GitHub refuses an author's approval of their own pull request,
  so a review with no findings is the approval. `apps/software-factory/src/session.ts:TRIGGERS`

- **Renovate's rebase checkbox drops the Upgrader's commits.** Renovate stops rebasing a
  branch once another author commits to it, and the checkbox recreates the branch from
  scratch. Re-apply `agent:upgrade` after ticking it. `apps/software-factory/src/session.ts:TRIGGERS`

## Where it lives

`apps/software-factory/src/session.ts` (`TRIGGERS`: the skill each trigger label starts), `skills/` (`create-spec`, `implement-spec`, `review-pr`,
`create-pr`), `.agents/skills/` (`grill-with-docs`, `implement`), `apps/software-factory/README.md` (Add a project: the labels a served repo needs).
