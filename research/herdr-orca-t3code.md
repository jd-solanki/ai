# Herdr, Orca and T3 Code: hosting a factory session from another program

Researched 2026-10-29; a snapshot, true as of that date. Evidence: **(F)** fetched and read;
**(S)** search snippet only; **(I)** inferred by the author. A tag covers the claims before it,
back to the previous tag. Numbers in brackets point to [Sources](#sources). Herdr is cited from
its installed 0.9.5 CLI. Orca and T3 Code are cited from their `main` source trees, downloaded
2026-10-29 (heads about `83909a9` and `d7935f1`), as `orca:path` and `t3:path`.

## Summary

- **Orca can host the factory's `claude` command the way Herdr does.** `orca terminal create
--worktree path:<clone> --command "<claude …>"` opens a visible terminal tab without taking
  focus and types the command into the tab's login shell. `terminal rename`, `terminal close
--tab` and `worktree ps` cover the other steps. [5][6] (F)
- **T3 Code cannot.** It runs no agent TUI. It drives each provider over that provider's own
  protocol: Claude through the Claude Agent SDK, Codex through app-server, others over ACP. Its
  agent list shows only these _threads_. From outside it takes a prompt and options, through
  `t3 thread start <project> "<message>"` or the MCP tool `t3_thread_launch`. [13][14][15][18] (F)
- Herdr and Orca also have their own agent launchers (`herdr agent start --kind claude`, `orca
agent launch --agent claude`). Neither passes the factory's free-form flags, so the
  arbitrary-command path is the one that fits. [1][6] (F)
- Worktrees: Herdr leaves them to you. Orca calls itself "worktree-native", but it also hosts
  terminals in a repo's main checkout, and it files Claude Code's own worktrees under "Non-Orca
  worktrees", hidden by default. So `claude --worktree` does not clash with it. T3 Code creates
  worktrees itself (`--worktree <base-ref>`), and a thread has no place to pass `claude
--worktree`. [1][7][14][15] (F)
- State read back: Herdr reports `idle`/`working`/`blocked`/`done`, Orca reports
  `working`/`blocked`/`waiting`/`done` for each agent row, and T3 Code reports a run status
  (`running`, `waiting`, `completed`, `failed` …). [1][10][16] (F)
- A `claude` typed into an Orca terminal should show as an agent. Orca writes its status hooks
  into `~/.claude/settings.json`, the hooks only report when `ORCA_PANE_KEY` is set, and Orca sets
  that variable in every pane it spawns. [10] (F) Not checked at runtime, and Orca's docs advise
  starting agents from its picker when no status shows. [8] (I)
- Maturity: Herdr 0.9.5 (Apache-2.0, a release every few days), Orca 1.4.244 (MIT, about one a
  day), T3 Code 0.1.4 (MIT, several nightlies a day, "very very early"). [2][11][12][19][21] (F)

## The factory's Herdr steps in each tool

| Factory step (Herdr today)       | Herdr 0.9.5                                                      | Orca 1.4.244                                                                                                                  | T3 Code 0.1.4                                                                                              |
| -------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Find the repo workspace          | `herdr pane list` (JSON `cwd`, `workspace_id`)                   | `orca worktree show --worktree path:<clone> --json`; a registered repo's main checkout is a workspace                         | `t3 thread start .` resolves the project containing the cwd; no workspace or pane                          |
| Else create it                   | `herdr workspace create --cwd <clone> --label <name> --no-focus` | `orca repo add --path <clone> --json`                                                                                         | `t3_project_create` (MCP)                                                                                  |
| New tab, focus kept              | `herdr tab create --workspace <id> --cwd <clone> --no-focus`     | `orca terminal create --worktree path:<clone> --command <text>`; focus moves only with `--focus`                              | **lacks**: the unit is a thread, not a tab                                                                 |
| Label the tab                    | `herdr tab rename <tab> <label>`                                 | `--title` on create, or `orca terminal rename --terminal <h> --title <label>`                                                 | `t3 thread start --title`; `t3_thread_update` renames                                                      |
| Wait for the shell prompt        | `herdr pane wait-output <pane> --regex '\S' --timeout 10000`     | No regex wait; `terminal read` to poll, `terminal wait --for exit\|tui-idle`                                                  | not applicable                                                                                             |
| Type the `claude …` line         | `herdr pane run <pane> <command>`                                | `--command` on create ("typed into whatever shell the host started"), or `orca terminal send --terminal <h> --text … --enter` | **lacks**: takes a message, plus `--provider`, `--model`, `--worktree`, `--branch`                         |
| Close at run end                 | `herdr tab close <tab>`                                          | `orca terminal close --terminal <h> --tab` ("stops the process")                                                              | No process per thread: `t3_thread_interrupt`, then archive via `t3_thread_organize`; neither is in the CLI |
| Listed beside the owner's agents | `herdr agent list`                                               | `orca worktree ps --json` agent rows, if the hooks fire (I)                                                                   | yes, as a thread like the owner's (I)                                                                      |

Commands from [1], [3], [5], [6], [14] and [15]. (F) The two cells marked (I) are inferred.

## Herdr

- **Category.** It calls itself a "terminal workspace manager for AI coding agents" (`herdr
--help`) and "the runtime your coding agents live on", and says "herdr doesn't wrap or replace
  them; it owns their terminals." [1][2] (F)
- **Surface.** One CLI (`herdr workspace|tab|pane|agent|worktree …`) over a local socket API.
  `--machine` targets a saved SSH machine. Plugins call the same CLI. [1][2] (F)
- **Command vs integration.** Herdr hosts any command (`pane run`). Its own `agent start --kind
<kind>` supports 24 kinds, `claude` and `codex` among them. It "waits for interactive
  readiness", which a session busy with its prompt never reaches, so the factory types the
  command instead. `herdr integration install claude` installs status hooks. [1][3] (F)
- **Worktrees.** Optional: `herdr worktree create|open|remove` makes "Git worktree-backed
  workspaces". Nothing requires them, so `claude --worktree` stays the factory's. [1] (F)
- **UI and state.** Every pane is marked working, blocked or idle. `agent wait --until` accepts
  `idle|working|blocked|done|unknown`. The factory never ends a run on these states, because
  `idle` and `done` do not prove the run is over. [1][2][3] (F)
- **Platform, licence, maturity.** Linux, macOS and Windows (a PowerShell installer and an
  "endpoint-protected Windows" beta page). Apache-2.0. Created 2026-03-27. v0.9.4 and v0.9.5
  shipped on 2026-10-13 and 2026-10-14, with preview builds in between. [2][21] (F)

## Orca

- **Identity.** Confirmed as `stablyai/orca` by Stably AI. Its README calls it "The AI
  Orchestrator for 100x builders" and says "Run Codex, ClaudeCode, OpenCode or Pi side-by-side —
  each in its own worktree". The repo describes it as "the place for working with a fleet of
  agents", and its docs say "Orca is worktree-native." [4][7][21] (F) An older README called it
  "the ADE for working with a fleet of parallel agents". (S)
- **Surface.** The `orca` CLI ships with the desktop app; on Linux it is `orca-ide`, because GNOME's
  screen reader owns `orca`. The CLI reaches a running Orca (the desktop app, or headless `orca
serve`) over a Unix socket or named pipe, or over WebSocket for a paired server. There are also
  skills and MCP. [5][10] (F) The RPC behind the CLI (`terminal.create` and so on) is not
  documented as a public API. (I)
- **Command vs integration.** Orca does both. "Works with any CLI agent — if it runs in a
  terminal, it runs in Orca." `terminal create` "creates a terminal and runs --command in it".
  `orca agent launch --agent claude` takes `--prompt`, `--model`, `--effort` and `--surface
chat|terminal`. A terminal launch adds `--dangerously-skip-permissions` by default; that flag
  can be changed per agent in Settings, not per launch. The experimental Chat UI runs Claude
  through `@anthropic-ai/claude-agent-sdk`. No launch flag takes arbitrary CLI arguments, so the
  factory's `--settings`, `--worktree` and `--permission-mode auto` need `terminal create`.
  [4][6][8][9][10] (F)
- **Worktrees.** By default each task gets its own worktree, branched from the repo's base ref,
  and deleting the worktree removes the folder and the branch. The main checkout is a workspace
  too. Worktrees made outside Orca, Claude Code's included, are "Non-Orca worktrees", hidden
  until shown. So the factory can open its tab on the clone and keep `claude --worktree` and
  `baseRef: fresh`. [7] (F) If it used Orca's worktrees instead, Orca's first-work branch rename
  (`orca:src/main/agent-hooks/first-work-branch-rename.ts`) might rename their branches. (I)
- **UI and state.** Agent rows show working, waiting on you, done, blocked or idle. "State is
  detected from the terminal's OSC title sequence and agent hooks". The hook script exits unless
  `ORCA_PANE_KEY` and the hook endpoint are set (`orca:src/main/claude/hook-script.ts`). Every
  spawned pane gets `ORCA_PANE_KEY` (`orca:src/main/ipc/pty/spawn-pane-env.ts`). `orca worktree ps
--json` returns a `state` for each agent, and `terminal wait --for exit` waits for the process
  to end. [8][10] (F) The docs hedge: "If you don't see status indicators … start it through the
  agent combobox rather than typing the binary by hand." [8] (F)
- **Platform, licence, maturity.** macOS, Windows and Linux (AppImage, .deb, .rpm), with iOS and
  Android companion apps. MIT. Created 2026-03-17. v1.4.241 to v1.4.244 shipped daily from
  2026-10-26 to 2026-10-29. [4][11][21] (F)

## T3 Code

- **Identity.** Confirmed as `pingdotgg/t3code` by Ping.gg. "T3 Code is an 'agent harness
  control surface'", with mobile, web and Electron desktop clients. [12] (F) Maintained by Theo
  (`t3dotgg`) and Julius Marminge. (S)
- **Surface.** A server (`t3`, also bundled in the desktop app) offers an authenticated
  WebSocket RPC to its own clients and an MCP server at `<environment>/mcp`, signed in with
  OAuth. On the host, `t3 thread list|start|send|show` works "without a sign-in". [12][13][14][17]
  (F)
- **Command vs integration.** T3 Code starts agents only through its own integrations. Claude
  runs through `@anthropic-ai/claude-agent-sdk`, Codex through app-server
  (`t3:packages/effect-codex-app-server`), and others over ACP or their own RPC. It supports
  Codex, Claude, Cursor, Grok Build, OpenCode and Antigravity. The CLI takes `t3 thread start
<project> <message> [--title --provider --model --worktree --branch --wait --json]`. MCP
  `t3_thread_launch` also takes `runtimeMode` (`approval-required`, `auto-accept-edits`, `auto`,
  `full-access`), `interactionMode` and model `options`. [12][14][15][16][18] (F) Extra Claude
  CLI flags exist only as a "Launch arguments" setting on a provider instance, so a per-run
  `--settings` holding the run's token has no per-thread home. Terminals (`terminal.open`) take
  a `threadId`: they belong to a thread and are not agent sessions. [16] (F)
- **Worktrees.** T3 Code creates them. `--worktree <base-ref>` means "Run in a new git worktree
  based on this branch, tag, or commit, instead of the project folder". New worktrees go in the
  T3 home's `worktrees` folder. The MCP strategy `existing_worktree` binds a worktree that
  already exists. [14][15][17] (F) With no per-thread `claude --worktree`, T3 would own the
  factory's worktrees. (I)
- **UI and state.** Threads live on the server and every client subscribes to them, so a
  scripted thread should show like one the owner started. [17] (I) A run's status is one of
  `preparing`, `queued`, `starting`, `running`, `waiting`, `completed`, `interrupted`, `failed`,
  `cancelled` or `rolled_back`. `t3 thread send --wait` "exits 1 when the run fails or stops, and
  2 when the agent waits for an answer". The Claude session loads `user`, `project` and `local`
  settings (`t3:apps/server/src/orchestration-v2/Adapters/ClaudeAdapterV2.ts`). [13][16][18] (F)
  That suggests the owner's own `~/.claude` hooks still fire, which was not tested. (I)
- **Platform, licence, maturity.** macOS (Homebrew), Linux (.deb, AUR, Nix) and Windows (winget,
  scoop), plus a headless `t3 service`. MIT. Created 2026-02-08. Stable v0.1.4 shipped on
  2026-10-29, with several nightlies a day. "We are very very early in this project. Expect
  bugs." It is "(mostly) not accepting contributions". [12][19][21] (F)

## Peers

- **cmux** (`manaflow-ai/cmux`) is a "Ghostty-based macOS terminal with vertical tabs and
  notifications for AI coding agents", with a "CLI and socket API to create workspaces, split
  panes, send keystrokes". It hosts any command, as Herdr does, but runs only on macOS, not on
  this Linux machine. [20] (F)

## What this means for the factory

- A seam at "host a terminal session" fits Herdr and Orca without touching `claudeArgs`. It
  needs `open(clone, label, command) → handle` and `close(handle)`. Each host does its own
  find-or-create, rename and prompt wait. (I)
- On both terminal hosts the run's end stays on Claude Code's hooks. Orca's `done`, like Herdr's,
  is a UI state, not a clean stop. (I)
- T3 Code does not fit that seam. To include it, the seam must sit above `claudeArgs`: a launch
  request (skill, work-item URL, instructions, effort, worktree name, allow list) that each host
  turns into its own launch. The T3 host would read the end from the run status (`t3 thread show
--json`, `t3_thread_wait`) rather than from per-run hooks. (I)
- Worktrees: the terminal hosts keep `claude --worktree` and `baseRef: fresh`. A T3 host would use
  `--worktree origin/<default> --branch <name>` on a first run and `existing_worktree` on a
  re-trigger. (I)
- T3 has no per-thread `--settings`, so a trigger's `allow` list and the auto-mode request would
  have to become `runtimeMode: auto` plus settings in the served repo, or one provider instance per
  permission set. (I)
- For Orca: call `orca-ide` on Linux, register each clone once with `orca repo add`, and check
  one run by hand before relying on it. (I)

## Tried by hand

Run the same day in Orca 1.4.244 on Linux, in Orca's `/tmp` workspace, which held no other
terminal. Each tab was closed by its own handle. [22] (F)

- **The CLI.** On Linux, `orca-ide` on `PATH` starts the Electron app (it aborted on the SUID
  sandbox), not the CLI. The CLI is `orca`, a shim in `~/.config/orca/linux-orca-cli-shim/`,
  which Orca puts on `PATH` in its own terminals as `ORCA_CLI_BIN_DIR`. That corrects the
  `orca-ide` advice above.
- **Typing at startup.** Four `terminal create --command` runs, with no wait for the prompt, all
  ran their command: three `echo`s, and one factory-shaped `claude` line holding `--settings` JSON,
  whose session came up named, in auto mode.
- **The agent row.** That `claude` showed in `orca worktree ps --json` as an agent, `agentType:
claude`, `state: done` after its turn, with its prompt and its tab's pane key. Orca's status
  hooks sit in `~/.claude/settings.json` and act on the `ORCA_PANE_KEY` every Orca pane carries.
- **The factory's hooks.** UserPromptSubmit fired, then Stop with `background_tasks: []`.
- **Closing the tab.** `terminal close --terminal <h> --tab` ended the session. Claude Code fired
  SessionEnd with `reason: "other"`, as on herdr's close, and the tab's shell then ran the command
  after `claude`. Every close answered `ptyKilled: false`, though each tab's process was gone
  afterwards.
- **The workspace.** Closing the last tab left Orca's `/tmp` workspace in place, where herdr
  removes a workspace the factory opened along with its last tab.
- **An unregistered clone.** `terminal create --worktree path:<clone>` on a git repo Orca had not
  registered failed with `selector_not_found`. After `orca repo add --path <clone>` the same
  create opened the tab and ran its command. `repo add` wrote nothing into the repo's top level,
  and run again on a registered path it answered `ok` with the same repo id, adding no second
  entry. The CLI has no command that unregisters a repo.

## Not verified

- T3 Code was not run; its behaviour is from docs and source.
- Whether stopping Orca itself makes Claude Code fire SessionEnd: quitting it would have
  closed the owner's running sessions.
- Whether a thread started with `t3 thread start` appears in the desktop app without a reload,
  and whether `/implement-spec …` in its message runs as a skill through the SDK.

## Sources

1. herdr 0.9.5 `--help`, and `--help` for `workspace`, `tab`, `pane`, `agent`, `worktree` and `integration` and their subcommands, run locally 2026-10-29, FETCHED
2. [Herdr README](https://github.com/herdrdev/herdr/blob/main/README.md), `main`, FETCHED
3. This repo: `apps/software-factory/src/session.ts` (`startSession`, `closeTab`) and `.claude/skills/project-context/domains/sessions.md`, FETCHED
4. [Orca README](https://github.com/stablyai/orca/blob/main/README.md), `main`, FETCHED
5. Orca docs, `orca:docs/site/content/docs/cli/overview.mdx` and `cli/reference.mdx`, the source of [onorca.dev/docs/cli](https://www.onorca.dev/docs/cli/overview), FETCHED
6. Orca CLI specs and handler: `orca:src/cli/specs/core.ts`, `specs/agent-launch.ts`, `specs/terminal-close.ts`, `handlers/terminal.ts`, FETCHED
7. Orca docs, `orca:docs/site/content/docs/model/worktrees.mdx`, FETCHED
8. Orca docs, `orca:docs/site/content/docs/model/agents-sessions.mdx`, FETCHED
9. Orca docs, `orca:docs/site/content/docs/agents/claude-code.mdx`, `agents/hooks-memory.mdx`, `agents/native-chat.mdx`, FETCHED
10. Orca source: `orca:src/main/claude/hook-settings.ts`, `hook-script.ts`, `src/main/ipc/pty/spawn-pane-env.ts`, `src/shared/runtime-worktree-contracts.ts`, `src/shared/agent-status-types.ts`, `src/cli/runtime/transport.ts`, `package.json`, FETCHED
11. [Orca releases](https://github.com/stablyai/orca/releases), GitHub API, 2026-10-29, FETCHED
12. [T3 Code README](https://github.com/pingdotgg/t3code/blob/main/README.md), `main`, FETCHED
13. [T3 Code, "Outside agents"](https://github.com/pingdotgg/t3code/blob/main/docs/user/outside-agents.md), FETCHED
14. T3 Code CLI, `t3:apps/server/src/cli/thread.ts`, FETCHED
15. T3 Code MCP tools, `t3:apps/server/src/mcp/toolkits/project/tools.ts`, `orchestrator/tools.ts`, `thread/tools.ts`, FETCHED
16. T3 Code contracts, `t3:packages/contracts/src/providerPolicy.ts`, `orchestrationV2.ts`, `terminal.ts`, `rpc.ts`, `settings.ts`, FETCHED
17. T3 Code docs, `t3:docs/internals/overview.md`, `providers.md`, `terminal-runtime.md`; `docs/user/permission-modes.md`, `project-settings.md`, `providers-claude.md`, FETCHED
18. T3 Code Claude adapter, `t3:apps/server/src/orchestration-v2/Adapters/ClaudeAdapterV2.ts` and `apps/server/package.json`, FETCHED
19. [T3 Code releases](https://github.com/pingdotgg/t3code/releases), GitHub API, 2026-10-29, FETCHED
20. [cmux README](https://github.com/manaflow-ai/cmux/blob/main/README.md), `main`, FETCHED
21. GitHub repo metadata (description, licence, created date) for `herdrdev/herdr`, `stablyai/orca`, `pingdotgg/t3code` and `manaflow-ai/cmux`, GitHub API, 2026-10-29, FETCHED
22. Orca 1.4.244 CLI, `orca terminal create|read|close` and `orca worktree ps`, with a `claude` probe whose hooks logged to a file, run locally 2026-10-29, FETCHED
