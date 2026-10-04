# Context engineering

How this repository gives an AI agent the context a human already walks in with, and
why it is shaped the way it is.

The method ships as three skills. `/context-engineering` holds the shape and the law,
and records a decision when the owner calls it. `/setup-project-context` builds a
repository's context; `/audit-project-context` keeps it honest. Those skills hold the
**steps**. This document holds the **reasons**, so read it before you change the shape of
any of them.

## The problem

A human walks into a project already holding it: what it is for, why a thing is built
the way it is, which bit is broken on purpose. An agent walks in holding coding
guidelines and nothing else. It then works like a contractor who never read the brief.

Most repos already write this knowledge down. They scatter it. One fact about
environments sits in `AGENTS.md`, in a glossary, in an ADR, and in a doc under
`docs/`. The agent must find all four, or it misses a fence and does the obvious thing
that breaks production.

## Context is upstream of the code

```text
project context & decisions → codebase → human docs
```

A decision comes first. The code implements it. Human docs explain the result. So when
the code and the context disagree, the context is not simply stale: either the code is
wrong, or a decision changed without being written down. Only the owner can say which,
so the audit asks instead of rewriting.

Mining the code runs only once, when a repo has no context at all. There the code is
the only draft left, and mining it spares the owner every question the code can
answer. Every mined line stays a draft until the owner confirms it as a decision.

## Split by domain, not by document type

A **domain** is a subject a task is about: environments, deploys, auth. Everything
about one subject goes in one file — its words, its rules, its reasons, its traps.

The alternative is to split by _type_: a glossary here, ADRs there, conventions
somewhere else. That scatters one subject across three folders. Read two of the three
and the miss is silent.

One subject, one file. There is nothing left to miss.

## Three tiers, three prices

| Tier                                        | Price                                     |
| ------------------------------------------- | ----------------------------------------- |
| `AGENTS.md` / `CLAUDE.md`                   | paid every turn                           |
| `CONTRIBUTING.md`, the router, the glossary | paid once a session                       |
| a domain file                               | paid only by tasks that enter that domain |

So tier 1 holds only what is true in any repo: behaviour, and the one gate that
reaches the rest. A 200-line `AGENTS.md` full of this project's deploy rules charges
every turn for knowledge most turns never use.

## The router is the loader

A file in `docs/` has no loader. Nothing decides when to read it, so the agent either
browses everything or guesses. The router's table is that decision, written down:
every reference with a `load-when` beside it.

A domain file does not repeat its own `load-when`. An agent reads the file only after the
table has made that choice, so a copy inside the file does no work and can drift from the
table.

The table can name **any path in the repo**. Living inside the skill folder is not
what makes a file loadable. So placement is decided by a different question: who owns
the file.

- Owned by another skill → leave it there. The table links it.
- Owned by humans, as a record → `docs/`. A domain's **Reasons** links it.
- Owned only by this context system → `domains/<domain>.md`.

## Live and record have opposite rules

A domain file must be pruned, or it rots. An ADR must never be pruned, or the record
of what was decided is destroyed. Research is the same: it is a snapshot of a moment,
true as of its date.

One folder cannot carry both rules. So `docs/adr/` and `docs/research/` stay out of
the skill, reached only when a domain's **Reasons** links them — which happens when
the one-line reason is not enough.

`docs/design/` is retired. A design doc is a proposal. Once built, the decision is an
ADR and the rules are a domain file. A third copy only goes stale.

## The glossary is not at the repo root

A root `CONTEXT.md` is a convention, but it makes the words a separate system from
everything else the agent reads. Inside the skill, the router decides when the words
load, the same way it decides everything else.

Terms split by reach. `glossary.md` holds what is used **across** domains and loads
every session. A term that only matters inside one domain lives in that domain file's
**Words**, so a task that never enters the domain never pays for it.

## A doc earns a line only if the code cannot say it

The failure mode of any agent-facing doc is restatement: a paragraph explaining what a
function does, next to the function. It costs tokens, it goes stale the moment the
code changes, and readers then trust the wrong one.

So the test is one question — _could I learn this by reading the code?_ If yes, link
the path under **Where it lives** and write nothing.

What survives the test is worth more than what it replaced:

- a **fence**: the trap, and why the fence stands
- a **reason**: why this shape, when the code cannot show it
- a **rule**: a convention no linter enforces
- a **word**: a term whose meaning the project fixes

A fence is the highest value per token in the whole system. The code never confesses
its own traps.

## The rules live in the router

The bloat happens during ordinary work, when an agent finishes a task and appends what
it learned. A rule kept in a review skill arrives too late — garbage gets written all
week and cleaned once.

The router loads every session, so the rules sit at the top of it. Every agent that
reads the context also reads the law for adding to it. One copy, no extra cost.

## One base skill, two process skills

Setup, audit and a recorded decision all need the same shape and the same law. That
reference has one home: `/context-engineering`, a model-invoked skill the other two call
with the Skill tool. Two alternatives fail:

- A shared file outside the skills does not travel. The skills CLI installs each skill
  folder alone.
- A user-invoked skill cannot call another. Neither process skill could own the
  reference for the other.

The cost is the install: a repository needs all three skills, not one.

`/domain-modeling` is the fourth. It already owns how a glossary entry and an ADR are
written, so `/context-engineering` delegates both rather than keeping a second copy of
rules it does not own. A weaker copy is worse than a pointer: a reader who finds it
follows it, and never learns the copy was the loose one. So the base skill governs
which file a term goes in, and `/domain-modeling` governs how the entry is written.

Recording a decision has no process skill and no gate. The owner types
`/context-engineering <decision>` when a decision is made; a model-invoked skill can still
be typed by hand. A code task that changes a decision still updates its domain file
itself, under the router's short copy of the law.

Setup and audit have different triggers, so they split.

`/setup-project-context` is heavy and runs once: survey, mine, interview, drain. It
runs only when a repo has no context.

`/audit-project-context` is light and constant. It runs at the end of a pull request,
reads the diff, cuts restatement, and flags drift.

Its one hard rule: **it must open the code.** Real knowledge and restatement look
identical in prose. Only the file tells them apart. It also runs as a fresh sub-agent,
because the agent that wrote a line is the worst judge of whether it earns its place.

## The gate reuses what already works

Enforcement is one instruction in `AGENTS.md`: read `CONTRIBUTING.md`, invoke
`/project-context`, emit the triage line, read what the table names.

A `SessionStart` hook would be deterministic, but it exists only in Claude Code and
this has to work in Codex too. The triage gate is already a proven device in these
repos, so the cost of adopting it is zero.

## Forks are ours

A skill from elsewhere that we edit is no longer third-party: upstream cannot be
re-pulled cleanly, and we maintain it. So it lives in its real category, where someone
looking for it would look.

Attribution goes in the repository's `README.md`, not in the skill. A block inside the
skill loads with the skill, every time it fires, and the reader who needs it is a human
browsing the repo.
