# Templates

Six files to write in a repo, and a seventh in a landscape's own repo. Fill the slots.
Keep the headings.

Every one of them obeys the rule: a doc earns a line only if the code cannot say it.

## 1. The gate — into `AGENTS.md` or `CLAUDE.md`

Add this section. If the file already has a `## Project context` section, replace it.
Nothing else in the file changes.

```markdown
## Project context

Before the first code action in a session: Read `CONTRIBUTING.md`, then invoke
`/project-context`.

`/project-context` holds this repository's words, rules, reasons and fences. Its table
says which references your task needs. Emit the triage line, then Read those.
```

## 2. `CONTRIBUTING.md`

Humans and agents both read this one. It orients; it never explains code.

```markdown
# Contributing

## What this is

[Two or three sentences. What the project does and who it is for.]

## Status

[What works today. What is deliberately unbuilt, and why.]

Fences and intentional gaps only. A feature checklist here goes stale within a week.

## Conventions

Every rule about the code lives in `/project-context`. Invoke it.

## How to contribute

- Commands: see the `scripts` block in `package.json`.
- Commits: [convention, or the skill that owns it].
- Pull requests: [what a PR needs before review].
```

## 3. `skills/internal/project-context/SKILL.md`

Model-invoked. The agent has to reach it, so it carries a description and no
`disable-model-invocation`.

The router holds the rules and the table. It holds no prose.

The rules block is why the rules live here: this file loads every session, so every
agent that reads the context also reads the law for writing it. One copy, no extra
cost. Copy it verbatim — it is the guardrail the whole system rests on.

```markdown
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

Git holds the history and `package.json` holds the commands. Both are sources of
truth already; point at them.

Past ~150 lines, a file is two domains, or it is restating code. Split it or cut it.

`/audit-project-context` enforces all of the above.

## Upstream of the code

This context holds the decisions. The code implements them.

When a task changes a decision, update the domain file in the same pull request as the
code. When the code and a domain file disagree, ask the owner which one is wrong.

## References

Load `glossary.md` every session. Load a domain file when your task enters it.

A domain file is settled unless its header says otherwise. `provisional`: build on it, but
keep its detail behind one seam. `exploratory`: argue with it before building on it.
The word moves when the owner's decision moves, in the same pull request as the code it
governs.

| Reference | Load when |
| --- | --- |
| `glossary.md` | always |
| `domains/[domain].md` | [the tasks that need it] |
| `.agents/skills/[name]-landscape/SKILL.md` | changing or using a connection to another repo |
```

Write the landscape row once for each `*-landscape` that `skills-lock.json` lists. A repo
that lists none has no landscape row.

## 4. `glossary.md`

The words used **across** domains. A term that only matters inside one domain belongs
in that domain file's **Words** section, so a task that never enters the domain never
pays for it.

```markdown
# Glossary

[One or two sentences: what this project is, in its own vocabulary.]
```

`/domain-modeling` owns what an entry looks like. Read its `GLOSSARY-FORMAT.md` and
write every entry from that, here and in a domain file's **Words**. This file governs
which of the two a term goes in; that one governs how it is written.

## 5. `domains/<domain>.md`

One file per domain. Five sections. A section with nothing true in it gets deleted,
not padded.

```markdown
# [Domain]

confidence: [provisional | exploratory] — [what is still moving. Omit this line entirely
when the domain is settled.]

## Words

**[Term]**: [what it is, in this domain only]

## Rules

- [How work is done here.]

## Reasons

- [Why this shape, in one or two sentences. Link the ADR or investigation behind it.]

## Fences

- **[The trap.]** [What it breaks, and why the fence stands.] `path/to/file.ts:42`

## Where it lives

`[path]`, `[path]`, `[path]`
```

A fence is worth more than a rule. It is the thing that bites, and the code never
confesses it. When a section runs long, ask whether it is restating code that the
**Where it lives** paths already hold.

## 6. `README.md`

Humans only. Agents never read it for context.

```markdown
# [Project]

[One or two sentences.]

## Setup

[The commands to get running.]

## More

- Contributing and project status: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- Commands: the `scripts` block in [`package.json`](./package.json)
```

## 7. `skills/<name>-landscape/SKILL.md` — in the landscape's repo

`/setup-landscape` writes this one. The router reads it by path, so it is user-invoked and
costs no context load.

```markdown
---
name: [name]-landscape
description: The [name] landscape — [what the repos make together], how they connect, and the words they share.
disable-model-invocation: true
---

# [Name] landscape

[One or two sentences: what these repos make together, in their shared vocabulary.]

## Repos

| Repo | Owns |
| --- | --- |
| `[owner/repo]` | [what it owns, in landscape words] |

## Connections

- **[Contract]**: `[owner/provider]` → `[owner/consumer]`, over [an API | an event | a
  package]. `[owner/repo]` owns its shape. [What breaks when it changes, and how a change
  ships safely.]

## Words

**[Term]**:
[What it is, in one or two sentences.]
_Avoid_: [the words it replaces]

## Reasons

- [Why the repos split or connect this way, when no repo's code shows it.]
```

A connection names repos, never another repo's files: those move without the landscape
hearing. Past ~150 lines, move each group of connections into a file beside `SKILL.md`
and list the files in a table, the way the router does.
