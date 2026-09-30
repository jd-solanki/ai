---
name: backport-skill
description: Carry an edit made to an installed skill back to the skills repo it came from, and commit there.
argument-hint: "[skill name] [project path]"
disable-model-invocation: true
---

# Backport Skill

A project installed a skill, then improved it in place. This carries that
improvement home to the source repo on this machine.

Backport the **change**, never the file. The installed copy can be older than
upstream, so copying it over would undo work already done there.

## Process

### 1. Locate both copies

Ask for the skill name and the project when the user has not named them.

The project's `skills-lock.json` names the source under the skill's key:

```json
"create-ticket": {
  "source": "jd-solanki/skills",
  "skillPath": "skills/in-progress/create-ticket/SKILL.md"
}
```

`source` names the repo, `skillPath` names the file inside it. Ask the user where
that repo is checked out when you cannot tell.

The installed copy lives in the project's agent skills directory, usually
`.agents/skills/<name>/`. Reference files sit beside `SKILL.md` in both places, so
read the whole folder on each side.

**Done when:** you hold two paths, and both exist.

### 2. Read the change out of the project's history

The install commit is the baseline. Everything after it is what you carry over.

```bash
git log -p -- .agents/skills/<name>/
git diff -- .agents/skills/<name>/
```

Say what the edit does in one sentence before you touch upstream. An edit you
cannot describe is an edit you cannot backport.

**Done when:** you have the diff, and every hunk in it belongs to the user rather
than to an earlier `skills update`.

### 3. Apply it upstream

`diff -ru <upstream-folder> <installed-folder>` shows the gap. Two sources feed it:
the user's edit, and upstream commits the project never pulled. Land the first and
leave the second alone.

Both sides changed the same lines? Stop and show the user both versions.

### 4. Commit in the source repo

Run `/git-commit` in the source repo. Scope the message to the skill, for example
`feat(create-ticket): ...`.

Push is a separate ask.

### 5. Hand back the next step

The project still runs the old copy. Tell the user to run
`/update-project-skills <name>` once the source repo is pushed.
