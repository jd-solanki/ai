---
name: project-context
description: This repository's words, rules, reasons and fences. Invoke before the first code action in a session, and again when a task enters a new domain.
---

# Project context

## What earns a line here

- A **word** — a term whose meaning this project fixes.
- A **rule** — a convention no linter or type checker enforces.
- A **reason** — why this shape was chosen, when the code cannot show it.
- A **fence** — the trap, where it bites (`file:symbol`), and why the fence stands.

**The test: could I learn this by reading the code?** Then link the path under
**Where it lives**. Leave the prose out.

Git holds the history, the skills CLI holds the install state, and `package.json` holds the
commands. All are sources of truth already; point at them.

Past ~150 lines, a file is two domains, or it is restating code. Split it or cut it.

`/audit-project-context` enforces all of the above.

## Upstream of the code

This context holds the decisions. The code implements them.

When a task changes a decision, update the domain file in the same pull request as the
code. When the code and a domain file disagree, ask the owner which one is wrong.

## References

Load `glossary.md` every session. Load a domain file when your task enters it.

A row may name any path in the repository. Living inside this folder is not what makes
a file loadable; this table is.

A domain file is settled unless its header says otherwise. `provisional`: build on it, but
keep its detail behind one seam. `exploratory`: argue with it before building on it.
The word moves when the owner's decision moves, in the same pull request as the code it
governs.

| Reference | Load when |
| --- | --- |
| `glossary.md` | always |
| `domains/layout.md` | adding, moving, renaming or linking a skill |
| `domains/authoring.md` | writing or editing the text inside a skill, and committing it |
| `domains/pipeline.md` | writing a spec, or changing how agents pick up, pause, resume or hand off work |
| `domains/labels.md` | adding or changing a trigger label, a working label, or how a GitHub event starts a run |
| `domains/sessions.md` | changing how a session is launched, what it may do, or what static code does around it |
| `docs/context-engineering.md` | changing the shape of `/context-engineering`, `/setup-project-context`, `/setup-landscape`, `/audit-project-context`, or the layout they build |
