---
name: implement-spec
description: Deliver a spec filed by /create-spec. Its AFK issues are built in parallel on the spec branch, reviewed, and opened as one draft pull request.
argument-hint: "[the spec's issue URL or number]"
disable-model-invocation: true
---

# Implement Spec

The sister of `/create-spec`. That skill files a spec; this one delivers it, as one draft
pull request from the **spec branch**.

You run **AFK**. Nobody answers a question, so a question becomes a HITL issue (see
**A stop for a human**) and the run carries on with whatever does not wait on it.

You are the orchestrator: subagents write the code, you hold the **frontier**. Brief a
subagent with **context pointers** (the spec, its sub-issue, the notes folder, a commit),
never with text those already hold.

## Words

- **Spec**: the issue labelled `issue:spec`. Its **sub-issues** are its native GitHub
  children, `issue:AFK` for an agent and `issue:HITL` for a human, each blocked by the
  siblings it waits on. A spec with no AFK sub-issue is its own AFK issue, blocked by
  every HITL sub-issue it has.
- **Spec branch**: `spec/<n>`, `<n>` being the spec's number. The pull request comes
  from it.
- **Done set**: the sub-issues that count as done. An AFK issue is done when a commit on
  the spec branch, and not on the default branch, has a message ending in
  `Closes <owner>/<repo>#<its number>`. A HITL issue is done when it carries `issue:HITL-done`. Open or
  closed state never counts: only the merge closes an issue.
- **Frontier**: the sub-issues outside the done set whose blockers are all inside it.

## Steps

### 1. Take the spec branch

It exists on the remote when `/create-spec` pushed records: switch to it. Otherwise cut
it from the default branch.

**Done when:** `HEAD` is the spec branch, level with the remote's copy when there is one.

### 2. Read the graph

Read the spec and every sub-issue: its body, its `issue:` label, and its blockers.
Blockers are native GitHub dependencies, `blockedBy` in `gh issue view --json`, never
text in a body. Then read the done set off the spec branch's commits and the labels.

A run that was started again resumes here: the done set is the only memory.

**Done when:** every sub-issue is AFK or HITL, has its blockers listed, and is in or out
of the done set.

### 3. Explore, when the frontier needs it

One exploration subagent reads the code and docs the AFK issues touch and saves markdown
notes in a folder outside the repo, so every implementer starts from findings.

### 4. Work the frontier

**The spec is its own AFK issue:** build it yourself on the spec branch with `/tdd`, as
one commit whose subject is the spec's title and whose message ends in `Closes <owner>/<repo>#<n>`.

**Otherwise** start one implementer subagent per AFK issue on the frontier, all at once,
in the background, each in its own worktree on its own branch. An implementer:

- starts from the spec branch's tip, resetting onto it when its worktree is based
  elsewhere;
- builds its AFK issue with `/tdd`;
- merges the spec branch's tip into its own branch, with the repo's checks passing, before
  it reports;
- reports `done`, or `blocked` with the question it would have asked.

Land each `done` branch with a merger subagent, one landing at a time. A landing is a
squash onto the spec branch: one commit, its subject the sub-issue's title, its message
ending in `Closes <owner>/<repo>#<n>`. That commit is the done marker. Push after every landing.

Every landing moves the frontier. Read it again and start what became ready.

**Done when:** the frontier is empty, or it holds only HITL issues and no implementer is
running.

### 5. Review

Skip to **A stop for a human** when HITL issues are left.

Run `/code-review` on the spec branch, against the default branch. One implementer fixes
what it finds. A review fix is its own commit, with a Conventional Commit subject naming
the fix and no `Closes` footer.

**Done when:** every finding is fixed or answered, the repo's checks pass, and the spec
branch is pushed.

### 6. Open the draft

Open the pull request with `/create-pr`. Its title is the spec's title, and its body
carries `Closes <owner>/<repo>#<n>` for the spec. It stays a draft.

Then remove every implementer worktree and branch.

**Done when:** the draft's link is in your last message.

## A stop for a human

File a HITL issue when an implementer reports `blocked`, when a decision recorded in
project context has to change, or when a line of the spec is wrong:

```bash
gh issue create --parent <spec> --label issue:HITL --blocking <the sub-issues that wait on it> \
  --title "<what the human decides or does>" --body-file <hitl.md>
```

Its body says what the human does and ends: "Apply `issue:HITL-done` when finished." An
issue that blocks the spec itself drops `--blocking`.

Carry on with the rest of the frontier. When only HITL issues are left, comment on the
spec: each open HITL issue, and that the run resumes once each carries `issue:HITL-done`
and the spec is started again. Mention whoever started the run, when you were told who.
Then stop, with no review and no pull request.
