---
name: setup-jd-solanki-skills
description: Set up the global and project instructions required to use jd-solanki skills and tools.
disable-model-invocation: true
---

## 1. Maintain Global Agent Instructions

Maintain both global instruction files.

Replace each file's contents with its corresponding block exactly. These files are
intentionally separate because Claude Code receives additional instructions.

`~/.codex/AGENTS.md`:

```markdown
- Always load `/ponytail` skill on new session with `ultra` parameter
- Use precise domain term instead of describing the whole concept
- Prefer decision-focused asks over context dumping
```

`~/.claude/CLAUDE.md`:

Content from `~/.codex/AGENTS.md` plus following:

```markdown
- Prefer subagent notification over sleep
- For `sudo` commands, run them in /herdr pane using `herdr pane *` commands so I can input password and you can see the logs

## Skill reference loading

Skills ship a main `SKILL.md` (always loaded) plus optional files in the same directory — `references/*`, `examples/*`, `SAMPLE.md`, etc. — loaded on demand. Load them deliberately: not all up-front, not blindly.

**IMPORTANT — this is a BLOCKING gate.** After invoking ANY skill, before any other tool call or task action, you MUST emit a one-line triage decision and then immediately Read the files it names:

`Triage <skill-name>: loading <files>; skipping <files> because <reason>.`

The triage line and the `Read` calls for every file listed as "loading" are ONE atomic step. Emitting the line without then Reading those files, or doing task work with a file you announced but did not Read, is a violation. If a skill lists no reference files, state `Triage <skill-name>: no reference files.` and no Reads are required.

To decide what to load:

1. **Build a menu** from the reference list in the skill's main file. If it lists none, glance at each `references/*.md` (its `load-when` line or first heading) for its topic.
2. **Classify each reference:** *core* (no condition stated) → load; *conditional* (tied to a language, task type, or context — Python vs JS, bug vs feature) → load only if this task meets the condition.
3. **Don't re-read** what's already loaded; re-evaluate only if the task changes.

When in doubt, load too few rather than too many — you can read a reference later once the task makes the condition clear.
```

Verify that both files contain the specified content.

## 2. Upsert `AGENTS.md`

If following template block already exists in file, update its contents in-place rather than appending a duplicate. Don't overwrite user edits to the surrounding sections.

The block:

```markdown
## General Rules

- Do not manually edit files managed by CLI tools. E.g. skills-lock.json, pnpm-lock.yml, etc
- Add a mermaid diagram wherever markdown reaches a human reader and a diagram aids understanding — GH issues, PRs, comments, form submissions. There it goes near the top.
  - Agent-only writing carries prose alone: skills, `docs/*`, project context, etc.
- **Git is the changelog.** Present tense only; no "used to" / "previously".
  - Exception - **Chesterton's Fence**: state the trap, not the timeline.
  - "`--no-folding` breaks `~/.agents`" = fence. "we tried it last week" = changelog.

## Core Engineering Principles

These apply to every change you make. They are not optional style preferences.

- **Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.**
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.

## Prefer a Single Source of Truth

Do not duplicate knowledge that already has an authoritative source.

When a value, rule, configuration, or behavior is defined elsewhere, reference, import, or derive from that source instead of copying it. This applies to prose as much as to code — issues, PR descriptions, docs, and comments.

Examples:

* **Node.js version:** Do not hard-code the version in documentation, scripts, or CI if the repository already defines it in `.node-version`, `.nvmrc`, or another canonical runtime configuration. Reference or read from that source instead.
* **pnpm version:** Do not repeat the pnpm version across documentation or tooling when it is already defined in `package.json`, such as through the `packageManager` field. Reference or derive it from there.
* Import a shared constant instead of redefining the same value in multiple modules.
* Read configuration from its canonical source instead of maintaining parallel copies.
* **Repository content quoted in prose:** When an issue, PR description, or doc refers to something that lives in the repository — a list in `README.md`, a set of supported options, a config schema — point the reader at that location instead of pasting the content. The pasted copy goes stale the moment the source changes, and readers then trust the wrong one. Write "see the supported providers list in `README.md`" instead of reproducing the list.

Before adding duplicated information, check whether a canonical source already exists. If it does, use that source.

Apply DRY to duplicated **knowledge**, not merely similar-looking code. Do not introduce abstractions solely to eliminate harmless code repetition when doing so would reduce clarity or increase coupling.

## Comments

A comment explains why, never what. A comment explaining what the code does means the code needs to
be clearer: rename or extract until it reads plainly, then drop the comment.

- Keep every why the code cannot show — a reason, a constraint, a fence — in the fewest words that
  carry it.
- Name the term `/project-context` defines; the term replaces the explanation. A concept two comments
  must explain lacks a term: add it to the glossary, then name it in both.
```

## 3. Third-Party Skills

> [!IMPORTANT]
> Only proceed with this section once **2. Upsert Project Agent Instructions** is fully done.

Read [`THIRD-PARTY.md`](./THIRD-PARTY.md) for a list of third-party skills, list them and suggest user that these are skills that they may want to install and use in their projects.
