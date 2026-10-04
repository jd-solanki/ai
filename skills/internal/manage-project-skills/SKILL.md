---
name: manage-project-skills
description: Update, add or remove skills installed by the skills CLI across your projects, then commit and push each project.
argument-hint: "[the change, or nothing to update every installed skill]"
disable-model-invocation: true
---

# Manage Project Skills

The **change** is what the user asks for: update these skills, remove those, add one,
move one to its new source. No change given? Update every skill each project holds.

The list of projects is the user's call. A change that names its projects has made
that call already. Any other change touches nothing until they pick in step 2.

## Process

### 1. Find the projects

Search `~/Projects`, on Linux and macOS alike, unless the user names another directory.

A project uses the skills CLI when a `skills-lock.json` sits at its root:

```bash
find ~/Projects \( -name node_modules -o -name '.*' \) -prune -o -name skills-lock.json -print
```

Pruning dot directories keeps the list to one row per project: a git worktree under
`.claude/worktrees/` is a second checkout of a project already found.

The lock's `skills` keys are the skill names. Keep the projects the change alters: for
an update or a remove, those whose lock holds a named skill; for an add, those the user
names.

Of those, keep only the projects checked out on their default branch:

```bash
git ls-remote --symref origin HEAD   # names the default branch
git branch --show-current
```

Any other branch is work in flight, often an agent's checkout for another task, and a
skills commit made there rides that branch. Leave the project untouched, even one the
user named.

Say which projects you dropped and why: for a branch, name it.

**Done when:** every lock file the search found is either in the list or named as
dropped.

### 2. Get the go-ahead

One table: project path, current branch, and what the change does there. Wait for the
user to choose. "All of them" is a choice; silence is not.

### 3. Apply the change, one project at a time

Record `git status --short` and `git rev-list --count @{u}..HEAD` first. They are the
baseline for step 4.

**Update and add** are one command, run once per `source`. An update re-adds what the
lock holds, grouped by the `source` recorded there:

```bash
pnpm dlx skills@latest add <source> -s <names...> -a <agents...> -y
```

- `-a` names the agents the project already installs for: `universal` for
  `.agents/skills/`, `claude-code` for `.claude/skills/`, and so on for each agent
  folder that links the skill. It holds the CLI to those. Left to detect agents, as
  `update` always is, the CLI reads the project's own `skills/` folder as OpenClaw's
  and links every installed skill into it.
- A name is a key from `skills-lock.json`, never a folder path.
- `add` rewrites every skill it is given, a local edit to the installed copy included.
  `git status` counts what moved.
- `add` skips a name the source no longer holds and says nothing: "Selected 2 skills"
  counts what it found. Fewer than you named means a skill was renamed, moved or
  deleted upstream, and `add <source> -l` lists what the source holds now.
- A skill that moved to another source is one `add` from the new source. It rewrites
  the lock entry in place.

**Remove** runs bare, with no `-a`:

```bash
pnpm dlx skills@latest remove <names...> -y
```

- Given `-a`, the CLI unlinks those agents and leaves the `.agents/skills/` copy and
  the lock entry behind.
- Bare, it clears every agent folder it knows, and it reads the project's own `skills/`
  as one. A project that owns a `skills/<name>` of the same name would lose it: stop
  there and tell the user.

**Done when:** every skill in the change was installed or removed by the CLI, or is
named to the user as gone from its source.

### 4. Commit and push each project on its own

Stage only the paths that appear now and were absent from the step 3 baseline. The
repo may already carry the user's own uncommitted work, and that stays where it is.

```bash
git commit -m "chore(ai): updated skills [skip ci]"
```

`[skip ci]` keeps the push from waking CI for a change no workflow tests.

Push when the baseline count was 0: the commit goes up alone. A branch that was already
ahead holds the user's unpushed work, and that push is theirs. Name the project as left
unpushed.

**Done when:** every chosen project has a hash, a list of the files that really
changed, and is pushed or named as left unpushed.
