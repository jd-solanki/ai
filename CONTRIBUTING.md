# Contributing

## What this is

cl-factory runs agents on the owner's GitHub repositories: a teammate applies a trigger
label, and the matching agent works in a local clone and reports back on GitHub. It is one
Node server on the owner's machine, driving Claude Code.

## Status

What runs today: `TRIGGERS` in [`src/session.ts`](./src/session.ts). A trigger label starts one
background session, and a Stop hook opens the draft pull request.

The code is the proven prototype. `/project-context` holds decisions it does not implement
yet, and where the two disagree the context is the target:

- One session implements a whole spec. The walk over sub-issues, the done set and the
  HITL stop are unbuilt.
- The pull request comes from the worktree's branch, `worktree-implement-<n>`, not the
  spec branch, so records `/create-spec` pushed to `spec/<n>` stay out of it.
- No working labels: the trigger label stays on the work item and nothing shows a claim.
- No Fixer exists, and nothing hands a review to one.

Known gaps:

- Stop fires after every turn. A turn that ends on a question, or a follow-up message
  after you attach, runs `/create-pr` again. `/create-pr` only opens drafts and refuses
  uncommitted work.

Deliberately unbuilt:

- Hosted resources. The factory is local only: it runs on the owner's machine, with no
  hosted compute or storage such as Cloudflare.
- A cap on review rounds. A human decides when review and fix stop alternating, and what
  happens to findings still open.

## Conventions

Every rule about the code lives in `/project-context`. Invoke it.

## How to contribute

- Commands: see the `scripts` block in `package.json`.
- Commits: Conventional Commits.
- Pull requests: open a draft with `/create-pr`, and update the domain file in the same
  pull request when a decision changes.
