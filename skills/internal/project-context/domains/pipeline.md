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

**Implementer**, **Reviewer**, **Fixer**, **Upgrader**, **Verifier**:
The agents that `agent:implement`, `agent:review`, `agent:fix`, `agent:upgrade` and
`agent:verify` request.

**QA scenario**:
One checkbox under a pull request body's `## QA steps`: a behaviour to try by hand, with
numbered steps, each naming the result to see.
_Avoid_: test case, test plan, verification step

**Dependency update**:
A pull request that bumps dependency versions and carries their release notes in its body,
as Renovate opens one.

**Verdict**:
How a review or QA run ended: a review's `dry`, `tasks` or `ended`, a QA run's `pass`, `fail` or
`ended`.
_Avoid_: result, review status

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
  5. The Implementer exits, and static code hands the draft to the Reviewer. Review runs and
     Fixer runs alternate until a review comes back dry, which is the approval: `/review-pr`
     defines dry, and files what the review leaves for later as one follow-up. The Reviewer then rewrites the pull
     request body with `/create-pr`, keeping every `Closes` line. Static code hands it to the
     Verifier when the body holds a QA scenario, and marks it ready for review when not.
  6. The Verifier runs `/verify-pr`: it tries every QA scenario, ticks the ones that pass unless
     the run fails, and posts each failure as a review thread. A pass marks the pull request
     ready for review. A fail goes to the Fixer, then the Reviewer, then the Verifier again.
  7. A human tries any QA scenario left unticked, merges, then does the Owner steps.
- A dependency update enters the pipeline at its pull request: a teammate applies
  `agent:upgrade`, which acts only on a pull request carrying `⬆️ Renovate`. The Upgrader
  runs `/implement` with instructions appended: the release notes are the spec, and the code
  ends as it would read had it been written against the new versions. With commits, it pushes
  them onto the update's branch, static code hands it to the Reviewer, and stage 5 follows.
  With none, static code marks the pull request ready for review. Renovate's body stays: it carries the
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
- Every spec carries `issue:spec`, a follow-up `issue:follow-up` instead, and
  `agent:implement` acts only on an issue that carries one of them. Every sub-issue lives
  in the spec's repository and carries exactly one of `issue:AFK` or `issue:HITL`.
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
- The Implementer delivers a follow-up as a spec with no sub-issues. `/implement-spec`
  defines how it checks the follow-up's items first.
- A review of a pull request that closes a follow-up files no follow-up.
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
- Static code hands a work item on at its run's clean stop, from what GitHub shows then; a
  crash hands nothing on. A run with no next step on GitHub waits on whoever applied its
  trigger label.
- A review run's verdict is the one `/review-pr` writes into its summary comment, and a QA run's
  the one `/verify-pr` writes into its QA comment.
- A pull request is marked ready only after a dry review of its current head and, when its body
  holds QA scenarios, a passing QA run since; an upgrade with no commits skips both. Every fix
  goes back through review, a fix for QA included.
- A QA scenario ends `pass`, `fail` or `blocked`. A blocked one, which needs what the factory
  machine lacks, holds back nothing: it stays unticked for the human.
- A tick means the scenario passed on the pull request's current code. `/create-pr` writes every
  box unticked, so the Reviewer's rewrite clears them and the QA run that follows sets them.
- `/verify-pr` caps QA runs as `/review-pr` caps reviews: a last run that still fails ends QA,
  and a human decides.

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
- Merge stays human for every pull request, Renovate's included: auto-merge was built and
  dropped for security. jd-solanki/ai#24 holds the design.
  - It gated on a dry review scored 10/10, or an untouched update the Upgrader said needed
    nothing, then on Renovate's author `app/renovate`, a ruleset requiring checks and a pinned
    head. None of those gates closes what follows.
  - A 10/10 is an LLM's reading of code agents wrote from text anyone can write into: issues,
    comments, upstream release notes. A prompt injected there steers the code and its score.
  - Narrowed to Renovate's pull requests, it still merges a compromised release unread: a
    hijacked package builds and passes CI.
  - GitHub's auto-merge waits only on required checks, and may check the pinned head only when
    it is enabled, so a later push from any account with write access merges unread.
  - The Reviewer has no track record yet.
- The hand-off is static code's because a session told to hand off as its last action, at the
  end of a long run, forgets, and auto mode refused one it never saw requested. A session
  writes only what needs a model: code, findings, a pull request body, a HITL issue.
- The verdict is a marker written for static code, not read off the summary's prose or the
  threads: the Tasks heading's mark ignores Unproven findings and failed checks, and a thread
  the Reviewer accepts after a Fixer's `blocked` reply stays unresolved.
- A Fixer run with no commits still goes to the Reviewer: its `blocked` replies need judging.
- Waiting on a human is an assignment, which queues the work item under the human's assigned
  items: every factory write runs as the factory owner, so the factory's mention never
  notifies the owner. What static code tells them goes in one factory comment per work item,
  edited in place, so retries and waits never pile up.
- A follow-up's items are checked, not trusted: an agent wrote them, some unproven, and the
  code may have moved since.
- A follow-up's pull request files no follow-up of its own, or each would breed the next, as
  jd-solanki/ai#26 did. What it leaves stays in its summary, for the human who merges.
- A changed decision or a wrong spec line goes to a human because the owner holds the
  one-way doors; by the pull request, the code already rests on the agent's call.
- This file is the only definition of the pipeline, so served repos carry no copy.
- QA runs after a dry review, not before: a review's fixes would change the code a QA run had
  passed.
- A QA failure is a review thread so the Fixer and the Reviewer's fix-verify work it as they
  work a review's, with its done and blocked replies. The cost: its anchor is the Verifier's
  guess at the line responsible.
- The QA report is its own comment, not a section of the review summary: each skill rewrites its
  comment whole, and either runs without the other.
- Blocked scenarios do not hold ready back: ready asks for a human anyway, and an unticked box is
  the list of what they try before merging.

## Fences

- **A review cannot approve the pull request natively.** Every run acts as the factory
  owner's GitHub login, and GitHub refuses an author's approval of their own pull request,
  so a review with no findings is the approval. `apps/software-factory/src/hand-off.ts:NEXT_STEPS`

- **Renovate's rebase checkbox drops the Upgrader's commits.** Renovate stops rebasing a
  branch once another author commits to it, and the checkbox recreates the branch from
  scratch. Re-apply `agent:upgrade` after ticking it. `apps/software-factory/src/session.ts:TRIGGERS`

- **A dry round never reaches the review cap.** The cap counts rounds that leave tasks, so a dry
  review handed back to review whenever its reviewed commit can't be read would loop unwatched. A
  summary with no readable commit waits on a human. `apps/software-factory/src/hand-off.ts:reviewedHead`
- **A file-level review comment opens a review of its own.** GitHub files a `subject_type: file`
  comment apart from the review it was posted with, so the Fixer's "threads of the last review"
  would miss the rest. Every QA thread sits on a changed line. `skills/in-progress/verify-pr/SKILL.md`

## Where it lives

`apps/software-factory/src/session.ts` (`TRIGGERS`: the skill each trigger label starts),
`apps/software-factory/src/hand-off.ts` (`NEXT_STEPS`: where each run hands its work item), `skills/` (`create-spec`, `implement-spec`, `review-pr`,
`create-pr`, `verify-pr`), `.agents/skills/` (`grill-with-docs`, `implement`), `apps/software-factory/README.md` (Add a project: the labels a served repo needs).
