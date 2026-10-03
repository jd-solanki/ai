# Authoring

## Rules

- Write and edit every skill with `/writing-for-agents`. Read its `SKILL-MECHANICS.md`
  for frontmatter and the model-invoked versus user-invoked choice.
- Commit types are `feat`, `fix`, and the rest of the conventional set. Not `docs`.
- The commit scope is the skill name: `feat(clean-code): ...`.
- A forked skill records its source and what changed in `README.md`, under **Forked
  skills**. Nothing about the fork's origin goes inside the skill itself.
- A skill folder holds steps, templates and the reference a run needs. Documentation
  *about* a method — its reasoning, its decisions, its history — goes in `docs/`.
- `docs/` is one flat folder of plain markdown. Reach for VitePress once it passes
  roughly five files, or once a section needs a public URL.
- A doc an agent needs gets a row in the `/project-context` table, wherever it sits.
  Do not move a file to make it loadable.

## Reasons

- `docs` is the wrong type here because this repository's product **is** documents. A
  change to a skill is a feature or a fix, and typing it `docs` would make every commit
  the same.
- Attribution sits in `README.md` because a block inside a skill loads every time the
  skill fires, and the reader who needs it is a human browsing the repository.
- Method documentation sits outside the skill for the same reason, plus one more: the
  skills CLI installs the **folder**, so anything left inside is shipped into every
  repository that installs the skill, whether or not that repository wants it.
- `docs/` has no site generator because this repository has no `package.json` at all.
  A build, a config and a deploy for a handful of pages would cost more than they
  return while GitHub renders the markdown for free.
- Method docs stay in `docs/` rather than moving under a skill because the reader who
  most needs them has already installed the skill into their own repository and comes
  here to browse. `docs/` is the first place they look; `skills/internal/` announces
  itself as not for them.
- `/create-spec` and `/create-ticket` file into the open milestone because the owner
  tracks issue progress (to do, in progress, reviewing, done) on GitHub Projects. The
  skills carry the rule, not this reason, so it costs no tokens
  per run.

## Fences

- **The block has exactly one home.** It lives in
  `skills/scaffolding/setup-jd-solanki-skills/SKILL.md` and is read from there. Copying
  it into this repository's `CLAUDE.md` would give one repository two copies of it, and
  the block's own single-source-of-truth rule forbids that. Read it where it lives.
- **A user-invoked skill cannot be reached by an agent.** `disable-model-invocation:
  true` strips the description from the agent's reach, so no other skill can fire it
  and no gate can name it. A skill something else must invoke has to stay
  model-invoked, whatever its context cost.

## Where it lives

`skills/scaffolding/setup-jd-solanki-skills/SKILL.md`,
`.claude/skills/writing-for-agents/`, `README.md`, `docs/`
