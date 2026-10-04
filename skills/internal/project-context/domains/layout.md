# Layout

## Rules

- A published skill lives at `skills/<category>/<skill-name>/SKILL.md`. Reference files
  sit beside it in the same folder.
- A new skill, or one still moving, starts in `skills/in-progress/`. It leaves once it
  has been used on real work and stopped changing.
- `coding` is about the code itself. `engineering` is about everything around it.
- A fork goes in the category it belongs to, never in `third-party/`. `third-party/` is
  for copies kept unchanged.
- `skills/internal/` is for skills that serve this repository only and are never
  published for installation elsewhere.
- A published skill is used here through a symlink in an agent skills directory.
  `/link-skills` makes them.
- An app lives at `apps/<name>/`, a package of the Vite+ workspace. Shared code goes in
  `packages/<name>/` once a second app needs it.
- `skills/` stays at the root and outside the workspace. A skill is not a package.
- One `.agents/` and one `.claude/`, at the root. An app holds no agent directory of its own.

## Reasons

- Reference files sit beside `SKILL.md` because the skills CLI installs the **folder**.
  A reference kept anywhere else does not travel with the skill.
- `in-progress` is an incubator borrowed from `mattpocock/skills`. It lets a skill ship
  and be used before it has settled, without claiming it is stable.
- A fork lives in its real category because we maintain it now. Filing it under
  `third-party/` would claim upstream still does. Attribution goes in `README.md`
  rather than inside the skill, so it does not load on every invocation.
- The software factory lives here, beside the skills it runs, because a change to how a
  skill is launched or run lands in both, and one project context answers a question
  about either. The library stays public: a repository that runs no factory installs from
  `skills/` and never sees the app.
- `skills/` stays at the root because the skills CLI finds published skills there and
  `/link-skills` builds its relative links from it.
- One set of agent directories because an agent works on this repository from its root,
  whichever app the task touches.

## Fences

- **`.agents/skills/` is not ours.** Those skills are installed from elsewhere and are
  overwritten on the next install, so an edit made there is lost without warning. Edit
  `skills/` and re-link.
- **`.claude/skills/` mixes two kinds of symlink.** Some point into `../../skills/`
  and are ours to edit; some point into `../../.agents/skills/` and are not. Run
  `ls -la .claude/skills/` and read the target before editing through a link.
- **`/link-skills` hardcodes `skills/<category>/<name>`.** A skill placed directly
  under `skills/` cannot be linked, because the relative depth it builds is wrong.
  `skills/productivity/link-skills/SKILL.md`
- **`CLAUDE.md` is a symlink to `AGENTS.md`.** Both agents read one file, so a tool
  that refuses to write through a symlink must be pointed at `AGENTS.md` instead.
- **`vp fmt` formats Markdown.** The staged pre-commit hook would rewrite every skill
  committed, changing its hash in every repository that installed it, and would rewrite
  the files the skills CLI owns. `fmt.ignorePatterns` in `vite.config.ts` keeps it out of
  `skills/`, `.agents/`, `.claude/` and `skills-lock.json`.
- **`npx` refuses to run at the root.** `devEngines` in `package.json` names pnpm, and npm
  stops on any other package manager. Run the skills CLI as `pnpm dlx skills@latest`.
- **`skills add -a claude-code` alone copies.** The CLI copies whenever every target agent
  shares one skills directory, so the skill lands in `.claude/skills/` and nowhere else.
  Pass `-a claude-code universal`: two directories make it keep `.agents/skills/` and link.

## Where it lives

`apps/`, `vite.config.ts`, `pnpm-workspace.yaml`, `skills/`, `.agents/skills/`, `.claude/skills/`, `skills-lock.json`,
`skills/productivity/link-skills/SKILL.md`, `AGENTS.md`
