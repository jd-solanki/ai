# Contributing

## What this is

Two things that change together:

- `skills/`: a library of AI agent skills, published for installation into other
  repositories through the skills CLI. Most are written for my own projects first and
  generalised once they have survived real work.
- `apps/software-factory/`: the software factory those skills are written for. It runs
  agents on the owner's GitHub repositories: a teammate applies a trigger label, and the
  matching agent works in a local clone and reports back on GitHub. It is a Node server
  on the owner's machine, or one per machine, driving Claude Code.

Beside them, two herdr plugins: `apps/herdr-kanban/`, a board of every herdr agent by
state, and `apps/herdr-tab-title/`, which titles a tab named `#123` with that issue or pull
request's title.

## Status

**Skills.** Working and installed in real projects. `skills/in-progress/` is the
incubator: a skill there is still moving and may change shape without notice. Everything
outside it has been used on real work and settled.

**Software factory.** What runs today: `TRIGGERS` in
[`apps/software-factory/src/session.ts`](./apps/software-factory/src/session.ts). A trigger
label starts one session in the factory's session host, and when a run ends, the server reads
GitHub and applies the next agent's trigger label.

The factory is splitting into layers, each with one adapter the owner picks per factory
([ADR 0001](./docs/adr/0001-factory-layers.md)). The session host has herdr's adapter and
Orca's, picked by `SESSION_HOST`; Orca's has run no factory session yet. The intake has one
adapter, the GitHub webhook. T3 Code waits, because it takes a prompt where the other hosts
take the `claude` command.

The pipeline in `/project-context` is built but unproven: no spec with sub-issues, no HITL
stop and no Fixer run has gone end to end on a served repo.

Known gaps:

- A run keeps its working label, and its trigger label is ignored, until a human removes
  the working label, when its session ends while the factory server is down or after it
  restarted, or is killed without ending: `kill -9`, a power loss.
- After a herdr restart, a crashed run's tab comes back with no session in it, and
  waits for a human to close it.
- A run whose launch failed and whose tab would not close keeps its claim until a
  human removes the working label.

Deliberately unbuilt:

- Hosted resources. The factory is local only to keep the cost zero, because remote
  resources cost money: it runs on the owner's machine, with no hosted compute or storage
  such as Cloudflare.
- Auto-merge. A human merges every pull request, Renovate's included, because an unattended
  merge lands a compromised release or a prompt-injected change unread. `/project-context`'s
  pipeline domain holds the reasons.

## Conventions

Every rule about this repo lives in `/project-context`. Invoke it.

## How to contribute

- Commands: see the `scripts` block in each `package.json`. `pnpm ready` checks
  everything.
- Commits: Conventional Commits.
- A skill change lands straight on `main`, one commit per skill. Write a skill with
  `/writing-for-agents`.
