---
name: context-engineering
description: Shared reference for project context — its shape and the law every file obeys. Invoked by name from /setup-project-context and /audit-project-context.
argument-hint: "[a decision to record]"
---

# Context Engineering

## Two ways in

- **Another skill invoked you.** This file is reference. Go back to that skill's steps.
- **The user typed `/context-engineering`.** Their decision: `$ARGUMENTS`. If that is
  empty, ask for it. Then read [`UPDATE.md`](./UPDATE.md) and follow it.

Read [`TEMPLATES.md`](./TEMPLATES.md) before you write any context file.

Invoke `/domain-modeling` before you write a **word** or an **ADR**. It owns both
formats, so this skill does not restate them. A rule, a reason, a fence or a path needs
nothing from it. If it is not installed, stop and tell the user to install it.

## Upstream of the code

```text
project context & decisions → codebase → human docs
```

The owner decides in the context. The code implements the decision. Human docs explain
the result.

Code that disagrees with the context is **drift**: either the code is wrong, or the
decision changed and nobody wrote it down. Only the owner knows which. Leave the context
as it is until the owner answers; rewriting a decision to match the code turns drift into
a decision nobody made.

## The shape

| Tier | File | Loads |
| --- | --- | --- |
| 1 | `AGENTS.md` / `CLAUDE.md` | every turn — behaviour and the gate |
| 2 | `CONTRIBUTING.md` | every session — what the project is, its status, how to contribute |
| 2 | `skills/internal/project-context/SKILL.md` | every session — the rules and the table |
| 2 | `glossary.md` | every session — the words used across domains |
| 3 | `domains/<domain>.md` | only when the task enters that domain |
| — | `docs/` | by link only — the decisions and investigations behind a reason |
| — | `README.md` | humans only — pointers out |

Context splits by **domain**, never by document type. A task about environments reads
one file, not four.

The router table lists every file in `domains/`, and every row's `load-when` names tasks
rather than topics.

A term used across domains goes in `glossary.md`. A term used inside one domain goes in
that domain file's **Words**.

## What earns a line

**A doc earns a line only if the code cannot say it.**

Correctness alone does not earn context. Keep a fact only when omitting it could plausibly cause an
agent to make a costly wrong decision before nearby code or tests expose the mistake. Otherwise,
leave it beside the implementation or list only its path under **Where it lives**.

Write the enduring invariant: the intended outcome, ownership boundary, state transition, safety
property, or failure policy. Prefer that over current symbols, files, call sequences, or wiring. A
sentence that becomes false after an ordinary rename, move, or implementation refactor is usually
too low-level. Library and vendor names belong only when the owner has selected the name itself as a
durable architectural constraint.

Those are the two **admission tests**: would omission permit a costly mistake, and would
the sentence survive an implementation refactor?

Git holds the history and `package.json` holds the commands. Both are sources of truth
already; point at them.

A changelog entry, a feature checklist, or a rule another domain file already owns earns
nothing.

## Domains

- A domain is a subject a task is **about**, not a folder.
- Name the file and heading with the repository's glossary terms. A name must tell an
  agent what work loads it; generic containers such as `lifecycle`, `management` or
  `platform` earn their place only when the glossary gives them a project-specific meaning.
- Preserve a module's boundary when it owns a cohesive product domain. A task that crosses
  domains loads multiple files; crossing them is not a reason to merge them under an umbrella.
- Two domains that always load together are one domain.
- A domain earns a file once it holds at least one fence or one non-obvious reason.
  Below that bar it is an empty heading pretending to be context.
- A file heading past ~150 lines is two domains, or it is restating code.

For example, a Nuxt project may have `layer-auth` owning identity and access,
`layer-payments` owning Orders and payment collection, and `layer-email` owning email
delivery. Write `identity-and-access.md`, `payments.md` and `email-delivery.md`. A checkout
task that emails a receipt loads all three. Do not hide their ownership in a
`customer-lifecycle.md` umbrella.

## A domain file

Five sections, nothing else, plus a `confidence:` line under the heading when the domain
is not settled. Its `load-when` lives only in the router table.

- **Words** — terms used only inside this domain.
- **Rules** — conventions no linter or type checker enforces.
- **Reasons** — why this shape was chosen, when the code cannot show it.
- **Fences** — the trap, where it bites (`file:symbol`), and why the fence stands.
- **Where it lives** — paths. Everything you were about to explain goes here instead.

A fence with no reason teaches the next agent to guess. Ask the owner for the reason, or
drop the fence.

`file:symbol` is the path plus the enclosing symbol — function, class, constant, a heading
in prose, or the path alone. Never a line number: it rots on the next edit above it, then
points somewhere wrong without saying so. A report may still carry one; it is read the
minute it is written.

### Confidence

A `confidence:` line states how far the reader should trust the file: one of three words,
then a short clause naming what is still moving.

| `confidence:` | Write it when the owner can defend |
| ------------- | ---------------------------------- |
| `settled`     | this shape, in review              |
| `provisional` | the direction, but not the detail  |
| `exploratory` | neither — they are still guessing  |

`settled` is the default, so only a shaky file carries the line. Write the word the owner
says, never the one the prose sounds like.

The router tells the reader what to **do** with each word, and when the word moves. A
domain file never repeats that.

## Live and record

A domain file is **live**: it is pruned, or it rots. `docs/adr/` and `docs/research/`
hold the **record**: what was decided and what was found, each fixed to the moment it
happened. A record is never pruned, so the two stay apart.

A domain file's **Reasons** links the decision or investigation behind it. That link is
the only way an agent reaches the record.