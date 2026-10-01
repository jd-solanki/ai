---
name: audit-project-context
description: Trim this repo's /project-context back to what the code cannot say, and flag code that drifts from it. Run it at the end of a pull request.
argument-hint: "[base ref, defaults to the merge-base with the default branch]"
disable-model-invocation: true
---

# Audit Project Context

A week of work leaves real knowledge and restatement side by side in
`/project-context`. Both arrived the same way. Only reading the code tells them apart.

The same week can move the code away from a decision: **drift**.

Built once by `/setup-project-context`. Changed through `/context-engineering`. Kept
honest by this.

## Separation of duties

Dispatch a fresh sub-agent for the audit itself. It wrote none of these lines, so it
owes none of them anything. You dispatch, join, and report.

Hand it the diff range and the paths. It reports; you present.

## The law

Invoke `/context-engineering` before anything else. It holds the law this skill enforces.
If it is not installed, stop and tell the user to install it. The sub-agent invokes it
too, as its first action.

## 1. Pin the range

- Context diff: `git diff <base>...HEAD -- skills/internal/project-context/ CONTRIBUTING.md`
- Code diff: `git diff <base>...HEAD` minus the context paths.

Three dots, so the comparison runs against the merge-base. `$ARGUMENTS` sets the base;
without it, use the merge-base with the default branch.

Two empty diffs end the run. Say so and stop.

## 2. Judge every added line against the code

**Open the code before you judge the line.** A line that reads like real knowledge and
a line that restates a function body look identical in prose. Only the file tells you
which one you have.

For each added line, find what it describes and read it. Then it is one of three:

- **Keep** — the code cannot say it. A word the project fixes, a rule no tool
  enforces, a reason, or a fence.
- **Cut to a link** — the code says it. Delete the prose. Add the path under **Where
  it lives** if it is missing.
- **Cut** — it earns nothing under **What earns a line**.

**Done when** every added line carries a verdict and the `file:line` that settled it.
A verdict with no location is a guess, and a guess keeps garbage.

## 3. Check the code against the context

A domain governs the code under its **Where it lives** paths. For each domain the code
diff touches, read its **Rules**, **Reasons** and **Fences**, then read the changed
code. Each one either holds or has drifted.

Drift is the owner's call. Put both options to them:

- **The code is wrong.** Fix the code.
- **The decision changed.** The owner states the new decision, and it goes into the
  domain file in their words, with its `confidence:` word if that moved too.

A diff that enters code no domain governs gets the same question: does it carry a
decision the context is missing?

**Done when** every touched domain carries a verdict, and every drift carries the
`file:line` of the code and of the context line it breaks.

## 4. Check the shape

Hold every context file against **The shape**, **Domains**, **A domain file** and **Live
and record** in `context-engineering`.

**Done when** every rule there has been applied to every file.

## 5. Apply and report

Make the cuts. Then say:

- How many lines went, per file.
- The three biggest cuts, each with the `file:line` that proved it was restatement.
- Every drift, with both `file:line`s and the two options.
- Every fence still missing a reason.

Drift and missing reasons are the owner's to answer, and they are the only things here
that block.
