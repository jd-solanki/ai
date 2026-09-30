# JD Solanki's AI Agent Skills

<a href="https://skilld.dev/gh/jd-solanki/skills">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://skilld.dev/b/jd-solanki/skills?theme=dark">
    <source media="(prefers-color-scheme: light)" srcset="https://skilld.dev/b/jd-solanki/skills?theme=light">
    <img alt="Skill repository on skilld.dev" src="https://skilld.dev/b/jd-solanki/skills?theme=light">
  </picture>
</a>

## Setup

1. Run the skills.sh installer:

    ```shell
    npx skills@latest add jd-solanki/skills
    ```

2. Pick the skills you want, and which coding agents you want to install them on. **Make sure you select /setup-jd-solanki-skills.**
3. Run `/setup-jd-solanki-skills` in your agent. It will:
    - Upsert instructions into your `CLAUDE.md` or `AGENTS.md` file(s) for how to load and use these skills.
    - Suggest you install and use third-party skills that I mostly use in my projects. See [`THIRD-PARTY.md`](./skills/scaffolding/setup-jd-solanki-skills/THIRD-PARTY.md) for a list of third-party skills.
4. Bam - you're ready to go.
5. Install `/context-engineering`, `/setup-project-context` and `/audit-project-context` together. Run `/setup-project-context` to give the agent this repo's own context — its words, rules, reasons, and the fences it must not walk into.

## Context engineering

An agent arrives holding coding guidelines and nothing else. `/setup-project-context` gives it the rest, split by **domain** so a task loads only what it needs:

| File | Reader | Loads |
| --- | --- | --- |
| `AGENTS.md` / `CLAUDE.md` | agent | every turn — behaviour and one gate |
| `CONTRIBUTING.md` | humans and agents | every session — what the project is and its status |
| `/project-context` | agent | every session — the rules and the routing table |
| `domains/<domain>.md` | agent | only when a task enters that domain |
| `README.md` | humans | never read by an agent |

`/context-engineering <decision>` records a decision in the right domain file. `/audit-project-context` runs at the end of a pull request and trims whatever the week's work added that the code could have said itself. Install all three: the other two call `/context-engineering` for the shape and the rules.

The reasoning behind all of it — why domain and not document type, why the glossary left the repo root, why the method is three skills — is in [`docs/context-engineering.md`](./docs/context-engineering.md).

## Tips

- Use global instruction files (`~/.claude/CLAUDE.md` & `~/.codex/AGENTS.md`) for behavioural changes and use project instructions for working instructions.

## Forked skills

Skills taken from elsewhere and changed. They are maintained here now, so they live in their real category rather than under `third-party/`.

- **[`skills/engineering/code-review`](./skills/engineering/code-review/)** — from [mattpocock/skills](https://github.com/mattpocock/skills).
  The Standards axis reads `/project-context` instead of `CONTRIBUTING.md`, because this repo's rules live in domain files. The spec source uses `gh` directly, because `docs/agents/issue-tracker.md` is no longer part of the layout.
- **[`skills/engineering/domain-modeling`](./skills/engineering/domain-modeling/)** — from [mattpocock/skills](https://github.com/mattpocock/skills).
  The glossary moved from a root `CONTEXT.md` into `/project-context`, and the multi-context `CONTEXT-MAP.md` branch was dropped: a term used inside one domain now lives in that domain file's **Words**.
- **[`skills/in-progress/grilling`](./skills/in-progress/grilling/)** — from [mattpocock/skills](https://github.com/mattpocock/skills).
  The frontier is filtered by **altitude**: the goal always clears it, a technical question only when it is a one-way door, and every two-way door is the agent's to settle and list under **Assumed**. `/codebase-design` and `/domain-modeling` supply the vocabulary for the two levels, and the session closes on an ADR offer.

Used unchanged, so not forked: see [`THIRD-PARTY.md`](./skills/scaffolding/setup-jd-solanki-skills/THIRD-PARTY.md).
