# Sessions

confidence: exploratory — how a session is launched (`claude --bg`, or a one-shot
`claude -p`) and how far the session boundary goes are still open.

## Words

**Session boundary**:
The line between what a session may do and what static code does.
_Avoid_: sandbox

## Rules

- The session boundary is a direction: a session changes code, and static code runs git
  and writes to GitHub.
- The pipeline's skills run as written and the factory adapts to them: `/implement`
  commits to the current branch, `/create-pr` pushes and opens the draft pull request,
  and `/review-pr` checks out the pull request and posts its own review.
- Where static code takes over a git or GitHub write, it derives the text from GitHub: a
  sub-issue's title is the commit subject, and the spec's title is the pull request
  title. A session writes no meta file for static code to read.

## Reasons

- The session boundary has three reasons:
  - A model deciding the walk, a commit or a label can skip or mis-mark a step; code
    cannot. The done set and the labels must be deterministic for a re-trigger to resume
    correctly.
  - A session runs unattended with the owner's `gh` and git credentials.
  - A session that only edits code spends its context on the code.
- The boundary gives way to the skills: they already run git and `gh`, so the factory
  starts from them.
- Review runs at higher effort than implementation: review depth decides how many rounds
  a pull request takes, and implementation time is the factory's bottleneck.

## Fences

- **A Stop hook is not a done edge.** Stop fires after every turn, so a turn that ends on
  a question looks like a finished session. `server.ts:runOnStop`
- **A worktree holds only committed files.** A skill a session needs must be committed and
  pushed in the served repo, or the session starts without it. `server.ts:claudeArgs`

## Where it lives

`server.ts` (`TRIGGERS`: each agent's skill and effort; `claudeArgs`: how a session is
launched), `README.md` (Conventions for every project: what a served repo must hold).
