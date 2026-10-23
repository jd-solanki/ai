# Sessions

## Words

**Session boundary**:
The line between what a session may do and what static code does.
_Avoid_: sandbox

**Repo workspace**:
A herdr workspace with a pane at a served repo's clone, where that repo's runs open as tabs.
_Avoid_: run workspace, project workspace

**Clean stop**:
A Stop with no background work left in the session, and neither a turn nor an exit in the wait after it.
_Avoid_: done, finished

**Crash**:
A run whose session exits before a clean stop.
_Avoid_: failure

## Rules

- The session boundary is a direction: a session changes code, and static code runs git
  and writes to GitHub.
- A step static code can decide from GitHub or the run's own facts is static code's; a
  session gets only what needs a model.
- The pipeline's skills run as written and the factory adapts to them:
  `/implement-spec` merges onto the spec branch and opens the draft pull request through
  `/create-pr`, and `/review-pr` checks out the pull request and posts its own review.
- The session owns the walk: `/implement-spec` reads the frontier from GitHub's blockers
  and the done set. Static code never orders sub-issues.
- Where static code takes over a git or GitHub write, it derives the text from GitHub: a
  sub-issue's title is the commit subject, and the spec's title is the pull request
  title. A session writes no meta file for static code to read.
- A run ends at its clean stop: static code closes the run's tab, releases the claim
  and hands the work item on. A turn that ends on a question in the terminal is a clean stop too.
- The factory server alone decides how a run ends. A session's hooks only report
  UserPromptSubmit, Stop, StopFailure and SessionEnd to it.
- A crash releases the claim and asks whoever applied the trigger label to apply it again.
- A session writes on GitHub only what its skill and its trigger's instructions write. What a
  human must do or decide goes in there, mentioning them.

## Reasons

- The session boundary has three reasons:
  - A model deciding a working label can mis-mark a claim; code cannot. The claim must be
    deterministic for a re-trigger to resume correctly.
  - A session runs unattended with the owner's `gh` and git credentials.
  - A session that only edits code spends its context on the code.
- The boundary gives way to the skills: they already run git and `gh`, so the factory
  starts from them.
- The hand-off follows the boundary: static code picks the next step from GitHub, as
  `pipeline.md` says.
- The walk stays in the session because its inputs live on GitHub and the spec branch: a
  re-trigger recomputes it, so a mis-step costs one re-run, and a walk in static code
  rebuilds what `/implement-spec` already does.
- The `claude` command is built and run in one module: settling how a session is launched
  changes that module alone.
- A session runs as an interactive `claude` in a herdr tab, not a background session,
  so the owner sees every run in herdr's agent list beside their own herdr agents, and can watch it.
- A run's tab opens in the repo workspace, so a served repo's runs sit beside the owner's own
  tabs for it instead of each in a workspace of its own.
- Review runs at higher effort than implementation: review depth decides how many rounds
  a pull request takes, and implementation time is the factory's bottleneck.
- Every session runs in auto mode, whatever the owner's default: each trigger's `allow` and
  instructions assume it, and under a manual default a run stops at its first approval prompt.
- Closing the tab makes a run last as long as its process, so a released run cannot
  wake up again without a claim. herdr's state cannot mark the end instead: herdr itself
  says `idle` and `done` do not prove completion.
- `blocked` keeps the claim with no code: herdr shows it only while a dialog is up, inside a
  turn, and Stop fires only after a turn ends.
- A session posts no wrap-up comment because it repeats, once per round, the record its skill
  already keeps on the work item.
- A terminal question ends the run because a session is told nobody answers there: what it
  needs goes on the work item, and a re-trigger resumes from the worktree.
- A Stop with no background work waits for another turn before it counts as clean, because
  `background_tasks` lists only running work: a subagent that finished during the turn shows
  nowhere, yet its queued result starts the next turn once the Stop hook returns.
  jd-solanki/ai#30 holds three runs it ended early. Static code answers the Stop first and
  waits after, because the session takes no turn while its Stop hook runs.
- The server owns a run's end so one place picks the release and the crash in tested code.
  The cost: an end reported while the server is down, or after it restarted, leaves the claim
  held, because the server keeps its runs in memory.
- A crash is caught by SessionEnd, not by watching herdr. SessionEnd fires when herdr closes
  the tab or stops, so only `kill -9`, a power loss or a stopped factory server leave
  the working label on, and a human removes it.
- The pane's shell reports SessionEnd too, once claude exits: a claude that exits before its
  hooks load, such as in an untrusted folder, reports nothing. After a normal end that second
  report finds no run.
- A run tab herdr restores after a restart is left alone: its run already crashed on
  shutdown, and it comes back as a shell with no session and no claim.
- Each run reports under a random token because the server's port is public, behind
  Tailscale Funnel: the token is what stops anyone else ending a run.

## Fences

- **Stop alone is not a clean stop.** Stop fires after every turn, so a turn that ends on a
  wait for subagents or a background shell looks like the end of the run, and so does one whose
  last subagent finished during it. A turn that dies on an API error never reaches Stop at all.
  `apps/software-factory/src/run-end.ts:handleRunReport`
- **A UserPromptSubmit hook's output joins the prompt.** Claude Code adds its stdout to the
  session's context, so that hook drops the server's reply. `apps/software-factory/src/session.ts:hooks`
- **Closing a run's tab fires its SessionEnd.** herdr's close ends the session with
  reason `other`, the same as a crash, so the server ignores an end from a run it already
  released. `apps/software-factory/src/run-end.ts:handleRunReport`
- **Closing a run's workspace closes the owner's tabs.** A run's tab shares the repo workspace
  with the owner's own, so a run's end and a failed launch close the tab alone. herdr removes a
  workspace the factory opened along with its last tab. `apps/software-factory/src/session.ts:closeTab`
- **A worktree holds only the default branch.** A skill a session needs must be pushed to the
  served repo's default branch, or the session starts without it. Claude Code branches a
  worktree from the clone's checkout under the owner's `worktree.baseRef: head`, so the factory
  pins `fresh`. `fresh` reads the clone's `origin/HEAD`, which moves only on a fetch and keeps
  the default branch it was cloned with, so `startSession` fetches and runs `set-head` first.
  `apps/software-factory/src/session.ts:claudeArgs`
- **Auto mode refuses a command it never saw requested.** Instructions arrive in the
  appended system prompt, which the classifier does not count as a request, so it denied
  `gh pr ready` as unrequested. A trigger's `allow` grants what its instructions need.
  `apps/software-factory/src/session.ts:TRIGGERS`
- **`herdr agent start` never returns for a working session.** It waits until the agent is
  ready for input, and a session working on its prompt is not, so after 30 seconds it timed
  out and the factory closed a healthy run. The factory types the command into the pane
  instead, once the shell's prompt is up. `apps/software-factory/src/session.ts:startSession`
- **herdr's `idle` is not the end of a run.** A turn that ends while the session's own
  background shell runs shows `idle`, then `working` again when the session resumes by itself.
  A run never ends on herdr's state. `apps/software-factory/src/run-end.ts:handleRunReport`
- **Static code's `gh` acts as whichever account its directory names.** The owner's `gh`
  picks the account matching the directory's git `user.name`, so a call from the server's own
  directory acted as the wrong account and could not see a private served repo. Every `gh`
  call for a run passes the served repo's clone as its `cwd`. `apps/software-factory/src/session.ts:gh`

## Where it lives

`apps/software-factory/src/session.ts` (`TRIGGERS`: each agent's skill and effort; `claudeArgs` and
`startSession`: how a session is launched), `apps/software-factory/src/run-end.ts` (`handleRunReport`:
how a run ends), `apps/software-factory/README.md` (Conventions for every project:
what a served repo must hold).
