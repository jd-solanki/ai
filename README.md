# JD Solanki's AI Agent Skills

<a href="https://skilld.dev/gh/jd-solanki/ai">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://skilld.dev/b/jd-solanki/ai?theme=dark">
    <source media="(prefers-color-scheme: light)" srcset="https://skilld.dev/b/jd-solanki/ai?theme=light">
    <img alt="Skill repository on skilld.dev" src="https://skilld.dev/b/jd-solanki/ai?theme=light">
  </picture>
</a>

## Setup

1. Run the skills.sh installer:

   ```shell
   pnpm dlx skills@latest add jd-solanki/ai
   ```

2. Pick the skills you want, and which coding agents you want to install them on. **Make sure you select /setup-jd-solanki-skills.**
3. Run `/setup-jd-solanki-skills` in your agent. It will:
   - Upsert instructions into your `CLAUDE.md` or `AGENTS.md` file(s) for how to load and use these skills.
   - Suggest you install and use third-party skills that I mostly use in my projects. See [`THIRD-PARTY.md`](./skills/scaffolding/setup-jd-solanki-skills/THIRD-PARTY.md) for a list of third-party skills.
4. Bam - you're ready to go.
5. Install `/context-engineering`, `/setup-project-context` and `/audit-project-context` together. Run `/setup-project-context` to give the agent this repo's own context — its words, rules, reasons, and the fences it must not walk into.

## Context engineering

An agent arrives holding coding guidelines and nothing else. `/setup-project-context` gives it the rest, split by **domain** so a task loads only what it needs:

| File                      | Reader            | Loads                                              |
| ------------------------- | ----------------- | -------------------------------------------------- |
| `AGENTS.md` / `CLAUDE.md` | agent             | every turn — behaviour and one gate                |
| `CONTRIBUTING.md`         | humans and agents | every session — what the project is and its status |
| `/project-context`        | agent             | every session — the rules and the routing table    |
| `domains/<domain>.md`     | agent             | only when a task enters that domain                |
| `README.md`               | humans            | never read by an agent                             |

`/context-engineering <decision>` records a decision in the right domain file. `/audit-project-context` runs at the end of a pull request and trims whatever the week's work added that the code could have said itself. Install all three: the other two call `/context-engineering` for the shape and the rules.

The reasoning behind all of it — why domain and not document type, why the glossary left the repo root, why the method is three skills — is in [`docs/context-engineering.md`](./docs/context-engineering.md).

Repos connected to each other also share a **landscape**, which `/setup-landscape` writes and joins each repo to. The steps for one repo or many, with an organisation example and one across owners, are in [`docs/setting-up-context.md`](./docs/setting-up-context.md).

## Tips

- Use global instruction files (`~/.claude/CLAUDE.md` & `~/.codex/AGENTS.md`) for behavioural changes and use project instructions for working instructions.

## Forked skills

Skills taken from elsewhere and changed. Each credits its source in its frontmatter.

- [`code-review`](./skills/engineering/code-review/)
- [`domain-modeling`](./skills/engineering/domain-modeling/)
- [`grilling`](./skills/engineering/grilling/)
- [`improve-codebase-architecture`](./skills/engineering/improve-codebase-architecture/)
- [`implement-spec`](./skills/in-progress/implement-spec/)
- [`tdd`](./skills/engineering/tdd/)

Used unchanged, so not forked: see [`THIRD-PARTY.md`](./skills/scaffolding/setup-jd-solanki-skills/THIRD-PARTY.md).
