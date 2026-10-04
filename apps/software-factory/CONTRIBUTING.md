# Contributing

## What this is

cl-factory runs agents on the owner's GitHub repositories: a teammate applies a trigger
label, and the matching agent works in a local clone and reports back on GitHub. It is one
Node server on the owner's machine, driving Claude Code.

The skills its agents run come from [jd-solanki/skills](https://github.com/jd-solanki/skills)
and are written for this factory, so a change to how a skill is launched or run lands in
both repositories.

## Status

What runs today: `TRIGGERS` in [`src/session.ts`](./src/session.ts). A trigger label starts one
background session, and each session hands off by applying the next agent's trigger label.

The pipeline in `/project-context` is built but unproven: no spec with sub-issues, no HITL
stop and no Fixer run has gone end to end on a served repo.

Known gaps:

- A turn that ends on a question takes the working label off while the session is still
  open.
- A session that never reaches Stop keeps its working label, and its trigger label is
  ignored, until a human removes the working label.
- A hand-off is the session's own act. A session that skips it leaves the pull request
  with no `agent:*` label, and a human applies the next one.

Deliberately unbuilt:

- Hosted resources. The factory is local only to keep the cost zero, because remote
  resources cost money: it runs on the owner's machine, with no hosted compute or storage
  such as Cloudflare.

## Conventions

Every rule about the code lives in `/project-context`. Invoke it.

## How to contribute

- Commands: see the `scripts` block in `package.json`.
- Commits: Conventional Commits.
- Pull requests: open a draft with `/create-pr`, and update the domain file in the same
  pull request when a decision changes.
