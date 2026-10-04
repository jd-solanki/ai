---
name: setup-project-context
description: One-time bootstrap of this repo's agent context — CONTRIBUTING.md, a /project-context router skill, and one reference file per domain — drafted from the code when no context exists yet.
disable-model-invocation: true
---

# Setup Project Context

Invoke `/context-engineering`. It holds the shape this skill builds and the law every
file obeys. If it is not installed, stop and tell the user to install it.

This skill runs once, in a repo with no `skills/internal/project-context/`. The context
should have come first, so the code is the only draft left: mine it, and the owner
answers only what the code cannot say. Later decisions go through
`/context-engineering`, and `/audit-project-context` keeps the result honest.

## 1. Survey

If `skills/internal/project-context/` exists, stop. Tell the user the context already
exists: `/context-engineering <decision>` records a change, and
`/audit-project-context` keeps it. This skill does not run twice.

Read what is already there: `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `CLAUDE.md`,
`CONTEXT.md`, `docs/`, `package.json` and `skills/`. Run `git remote -v`.

**Done when** you can name every agent-facing doc in the repo and say which tier it
belongs in.

## 2. Mine

The slowest step and the one that carries the skill. Empty files are the failure mode.

Everything mined is a **draft**. The code shows what exists, never whether it was
intended. A draft becomes context only when the owner confirms it in step 4.

Dig in every seam:

- `git log` — reverts, and commits that undo an earlier choice.
- `rg -n 'TODO|HACK|FIXME|workaround|deliberately|intentionally|on purpose'`
- Skipped and disabled tests: `.skip`, `xit`, `it.todo`, `test.todo`.
- Commented-out code, dead flags, config that departs from the default.
- Closed issues and merged pull requests, through `gh`, when the remote is GitHub.

Every candidate fence gets a `file:symbol`. Grep hands you a line number; carry the
enclosing symbol instead, because the fence outlives the line.

**Done when** every candidate carries a location. A fence with no location is a guess.

## 3. Propose the domains

**This skill ships no domain list.** Every repo has its own. Read the repo, propose a
list that obeys **Domains**, with one line each, and wait for approval.

**Done when** the user has approved the list.

## 4. Interview

The code shows the *what*. Only the owner holds the *why*, and only the owner turns a
draft into a decision. Take one domain at a time. Skip every question the code already
answers.

A draft the owner rejects is not context. Ask whether the mining misread the code, or
the code breaks the owner's decision. Record the second kind for the report.

Apply both admission tests before proposing text. Record the candidates you drop so the
owner can distinguish deliberate pruning from an incomplete survey.

Ask each domain's `confidence:` word outright.

**Done when** every surviving fence carries a reason in the human's own words, and every
domain has a confidence word the owner chose.

## 5. Write

Write each file from `TEMPLATES.md` in `context-engineering`:

- `CONTRIBUTING.md`
- `skills/internal/project-context/SKILL.md`
- `skills/internal/project-context/glossary.md`
- `skills/internal/project-context/domains/<domain>.md`, one per domain
- `README.md`, cut back to pointers

Rehome the scattered docs. **Move the text. Never copy it.** A root `CONTEXT.md`
becomes `glossary.md`, less the terms that belong to one domain's **Words**.
`docs/agents/*` becomes domain files, and the folder goes. `docs/adr/` and
`docs/research/` stay where they are. Move each `docs/design/` file to whichever it
really is: an ADR, or a domain file.

**Done when** every line of the old files is moved into exactly one domain file,
replaced by a link, or deleted with the reason said out loud to the user.

## 6. Drain

`AGENTS.md` / `CLAUDE.md` keeps behaviour. Everything about *this* project moves into
a domain file.

Edit the file that already exists. If `CLAUDE.md` exists, edit it. Else edit
`AGENTS.md`. If neither exists, ask which to create.

Add the `## Project context` section from `TEMPLATES.md`. If the file already has that
section, replace it in place. Other skills own other sections in this file; leave theirs
alone.

**Done when** every remaining section either holds true in an unrelated repo, or is
the gate.

## 7. Link

Ask the user to run `/link-skills project-context`. Once they have, read `SKILL.md` back
through every new symlink to confirm it resolves.

## 8. Report

Say plainly:

- Which domains were written, and how many fences each holds.
- Which domains came out thin, so the user knows where the context is still weak.
- Which fences were dropped, and why.
- Every draft where the code breaks the owner's decision, with its `file:line`: code to
  fix.
- How many lines `AGENTS.md` lost.
