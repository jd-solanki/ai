---
name: write-qa-scenarios
description: >
  Write the QA scenarios for a change: the happy paths, every unhappy path the change can break,
  for each role it touches, and what its spec asked for. Use when a pull request needs QA steps,
  before running QA on a change, or when asked what to test.
---

# Write QA scenarios

A **QA scenario** is one behaviour to try, run as one role when the app has roles, with numbered
steps that each name the result to see. An **unhappy path** is a run where something goes other
than planned. You write scenarios; `/run-qa-scenarios` tries them.

## 1. Read the change

The change is what the caller or the user names: a range, a branch, a pull request. With nothing
named, it is the uncommitted changes: `git status --short` and `git diff HEAD`, untracked files
included. No change there? Say so, and ask what to cover.

Then read what the change was **for**: the spec or issue it closes (a `Closes` line, a `spec/<n>`
branch), or the user's own words. A scenario that only follows the diff tests what was built;
the spec says what should have been.

**Done when** you can name every behaviour the change adds or alters, and every thing its spec
asks for.

## 2. Pick the paths

1. **Roles**: find the roles the changed code checks: guards, policies, permission lists, role
   names. Keep each role that sees the change differently. An app with no roles has none.
2. **Happy paths**: each behaviour from step 1, and each thing the spec asks for.
3. **Unhappy paths**: read [`unhappy-paths.md`](unhappy-paths.md). Check every kind against the
   change and keep each path the change can break.
4. **Pairs**: cross the paths with the roles. Keep one scenario per pair that behaves
   differently.
5. **Blast radius**: what else uses the changed code, and one scenario that shows it still
   works. A change with no visible behaviour, such as a refactor, gets the scenario that shows
   nothing moved.

**Done when** every behaviour, every spec item and every kept kind has a scenario, and each pair
you dropped behaves like one you kept.

## 3. Write them

```markdown
- [ ] **As admin: deleting a member asks to confirm**
  1. `pnpm dev`, sign up as an admin, add a member → `/members` lists the member.
  2. Click Delete on that member → a dialog asks to confirm.
- [ ] **As admin: a failed delete keeps the member and offers Retry**
  Fault: the members API answers 500 to `DELETE`.
  1. `pnpm dev`, sign up as an admin, add a member → `/members` lists the member.
  2. Click Delete, then Confirm → an error names the failure and shows Retry; the member stays.
```

- The title is the behaviour, plainly, led by `As <role>:` when the app has roles.
- Each scenario makes its own accounts and records in its first step. It starts from a clean app,
  never from what another scenario left.
- An unhappy path that needs a failure says so in a `Fault:` line: what fails and how. The runner
  picks how to force it.
- Every step is something a person does by hand: the command to run or the thing to click, then
  `→` and the result to see. CI already reports the tests.
- Order: happy paths, then spec items, then unhappy paths, then blast radius.

**Done when** every scenario from step 2 is written, each step names its result, and every
unticked box can be tried from a checkout of the change.

## 4. Hand them over

- **A caller asked** (`/create-pr`, `/run-qa-scenarios`): return the list.
- **The user asked**: write `qa.md` in a run folder outside the repo,
  `${TMPDIR:-/tmp}/qa-<repo>-<yyyymmdd-hhmmss>/`, and reply with its path and the number of
  scenarios. The file is where you edit them, so the chat carries only the path.
