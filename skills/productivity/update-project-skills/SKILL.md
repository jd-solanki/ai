---
name: update-project-skills
description: Update skills installed by the skills CLI across your projects, then commit each project.
argument-hint: "[skill names, or nothing for all]"
disable-model-invocation: true
---

# Update Project Skills

Names given? Update those. No names? Update every skill the project holds.

The list of projects is the user's call. Nothing is updated until they pick.

## Process

### 1. Find the projects

Search `~/Projects`, on Linux and macOS alike, unless the user names another directory.

A project uses the skills CLI when a `skills-lock.json` sits at its root:

```bash
find ~/Projects \( -name node_modules -o -name '.*' \) -prune -o -name skills-lock.json -print
```

Pruning dot directories keeps the list to one row per project: a git worktree under
`.claude/worktrees/` is a second checkout of a project already found.

The lock's `skills` keys are the skill names. Names given? Keep the projects whose
lock holds at least one, and say which projects you dropped and why.

**Done when:** every lock file the search found is either in the list or named as
dropped.

### 2. Get the go-ahead

One table: project path, current branch, and the skills that match. Wait for the
user to choose. "All of them" is a choice; silence is not.

### 3. Update, one project at a time

Record `git status --short` first. That is the baseline for step 4.

```bash
npx skills@latest update <names...> -p -y
```

- `-p` keeps it to the project. Without it the user's global skills update too.
- `-y` skips the prompt that offers to remove skills gone from upstream.
- A name is a key from `skills-lock.json`, never a folder path.
- No names updates every source in the lock, not only yours. "Updated 54 skill(s)"
  counts what it checked; `git status` counts what moved.
- A skill renamed upstream prints a bare `✗ Failed to update <name>`. The CLI drops
  the reason, so read the source repo to find it.

### 4. Commit each project on its own

Stage only the paths that appear now and were absent from the step 3 baseline. The
repo may already carry the user's own uncommitted work, and that stays where it is.

```bash
git commit -m "chore(ai): updated skills"
```

Push is a separate ask.

**Done when:** every chosen project has a hash and a list of the files that really
changed.
