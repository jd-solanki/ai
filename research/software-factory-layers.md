# Software factory layers: how orchestrators split into swappable parts, and what they call them

Researched 2026-10-29; a snapshot, true as of that date. Evidence: **(F)** fetched and
read; **(S)** search snippet only; **(I)** inferred by the author. A tag covers the claims
before it, back to the previous tag. Numbers in brackets point to [Sources](#sources);
sources marked "summarised" were read through a summarising fetch, not as raw text.

## Summary

- The role Herdr plays is most often called the **runtime**: Composio AO's slot 1 is
  "Runtime — where sessions execute (tmux, docker, k8s, process)", Scion has a `Runtime`
  under a Runtime Broker, and Herdr's own tagline is "the runtime your coding agents live
  on". [5][20][25] (F)
- Gas City is the closest match: it ships a **herdr** and a **t3bridge** (T3 Code)
  implementation beside tmux, k8s, ssh, subprocess and exec, and calls the layer the
  **session provider** (`runtime.Provider`), picked city-wide by `[session] provider =
"herdr"` or `GC_SESSION`, one per city (ACP sessions route apart). [11][12] (F)
- Every system with a swap model keeps the **harness** (Claude Code, Codex) apart from the
  runtime: AO "Agent" vs "Runtime", Scion "Harness" vs "Runtime", Gas City agent provider
  vs session provider, gh-aw "engine" vs "sandbox". [5][11][13][20] (F)
- AO v1 also splits the runtime (where the process lives) from the **Terminal** slot,
  "human interaction UI (iterm2, web)". Herdr fills both; T3 Code calls itself an "agent
  harness control surface", which is the viewing half only. [5][26] (F)
- Two coherent word pairs exist: **slot / plugin** (AO v1) and **port / adapter** (AO v2,
  Symphony's tracker, Cockburn). "Provider" is overloaded: Gas City's own design doc counts
  three things it calls "provider". [3][5][12][28] (F)
- Cardinality splits the same way almost everywhere: runtime, workspace and tracker take
  one implementation at a time (AO v2's `multi` tracker adapter is the exception). Notifiers (`notifiers: [desktop]`), triggers (one gh-aw
  workflow file each, Gas City orders, OpenHands automations) and the harness choice per
  role take several at once. [1][5][9][10][13][17] (F)
- Triggers are rarely a plugin slot. They are usually config per workflow: Symphony polls
  tracker states, gh-aw has a one-shot `label_command`, OpenHands' own "Software Factory"
  polls on a cron for a "Trigger label", and Gas City "Orders" pair a trigger with a
  formula. [1][10][13][17] (F)
- A layer list to copy: Trigger (several) → Tracker (one; GitHub) → Workspace (one) →
  Harness (one per agent; it owns the end-of-session signal, as AO's Agent and Gas Town's
  hook tiers do) → Runtime (one) → Notifier (several). The core that claims and hands off
  stays unswappable, as AO keeps "Lifecycle" in core. (I)

## Comparison

| System                          | Word for a layer         | Word for one implementation              | Cardinality, chosen by                                                           | Name for what hosts the session                  | Harness kept separate?                    |
| ------------------------------- | ------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------- |
| OpenAI Symphony                 | layer, component         | adapter (tracker), extension             | one tracker: `tracker.kind` in `WORKFLOW.md`; one agent (Codex app-server)       | Agent Runner; SSH "worker host" (extension)      | no: Codex app-server is fixed             |
| Composio AO v1 (TS, Feb 2026)   | slot                     | plugin (`PluginModule`, `manifest.slot`) | one per slot per project in `agent-orchestrator.yaml`; notifiers a list          | Runtime; Terminal for the human view             | yes: Agent / Runtime / Terminal           |
| AO v2 (Go, now OrchestratorInc) | port                     | adapter                                  | runtime picked by OS; agent per session; `multi` tracker and SCM adapters        | runtime (native PTY, ConPTY, tmux legacy)        | yes: agent adapter / runtime / chatdriver |
| Gas Town                        | role                     | agent preset                             | agent per role (`role_agents`) in settings JSON                                  | tmux session ("tmux shim layer")                 | yes, but tmux is fixed                    |
| Gas City                        | provider kind, primitive | provider, backend                        | session provider city-wide (`city.toml`, `GC_SESSION`); agent provider per agent | session provider / runtime provider              | yes: agent provider vs session provider   |
| StrongDM Attractor              | layer                    | handler, backend, implementation         | handlers registered per node type (many); backend is the implementor's choice    | Host Application; ExecutionEnvironment for tools | yes: CodergenBackend hides the harness    |
| GitHub gh-aw                    | frontmatter section      | engine                                   | one engine per workflow file; many workflow files                                | GitHub Actions job + `sandbox.agent: awf`        | yes: engine vs sandbox                    |
| Vibe Kanban                     | (none named)             | executor; profile variant                | executor + variant per task attempt                                              | container (`ContainerService`)                   | yes: executor vs container                |
| OpenHands                       | component, service       | workspace class, backend                 | workspace per conversation; Canvas connects to one or more backends              | Agent Server inside a "workspace or sandbox"     | yes: agent vs workspace vs Canvas         |
| Google Scion                    | (none named)             | runtime, harness                         | runtime per profile in `settings.yaml` or a CLI flag; harness per template       | Runtime Broker + Runtime                         | yes: Harness vs Runtime                   |
| AWS CAO                         | (none named)             | provider (= agent CLI)                   | per agent profile                                                                | tmux "terminal sessions"                         | yes: provider CLI vs tmux                 |

## OpenAI Symphony

- **Layers.** SPEC §3.2 "Abstraction Levels": Policy Layer (`WORKFLOW.md` prompt),
  Configuration Layer, Coordination Layer (orchestrator: "Polling loop, issue eligibility,
  concurrency, retries, reconciliation"), Execution Layer ("workspace + agent subprocess"),
  Integration Layer ("selected tracker adapter"), Observability Layer. §3.1 lists the
  components: Workflow Loader, Config Layer, Issue Tracker Adapter, Orchestrator, Workspace
  Manager, Agent Runner, Status Surface (optional), Logging. [1] (F)
- **Units.** The tracker is the one swap point: `tracker.kind` "Selects one
  implementation-supported tracker adapter"; External Dependencies says "One configured
  issue tracker API". The Elixir reference has asana, github, gitlab, jira and linear
  adapters. Optional parts are "extensions" (HTTP server, SSH worker). [1][2] (F)
- **Host.** The Agent Runner "Launches the coding agent app-server client" with
  `bash -lc <codex.command>` in the workspace. Appendix A runs it "over SSH stdio" on
  `worker.ssh_hosts`. The protocol is Codex app-server only, so the harness is not a
  layer. [1] (F)
- **Trigger.** A poll tick every `polling.interval_ms` fetches issues in `active_states`
  that carry every `required_labels` label. Polling is not swappable; only the tracker
  behind it is. [1] (F)

## Composio Agent Orchestrator (AO)

- **v1 (TypeScript, Feb 2026).** `types.ts`: "Architecture: 8 plugin slots + core
  services": Runtime ("where sessions execute"), Agent ("AI coding tool"), Workspace
  ("code isolation (worktree, clone)"), Tracker, SCM, Notifier, Terminal ("human
  interaction UI"), and "Lifecycle Manager (core, not pluggable)". A plugin exports
  `PluginModule { manifest: { name, slot, ... }, create(config) }`. The Agent plugin "Knows
  how to launch, detect activity, and extract session info". `agent-orchestrator.yaml`
  sets `defaults: { runtime: tmux, agent: claude-code, workspace: worktree, notifiers:
[desktop] }`, overridable per project: one of each, and a list of notifiers. Intake is
  `ao spawn <project> [issue]`, then "reactions" to CI and review events. [5] (F) Read
  from a fork snapshot (`mnemom/composio-ao@4cda437`); upstream no longer serves it. (I)
- **v2 (Go daemon, today).** The repo now redirects to `OrchestratorInc`. "Port-based
  design: Core code never depends on concrete implementations"; ports are "boundary
  interfaces ... to replaceable adapters such as runtimes, workspaces, trackers". Adapters:
  `agent` ("23+ agent harnesses"), `chatdriver`, `runtime` (`ptyexec`, `conpty`, `tmux`),
  `workspace` (`gitworktree`, `scratch`), `scm` and `tracker` (github, gitlab, `multi`).
  `runtimeselect` picks the runtime "by platform", not by config. Each session has one
  "interface mode": TUI (agent in a PTY runtime) or Chat (a protocol driver). Intake: "User
  spawns session"; "SCM Observer and Runtime Reaper poll external state". [3][4] (F)

## StrongDM software factory and Attractor

- **Factory.** "Non-interactive development where specs + scenarios drive agents that
  write code". The post names no hosting or layer model. [8] (F, summarised)
- **Attractor** ("a non-interactive Coding Agent sufficient for use in a Software
  Factory"). "Attractor defines the orchestration layer"; each DOT node runs a "handler"
  from a registry. The LLM step takes a `CodergenBackend`, which may "spawn CLI agents
  (Claude Code, Codex, Gemini CLI) in subprocesses, run agents in tmux panes with a manager
  attaching to them". "The pipeline engine is headless; the presentation layer is
  separate"; human input goes through an `Interviewer`. No trigger layer. [6] (F)
- **Coding Agent Loop spec.** Host Application (CLI, IDE, Web UI) → Coding Agent Loop
  (Session, Provider Profiles, Tool Registry, Execution Env) → Unified LLM SDK.
  `ExecutionEnvironment` is "where tools run": local, Docker, k8s, WASM, SSH. [7] (F)

## Steve Yegge's Gas Town, and Gas City

- **Gas Town.** It "orchestrates coding agents ... through tmux sessions"; "Integration
  is configuration, not compilation". Roles: Mayor, Deacon, Dogs; per rig Polecat,
  Refinery, Witness, Crew. Any terminal CLI works at Tier 0 via `send-keys` and
  `capture-pane` ("the tmux shim layer"); Tier 1 is a JSON "preset" in `agents.json`. The
  harness is picked per role: `role_agents[role]` → rig `agent` → town `default_agent` →
  `"claude"`. Intake: work is "slung" onto an agent's Hook; "If there is work on your
  Hook, YOU MUST RUN IT". [9] (F)
- **Gas City** (the successor, an "Orchestration-builder SDK"). Six primitives (Agent,
  Bead, Formula, Rig, Pack, Event) on an Orchestrator, Bead store and Event bus. "When an
  agent is running it is a session ... The engine backing that session is its provider".
  Intake: "Orders" pair "a trigger (cooldown, cron, condition, event, or manual) with the
  formula to fire", many at once. [10] (F)
- **Its host layer.** `runtime.Provider` "manages agent sessions": `tmux`, `herdr`, `k8s`,
  `ssh`, `subprocess`, `exec`, `acp`, `t3bridge`, `hybrid`, `auto`. Herdr is "a native
  herdr session-provider backend as an opt-in alternative to tmux: one shared herdr
  session-server per city, one workspace per rig ..., and one tab per agent". The selector
  is city-wide or per process; "herdr cannot be selected for individual agents", and only
  the ACP transport routes one agent elsewhere. `exec:<script>` lets "any terminal
  multiplexer or process manager" be a backend. The bead store swaps the same way. [11][12]
  (F)

## GitHub Agentic Workflows (gh-aw)

- **Parts.** A workflow is a Markdown file whose frontmatter holds `on:`, `engine:`,
  `tools`, `sandbox`, `safe-outputs`. "An engine runs a workflow's Markdown instructions
  with its configured tools, sandbox, and safe outputs": `copilot` (default), `claude`,
  `codex`, `gemini`, `pi`, `agy`, or a custom one. Here `harness` names a wrapper script
  around the engine CLI. One engine per workflow, many workflows per repo. The session runs
  in an Actions job inside the "Coding Agent Sandbox" (`sandbox.agent: awf`). [13] (F)
- **Trigger.** Any Actions event, `slash_command`, and `label_command`, which "activates a
  workflow when a specific label is applied ... and automatically removes that label",
  "a one-shot command rather than a persistent state marker". [13] (F)

## Vibe Kanban (BloopAI)

- Each harness is an **executor**: `enum CodingAgent { ClaudeCode, Amp, Gemini, Codex,
Opencode, CursorAgent, ... }` behind `trait StandardCodingAgentExecutor { spawn,
spawn_follow_up, ... }`. `default_profiles.json` holds named variants per executor
  (`"CLAUDE_CODE": { "DEFAULT": {...} }`), the UI's "Agent Profiles", picked at "attempt
  creation", so per run. Where it runs sits behind `trait ContainerService`, implemented in
  `local-deployment`. A 2025-09-02 migration renamed "profile" to "executor". [14][15] (F)
  Intake is a human starting an attempt. (I)

## OpenHands

- **Components.** Agent Canvas (client; "not an agent runtime or sandbox"), Agent Server
  ("Runs conversations, agents, tools, and workspace operations"), Automation Server
  ("Stores schedules and event triggers ... and dispatches conversations"), and "Workspace
  or sandbox" ("Defines which files, processes, credentials, and networks an agent can
  access"). The Canvas talks to a "selected backend". The SDK's `BaseWorkspace` has Local,
  Remote, Docker, RemoteAPI, Apptainer and Cloud implementations. [16][18] (F)
- **Its own "Software Factory".** Four automations (triage, developer, reviewer,
  watchdog) polling on `*/5 * * * *`, each with an "agent profile" holding only its role's
  GitHub token; triage applies `ready-for-dev`, the developer's "Trigger label". [17] (F)
  The older resolver fired on a `fix-me` label or an `@openhands-agent` mention. [19] (S)

## Others

- **Google Scion.** Hub ("stateful API server"), Runtime Broker ("a compute node that
  executes agents"; "the only component that starts agent containers"), Runtime ("abstracts
  container lifecycle operations": Docker, Podman, Apple Container, Kubernetes), Harness
  ("encapsulates LLM-specific behavior": claude, gemini, opencode, codex, generic),
  Template, Project. The runtime comes from the profile's `runtime` in `settings.yaml`, a
  CLI flag overriding it. The harness comes through the template. The Hub "dispatches
  work to one or more Runtime Brokers". With tmux enabled, the broker "wraps the harness
  command in a tmux session". The docs page covers no triggers. [20] (F, summarised)
- **AWS CLI Agent Orchestrator (CAO).** `cao-server` "starts provider CLIs in isolated
  terminal sessions" (tmux 3.3+). Here a "provider" is the agent CLI (Kiro, Claude Code,
  Codex ...), and "Flows" are "scheduled runs". [21] (F)
- **No layer model published.** The Claude Code Action takes `trigger_phrase`,
  `assignee_trigger` and `label_trigger`. Cursor Cloud Agents run "in isolated VMs" or on
  "Self-Hosted Machines" and start from `@cursor` in Slack, GitHub or Linear, or the API.
  Dan Shapiro's five levels are autonomy levels, not layers. [22][23][24] (F; [23][24]
  summarised)
- **The host products.** Herdr: "herdr doesn't wrap or replace them; it owns their
  terminals". T3 Code: "agent harness control surface", calling Codex and Claude
  "providers". Orca: "the place for working with a fleet of agents ... desktop, mobile and
  remote runtime". [25][26][27] (F)

## Vocabulary

| For                        | Word                                      | Who uses it                                                                                                           |
| -------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| a layer                    | slot                                      | AO v1 ("8 plugin slots") [5]                                                                                          |
| a layer                    | port                                      | AO v2; Cockburn: "A port identifies a purposeful conversation" [3][28]                                                |
| a layer                    | layer                                     | Symphony's six; AO v2 "Observation Layer" [1][3]                                                                      |
| a layer                    | contract, boundary                        | Symphony "Issue Tracker Integration Contract"; Gas Town "provider contract"; Gas City "pluggable boundary" [1][9][11] |
| a layer                    | capability                                | AO v2 adapter manifests (`agent`, `issue-tracker`) [4]                                                                |
| one unit                   | plugin                                    | AO v1, paired with slot [5]                                                                                           |
| one unit                   | adapter                                   | Symphony tracker, AO v2; Cockburn: "multiple adapters for any one port" [1][3][28]                                    |
| one unit                   | provider                                  | Gas City (session, agent, beads); CAO and T3 Code mean the agent CLI; overloaded [12][21][26]                         |
| one unit                   | backend                                   | Gas City "session-provider backend", Attractor `CodergenBackend`, OpenHands [6][11][16]                               |
| one unit                   | driver                                    | AO v2 `chatdriver` [3]                                                                                                |
| one unit, harness only     | executor, engine, preset                  | Vibe Kanban, gh-aw, Gas Town [9][13][14]                                                                              |
| config of a unit           | profile, variant                          | Vibe Kanban, OpenHands, CAO, Attractor `ProviderProfile` [7][14][17][21]                                              |
| Herdr's role               | runtime                                   | AO v1 and v2, Scion, Herdr's tagline [3][5][20][25]                                                                   |
| Herdr's role               | session provider, runtime provider        | Gas City, which has a `herdr` implementation [11]                                                                     |
| Herdr's role, viewing half | terminal, control surface                 | AO v1 "human interaction UI"; T3 Code [5][26]                                                                         |
| the node under it          | runtime broker, worker host               | Scion; Symphony SSH extension [1][20]                                                                                 |
| an isolation boundary      | execution environment, sandbox, container | Attractor (tools), OpenHands, gh-aw, Vibe Kanban [7][13][14][16]                                                      |
| avoid                      | workspace                                 | a directory or worktree in Symphony and AO, the execution environment in OpenHands [1][3][18]                         |

For this repo: its glossary fixes **Agent** as a trigger-label role and **Session** as one
Claude Code conversation. Gas City uses the same two meanings, so "harness" (Scion) avoids
the AO v1 clash with "Agent", and "runtime" (or Gas City's "session provider") names
Herdr's layer. (I)

## Not found

- Factory.ai, Sweep and Kilo: not researched; no published layer model was looked up.
- The current OpenHands resolver docs (the docs URL tried returned 404); only PyPI and
  search snippets.
- How AO v1 resolved a slot's plugin at runtime beyond `PluginModule.create`; upstream no
  longer serves that code.
- Whether one Scion broker can run several runtimes at once.

## Sources

1. [OpenAI Symphony, `SPEC.md`](https://github.com/openai/symphony/blob/main/SPEC.md), Draft v1, commit `be10a1b` 2026-09-15, FETCHED
2. [OpenAI Symphony, README and `elixir/lib/symphony_elixir/*/adapter.ex`](https://github.com/openai/symphony), `main`, FETCHED
3. [Agent Orchestrator, `docs/architecture.md`](https://github.com/OrchestratorInc/agent-orchestrator/blob/main/docs/architecture.md) (formerly ComposioHQ), `main` 2026-10-29, FETCHED
4. [Agent Orchestrator, `ports/doc.go`, `adapters/registry.go`, `adapters/runtime/runtimeselect/runtimeselect.go`](https://github.com/OrchestratorInc/agent-orchestrator/tree/main/backend/internal), `main`, FETCHED
5. [Agent Orchestrator v1, `packages/core/src/types.ts` and README](https://github.com/mnemom/composio-ao/blob/4cda43795b/packages/core/src/types.ts), fork snapshot 2026-02-27, FETCHED
6. [StrongDM, Attractor README and `attractor-spec.md`](https://github.com/strongdm/attractor), `main` 2026-03-17, FETCHED
7. [StrongDM, `coding-agent-loop-spec.md`](https://github.com/strongdm/attractor/blob/main/coding-agent-loop-spec.md), `main`, FETCHED
8. [StrongDM, "Software Factory"](https://factory.strongdm.ai/), Justin McCarthy, 2026-02-06, FETCHED (summarised)
9. [Gas Town, `docs/agent-provider-integration.md` and `docs/glossary.md`](https://github.com/gastownhall/gastown/tree/main/docs), commit `466aa41`, FETCHED
10. [Gas City, "How Gas City works"](https://github.com/gastownhall/gascity/blob/main/docs/getting-started/how-gas-city-works.md), commit `49f1387`, FETCHED
11. [Gas City, `herdr-provider.md`, `exec-session-provider.md`, `exec-beads-provider.md`](https://github.com/gastownhall/gascity/tree/main/docs/reference), commit `49f1387`, FETCHED
12. [Gas City, `engdocs/design/runtime-provider-packs.md`](https://github.com/gastownhall/gascity/blob/main/engdocs/design/runtime-provider-packs.md) (Proposed, 2026-06-12) and `internal/runtime/runtime.go`, FETCHED
13. [GitHub, gh-aw `engines.md`, `triggers.md`, `sandbox.md`, `safe-outputs.md`](https://github.com/github/gh-aw/tree/main/docs/src/content/docs/reference), `main` 2026-10-29, FETCHED
14. [Vibe Kanban, `crates/executors/src/executors/mod.rs`, `default_profiles.json`, `crates/services/src/services/container.rs`](https://github.com/BloopAI/vibe-kanban/tree/main/crates), `main`, FETCHED
15. [Vibe Kanban, "Agent Profiles & Configuration"](https://github.com/BloopAI/vibe-kanban/blob/main/docs/settings/agent-configurations.mdx), `main`, FETCHED
16. [OpenHands, "Agent Canvas Architecture"](https://docs.openhands.dev/openhands/usage/agent-canvas/architecture.md), undated, FETCHED
17. [OpenHands, "Software Factory"](https://docs.openhands.dev/openhands/usage/use-cases/software-factory.md) and ["Event-Based Automations"](https://docs.openhands.dev/openhands/usage/automations/event-automations.md), undated, FETCHED
18. [OpenHands SDK, "Workspace"](https://docs.openhands.dev/sdk/arch/workspace) (summarised) and [`workspace/base.py`, `workspace.py`](https://github.com/OpenHands/software-agent-sdk/tree/main/openhands-sdk/openhands/sdk/workspace) (FETCHED)
19. [`openhands-resolver` on PyPI](https://pypi.org/project/openhands-resolver/), SNIPPET
20. [Google Scion, "Architecture Deep Dive"](https://googlecloudplatform.github.io/scion/contributing/architecture/), undated, FETCHED (summarised)
21. [AWS, CLI Agent Orchestrator README](https://github.com/awslabs/cli-agent-orchestrator/blob/main/README.md), `main` 2026-10-29, FETCHED
22. [Anthropic, `claude-code-action` `action.yml`](https://github.com/anthropics/claude-code-action/blob/main/action.yml), `main`, FETCHED
23. [Cursor docs, "Cloud Agents"](https://cursor.com/docs/cloud-agent), undated, FETCHED (summarised)
24. [Dan Shapiro, "The Five Levels: from Spicy Autocomplete to the Software Factory"](https://www.danshapiro.com/blog/2026/01/the-five-levels-from-spicy-autocomplete-to-the-software-factory/), 2026-01-23, FETCHED (summarised)
25. [Herdr README](https://github.com/herdrdev/herdr), `main`, FETCHED
26. [T3 Code README](https://github.com/pingdotgg/t3code), `main`, FETCHED
27. [Orca repository description](https://github.com/stablyai/orca), via the GitHub API, FETCHED
28. [Alistair Cockburn, "Hexagonal architecture"](https://alistair.cockburn.us/hexagonal-architecture/), 2005-09-04, FETCHED (summarised)
