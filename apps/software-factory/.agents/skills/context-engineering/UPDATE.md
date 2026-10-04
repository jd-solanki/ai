# Update

The owner has handed you a decision. Write it into the project context. The owner's words
are the decision; the code is only evidence.

If `skills/internal/project-context/` does not exist, stop. Tell the user to run
`/setup-project-context` first.

## 1. Find its home

Invoke `/project-context` and read its table. Pick the file the decision governs:

- a word used across domains → `glossary.md`
- the project's status, or something deliberately unbuilt → `CONTRIBUTING.md`
- anything else → the domain file whose tasks it changes

No domain fits? Propose one name that obeys **Domains**, with one line on what it owns,
and wait.

**Done when** the owner has approved the target file.

## 2. Test it against the code

Open the code the decision touches. Then the decision is one of three:

- **New knowledge** — the code cannot say it. Write it.
- **Already said** — the code says it. Add the path under **Where it lives** and write no
  prose.
- **Drift** — the code breaks it. Write it, and list the code's `file:line` for the
  report. The code changes next, never the decision.

**Done when** every part of the decision carries one of the three, with the `file:line`
that settled it.

## 3. Write it

Put each part in its section, in the owner's words. Every line obeys **A domain file**
and **Live and record**.

- A reason too long for one line: offer an ADR under `docs/adr/`, linked from **Reasons**.
- A line the decision replaces is deleted, not kept beside it.
- Ask whether the domain's `confidence:` word moved.
- A new domain file starts from `TEMPLATES.md` and gets a row in the router table.

**Done when** every part sits in exactly one section and no line in the context
contradicts it.

## 4. Report

- Each file changed, and the lines added or replaced.
- Every drift, with its `file:line`: code to change, in the same pull request.
