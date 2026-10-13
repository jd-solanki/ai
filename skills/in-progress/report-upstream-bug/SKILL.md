---
name: report-upstream-bug
description: Reproduce a dependency's bug minimally, file it upstream, and track it in our repo. Use when a bug traces to an upstream package, or the user asks for a reproduction.
argument-hint: "[the bug, and the package you suspect]"
---

# Report Upstream Bug

Run every step that applies, unasked. Tracking and the workaround comment are part of
the job.

## 1. Look upstream first

Search the package's issues and pull requests, open and recently closed, by concept.

- **A fix PR exists.** Skip the repro and the filing. Link the PR from the tracking
  issue and the workaround comment, and patch from it. Go to step 4.
- **An open issue exists.** You will comment on it instead of filing a new one. Build
  the repro anyway, unless the issue already has one that runs.

**Done when:** you know which case you are in: a PR, an issue, or nothing.

## 2. Build the repro

Build it in a subagent so the host conversation stays on its own task. Several bugs
get one subagent each, run in parallel. Repro work lives in the worktree below. The
host repo's uncommitted changes belong to someone else, so leave them alone.

Repros live in `jd-solanki/reproductions`, cloned at
`~/Projects/github/jd-solanki/reproductions`. Each repro is its own branch, cut from
`origin/main` (a minimal Nuxt starter) inside a throwaway worktree, so the main
checkout stays on `main`:

```bash
git -C ~/Projects/github/jd-solanki/reproductions fetch origin
git -C ~/Projects/github/jd-solanki/reproductions worktree add -b <branch> /tmp/repro-wt/<branch> origin/main
```

Name the branch `<package>-<bug-slug>--YYYY-MM-DD`, for example
`nuxtjs-better-auth-auth-schema-typed-any--2026-09-26`.

- **Latest:** run on the package's latest release, or on the version the user named.
- **Minimal:** keep only what the failure needs. For a fresh Nuxt project, run
  `new-nuxt <dir>`, which scaffolds the minimal template with pnpm.
- **Red:** a single command fails with the bug's error, as a build, a test or a type
  check. Upstream uses that same command to prove their fix.

If it is not red on latest, stop. The bug is ours, or already fixed. Report that and
file nothing.

Write the README in this shape:

````markdown
# Repro: <what breaks, in one line>

<One or two sentences: what the app does, and what fails.>

| | |
| --- | --- |
| `<package>` | <version> |
| `node` / `pnpm` | <versions> |

## Run it

```bash
pnpm install
<the red command>
```

## Expected

## Actual

<the error output, pasted>

## Control

<the one change that turns it green, when there is one>
````

Commit once as `repro: <what breaks>`, then `git push -u origin <branch>`.

**Done when:** the branch is pushed, the README's Run it commands go red, and you hold
`https://github.com/jd-solanki/reproductions/tree/<branch>`.

## 3. File upstream

Run `/create-ticket` against the package's repo, with the branch URL as the
reproduction. If step 1 found an open issue, comment there with the branch URL
instead.

**Done when:** the upstream issue or comment is live and links the branch.

## 4. Track it in our repo

File one tracking issue for each upstream issue, comment or PR, labelled `upstream` and
`tracking`. It links the upstream URL and the repro branch, and says what the bug
blocks here. The go-ahead on the upstream draft covers this issue too. File it straight
after the upstream one.

**Done when:** every upstream issue, comment and PR from this run has its tracking
issue, carrying both labels.

## 5. Mark the workaround

When we ship a workaround, its comment names both issues and marks it temporary:

```ts
// Temporary workaround for <upstream issue URL>, tracked in <our issue URL>.
```

**Done when:** every workaround in the change carries this comment.

## Fixing it upstream

When you open a PR upstream, prove it by running the issue's repro green against your
change. Write unit tests only when the user asks for them.

## Report back

List the URL of everything you pushed and filed: the repro branch, the upstream issue
or comment, and the tracking issue.
