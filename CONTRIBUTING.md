# Contributing

## What this is

Two things that change together:

- `skills/`: a library of AI agent skills, published for installation into other
  repositories through the skills CLI. Most are written for my own projects first and
  generalised once they have survived real work.
- `apps/software-factory/`: the software factory those skills are written for. It runs
  agents on the owner's GitHub repositories: a teammate applies a trigger label, and the
  matching agent works in a local clone and reports back on GitHub. It is one Node server
  on the owner's machine, driving Claude Code.

## Status

**Skills.** Working and installed in real projects. `skills/in-progress/` is the
incubator: a skill there is still moving and may change shape without notice. Everything
outside it has been used on real work and settled.

**Software factory.** What runs today: `TRIGGERS` in
[`apps/software-factory/src/session.ts`](./apps/software-factory/src/session.ts). A trigger
label starts one background session, and each session hands off by applying the next
agent's trigger label.

The pipeline in `/project-context` is built but unproven: no spec with sub-issues, no HITL
stop and no Fixer run has gone end to end on a served repo.

Known gaps:

- A turn that ends on a question takes the working label off while the session is still
  open.
- A session that never reaches Stop keeps its working label, and its trigger label is
  ignored, until a human removes the working label. A turn that dies on an API error is
  the exception: it releases the label and says so on the work item.
- A hand-off is the session's own act. A session that skips it leaves the pull request
  with no `agent:*` label, and a human applies the next one.

Deliberately unbuilt:

- Hosted resources. The factory is local only to keep the cost zero, because remote
  resources cost money: it runs on the owner's machine, with no hosted compute or storage
  such as Cloudflare.

## Conventions

Every rule about this repo lives in `/project-context`. Invoke it.

## How to contribute

- Commands: see the `scripts` block in each `package.json`. `pnpm ready` checks
  everything.
- Commits: Conventional Commits.
- A skill change lands straight on `main`, one commit per skill. Write a skill with
  `/writing-for-agents`.
