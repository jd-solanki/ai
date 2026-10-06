---
name: setup-landscape
description: Write a landscape from its own repo, and join every member repo to it with one draft pull request each. Run it again to add members or catch up with changed connections.
argument-hint: "[name] [members to add, as paths or owner/repo]"
disable-model-invocation: true
---

# Setup Landscape

Invoke `/context-engineering`. Its **Landscapes** section holds the rules this skill
follows, and template 7 in its `TEMPLATES.md` is the shape it writes. If it is not
installed, stop and tell the user to install it.

Run from the root of the landscape's repo. Its GitHub remote, `<owner/repo>` below, is
where every member installs the landscape from. Members sit beside it, as `../<repo>`,
and may belong to different owners.

Every run is the same run. The first writes the landscape and joins every member. A later
one adds the members `$ARGUMENTS` names, and catches the landscape and every member up
with connections that changed since.

## 1. Gather

- **Name**: the first word of `$ARGUMENTS` with no `/` in it; else the `*-landscape`
  skill this repo already publishes; else this repo's name less `-landscape`. Failing
  all three, ask. It names what the members make together, never an owner: the landscape
  outlives whoever hosts it.
- **Members**: the repos the landscape's **Repos** table lists, plus every path or
  `owner/repo` in `$ARGUMENTS`. An `owner/repo` with no clone beside this repo gets one:
  `gh repo clone <owner/repo> ../<repo>`.

Check every member: it is not this repo, it is on its default branch with a clean tree,
and it has `skills/internal/project-context/`. Then `git pull --ff-only` in each, so the
connections come from merged code.

Any member that fails stops the run. List them all, each with what it needs. A member
without project context needs `/setup-project-context` run inside it first: that is an
interview with its owner, so it cannot run from here.

**Done when** every member passes all three checks.

## 2. Map the connections

Read each member's project context, then its code: API clients and routes, events
published and consumed, a package one member installs from another. A connection counts
once you have found **both ends**; record the `file:symbol` at each. One found at a single
end goes to the report.

Then ask the user, one connection at a time, only what the code cannot say: which member
owns the shape, what breaks when it changes, and how a breaking change ships. Ask which
words more than one member uses, and invoke `/domain-modeling` before you write them. On a
later run, ask only about connections that are new or changed.

**Done when** every connection names both ends, its owner, what breaks, and how a change
ships.

## 3. Publish the landscape

Write `skills/<name>-landscape/SKILL.md` from template 7, or update it. A repo that
already publishes other skills keeps this one where those live. Show the user the file,
or the diff on a later run, and wait for approval.

Commit, and push to the default branch. Members install from there, never from this
clone: a local install records a relative path in each member's lock that no other clone
can follow. A refused push (a protected branch, or no write access) goes up as a branch
with a pull request instead. Stop there, and tell the user to run this again once it
merges.

**Done when** `npx skills@latest add <owner/repo> -l` lists `<name>-landscape`.

## 4. Join each member

One member at a time, from its root, on a new branch `<name>-landscape` off its default
branch. A member that already has that branch is skipped: an earlier run's pull request
is still open.

1. **Install.** `npx skills@latest add <owner/repo> -s <name>-landscape -a <agents> -y`.
   `<agents>` are the ones the member already installs skills for: `universal` for
   `.agents/skills/`, `claude-code` for `.claude/skills/`. Where `npx` refuses to run (a
   `devEngines` that names pnpm), use `pnpm dlx skills@latest`. On a later run the same
   command refreshes the installed copy.
2. **Row.** Add the landscape row from template 3 to the router, unless it is there.
3. **Fences.** At this member's end of every connection, write or update the fence in the
   domain file whose **Where it lives** covers that code. It names the landscape, takes
   the connection's "what breaks" as its reason, and points at the `file:symbol` from
   step 2. A connection that is gone takes its fence with it. Code no domain covers goes
   to the report.
4. **Match the lock.** One row per `*-landscape` in `skills-lock.json`, and no row or
   fence naming one it does not list. `/audit-project-context` checks the same, but it is
   user-invoked, so no skill can run it.
5. **Ship.** Commit in the member's convention, push, and open a draft pull request with
   `gh pr create --draft`. A member left unchanged loses its branch and gets no pull
   request. A refused push keeps the branch local, for the member's owner.

**Done when** every member has a draft pull request, has nothing to change, or is named
in the report with its reason.

## 5. Report

- The landscape's commit, or its pull request.
- Each member: its pull request, "no change", or why it was skipped.
- Every connection found at one end only: a repo outside the landscape, or code to fix.
- Every connection running through code no domain covers.
