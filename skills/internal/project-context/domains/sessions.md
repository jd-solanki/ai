# Sessions

confidence: provisional — how a session is launched (`claude --bg`, or a one-shot
`claude -p`) is still open.

## Words

**Session boundary**:
The line between what a session may do and what static code does.
_Avoid_: sandbox

## Rules

- The session boundary is a direction: a session changes code, and static code runs git
  and writes to GitHub.
- The pipeline's skills run as written and the factory adapts to them:
  `/implement-spec` merges onto the spec branch and opens the draft pull request through
  `/create-pr`, and `/review-pr` checks out the pull request and posts its own review.
- The session owns the walk: `/implement-spec` reads the frontier from GitHub's blockers
  and the done set. Static code never orders sub-issues.
- Where static code takes over a git or GitHub write, it derives the text from GitHub: a
  sub-issue's title is the commit subject, and the spec's title is the pull request
  title. A session writes no meta file for static code to read.

## Reasons

- The session boundary has three reasons:
  - A model deciding a working label can mis-mark a claim; code cannot. The claim must be
    deterministic for a re-trigger to resume correctly.
  - A session runs unattended with the owner's `gh` and git credentials.
  - A session that only edits code spends its context on the code.
- The boundary gives way to the skills: they already run git and `gh`, so the factory
  starts from them.
- A hand-off is the session's: only it knows the outcome that picks the next agent. A
  skipped hand-off stalls in plain sight, as a pull request with no `agent:*` label.
- The walk stays in the session because its inputs live on GitHub and the spec branch: a
  re-trigger recomputes it, so a mis-step costs one re-run, and a walk in static code
  rebuilds what `/implement-spec` already does.
- The `claude` command is built and run in one module: settling how a session is launched
  changes that module alone.
- Review runs at higher effort than implementation: review depth decides how many rounds
  a pull request takes, and implementation time is the factory's bottleneck.

## Fences

- **A Stop hook is not a done edge.** Stop fires after every turn, so a turn that ends on
  a question, or on a wait for subagents, looks like a finished session.
  `apps/software-factory/src/session.ts:runWhenIdle`
- **A worktree holds only the default branch.** A skill a session needs must be pushed to the
  served repo's default branch, or the session starts without it. Claude Code branches a
  worktree from the clone's checkout under the owner's `worktree.baseRef: head`, so the factory
  pins `fresh`. `fresh` reads the clone's `origin/HEAD`, which moves only on a fetch and keeps
  the default branch it was cloned with, so `startSession` fetches and runs `set-head` first.
  `apps/software-factory/src/session.ts:claudeArgs`
- **Auto mode refuses a hand-off it never saw requested.** The hand-off arrives in the
  appended system prompt, which the classifier does not count as a request, so it denied
  `gh pr ready` as unrequested. A trigger's `allow` grants what its hand-off needs.
  `apps/software-factory/src/session.ts:TRIGGERS`

## Where it lives

`apps/software-factory/src/session.ts` (`TRIGGERS`: each agent's skill and effort; `claudeArgs` and
`startSession`: how a session is launched), `apps/software-factory/README.md` (Conventions for every project:
what a served repo must hold).
