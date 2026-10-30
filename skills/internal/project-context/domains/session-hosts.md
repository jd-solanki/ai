# Session hosts

confidence: provisional — Orca's adapter is built but has run no factory session yet, and a
run's tab is still found by a handle an Orca restart invalidates.

## Words

**Repo workspace**:
A herdr workspace with a pane at a served repo's clone, where that repo's runs open as tabs.
_Avoid_: run workspace, project workspace

## Rules

- A factory runs one session host adapter: the one its owner names in that factory's
  configuration. Factories on different machines may name different ones.
- An adapter hosts the `claude` command static code builds. It opens a tab for the run at the
  served repo's clone without taking focus, labels it, types the command into the tab's shell,
  and closes the tab when the run ends. The command, its hooks and its worktree stay static
  code's.
- A run never ends on a session host's state. Its end comes from Claude Code's hooks.
- Closing an adapter's tab ends the session, so its SessionEnd fires. Stopping the host either
  does the same, as stopping herdr does, or leaves the session running for the adapter to close
  once the host is back, as quitting Orca does.

## Reasons

- The session host is a layer because the owner moves between hosts, herdr and then Orca,
  and each factory picks its own. One per factory, because two would split the one place the
  owner watches runs. `docs/adr/0001-factory-layers.md`
- A session runs as an interactive `claude` in a session host's tab, not a background session,
  so the owner sees every run in the host's agent list beside their own, and can watch it.
- The seam sits at the `claude` command, so an adapter adds no launch logic and a run's end
  stays on Claude Code's hooks under every host. T3 Code does not fit it: it starts Claude only
  through its SDK, creates the worktrees itself, and takes no per-run settings for the hooks and
  the token. Supporting it moves the seam above the command. `research/herdr-orca-t3code.md`
- Orca's adapter would use `orca terminal create`, not `orca agent launch`: no launch flag
  carries the factory's `--settings`, `--worktree` or `--permission-mode`.
- Quitting Orca leaves its sessions running in its terminal daemon, but every `orca` call fails
  until Orca is back, and then the old terminal handles are invalid. A run that ends in that window
  keeps its claim until its tab closes, so Orca's adapter must find a run's tab by something a
  restart keeps, not by its handle. `research/orca-runtime-lifetime.md`
- A run's tab opens in the repo workspace, so a served repo's runs sit beside the owner's own
  tabs for it instead of each in a workspace of its own.
- A host's state is a view, not a record: herdr itself says `idle` and `done` do not prove
  completion.
- `blocked` keeps the claim with no code: herdr shows it only while a dialog is up, inside a
  turn, and Stop fires only after a turn ends.
- A run tab herdr restores after a restart is left alone: its run already crashed on
  shutdown, and it comes back as a shell with no session and no claim.

## Fences

- **Closing a run's workspace closes the owner's tabs.** A run's tab shares the repo workspace
  with the owner's own, so a run's end and a failed launch close the tab alone. herdr removes a
  workspace the factory opened along with its last tab. `apps/software-factory/src/session.ts:closeTab`
- **`herdr agent start` never returns for a working session.** It waits until the agent is
  ready for input, and a session working on its prompt is not, so after 30 seconds it timed
  out and the factory closed a healthy run. The factory types the command into the pane
  instead, once the shell's prompt is up. `apps/software-factory/src/session.ts:startSession`
- **herdr's `idle` is not the end of a run.** A turn that ends while the session's own
  background shell runs shows `idle`, then `working` again when the session resumes by itself.
  A run never ends on herdr's state. `apps/software-factory/src/run-end.ts:handleRunReport`

## Where it lives

`apps/software-factory/src/server.ts` (`sessionHosts`: the adapters `SESSION_HOST` picks from),
`apps/software-factory/src/session.ts` (`startSession`, `closeTab`: the herdr adapter;
`sessionCommand`: what every adapter types), `apps/software-factory/src/orca.ts` (the Orca
adapter), `research/herdr-orca-t3code.md` (what herdr, Orca and T3 Code each offer an adapter).
