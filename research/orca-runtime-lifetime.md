# Orca: do its terminals, and the Claude Code sessions in them, outlive a quit, restart or update?

Researched 2026-10-29; a snapshot, true as of that date. Evidence: **(F)** fetched and read;
**(S)** search snippet only; **(I)** inferred by the author. A tag covers the claims before it,
back to the previous tag. Numbers in brackets point to [Sources](#sources). Orca is cited from its
`v1.4.244` tree (commit `b8ec5c8`), the version installed here, as `orca:path`. What
`research/herdr-orca-t3code.md` covers is not repeated.

## Summary

- **Quitting, restarting or updating Orca does not end a `claude` in its terminal, and fires no
  SessionEnd.** A detached terminal daemon owns every PTY, not the Electron app. A quit only
  disconnects from it, and the next launch reattaches to the same processes. [1][2][3] (F)
- That is the default, with no setting to change it. Terminals run inside the app, and die on quit,
  only when the daemon fails to start or is kept unhealthy. [3][4][12] (F)
- Sessions end on **Quit Completely…**, a tab close, workspace Sleep, and anything that ends the
  daemon: logout (linger is off here), a reboot, a daemon crash, an OOM kill. [1][5][9][10][12] (F)
- After the daemon is lost, a tab made with `terminal create --command` comes back as a bare shell
  with its old scrollback. Orca does not run the command again. [12] (F)
- While the app is closed, the `orca` CLI shim refuses every command, and terminal handles do not
  survive a restart. [9][10] (F)
- `orca serve` is a headless runtime for servers. It takes the desktop app's profile lock, so it
  cannot run beside the owner's desktop on one profile. The factory does not need it. [7][8] (F)

## 1. Which process owns a terminal's PTY

- The daemon is its own Node process (`daemon-entry.js`), spawned with `detached: true`. On Linux,
  Orca launches it through `systemd-run --user --scope --unit=orca-daemon-<nonce>.scope
--property=TimeoutStopSec=5s`, "so unit-scoped parent shutdown cannot kill it". An AppImage daemon
  gets its own FUSE mount, because "the window's mount dies with its runtime". Each terminal gets its
  own scope, in a slice that `BindsTo` the daemon's scope. [3] (F)
- Seen on this machine (1.4.244 AppImage): the app sits in `app-orca-<pid>.scope`. The daemon, in
  its own session and process group, sits in `orca-daemon-<nonce>.scope`. Every shell, with its
  `claude`, is the daemon's child and has an `orca_pty_*.scope` of its own. [10] (F)
- No setting turns it off. If the daemon fails to start, Orca falls back "to local PTYs; terminals
  will not persist across quit". [3][4] (F)

## 2. Quit, restart, update

| Event (Linux, AppImage)                      | Daemon         | Terminal processes                        |
| -------------------------------------------- | -------------- | ----------------------------------------- |
| Close the last window, File → Exit, `Ctrl+Q` | kept           | keep running; reattached on next launch   |
| App crash                                    | kept           | keep running                              |
| Auto-update relaunch                         | old one kept   | keep running on the old host until closed |
| **Quit Completely…** (File menu, confirmed)  | sessions ended | stopped; tabs closed, not restored        |
| OS logout                                    | stopped        | SIGTERM, then SIGKILL 5 s later (I)       |
| Reboot, power loss, daemon crash, OOM        | dead           | gone; layout and last scrollback restored |

Rows from [1][2][3][5][11][12]. (F) The logout signals are inferred.

- **Quit.** On Linux, closing the last window quits the app. `will-quit` calls `killAllPty()`,
  which kills only in-process PTYs, "while daemon-backed sessions survive disconnect". It then calls
  `disconnectDaemon()`: "Normal quits preserve the detached daemon for warm reattach." Only a dying dev
  parent process makes a quit call `shutdownDaemon()`. An update quit records `daemonTeardown:
'disconnect'`. [2] (F) The daemon has its own session, so the app's exit signals no terminal. [10] (I)
- **Restore** reattaches to the same processes, with "output produced while Orca was closed" in the
  scrollback, not a new shell. An update keeps an older daemon that owns live sessions: "Code
  freshness must not cost live PTYs". [1][4][11][12] (F)
- **What ends sessions.** A graceful close sends the shell SIGHUP, then SIGKILL if it stays. Quit
  Completely "closes every terminal tab and stops its session". Workspace Sleep and Agent hibernation
  (experimental, off by default) stop agent terminals and later relaunch `claude --resume <id>`.
  [5][6][9] (F) At logout the daemon's scope stops with the user manager (#24152). The terminal slice
  is bound to it, so every terminal stops too, with `TimeoutStopSec=5s`. [3][12] (F) systemd sends
  SIGTERM, then SIGKILL after 5 s, and the PTY hang-up adds SIGHUP. (I)

## 3. What a Claude Code session inside sees

- **On a quit, restart or update:** no signal. It runs on headless in the daemon, and its hooks,
  which curl the factory and not Orca, keep firing. [2][3] (F)
- SessionEnd's documented reasons are `clear`, `resume`, `logout` (Claude's own logout, not the
  OS's), `prompt_input_exit` and `other`. The docs say nothing about signals. SessionEnd hooks get
  1.5 s by default, and up to 60 s when a hook sets its own `timeout`. [13] (F)
- A by-hand test fired SessionEnd with `other` on an Orca tab close, which sends the shell SIGHUP.
  [14] (F) So a hang-up at logout or on daemon death should fire `other` too, within systemd's 5 s.
  SIGTERM alone is untested. A SIGKILL (an OOM kill, the 5 s timeout) fires nothing. (I)

## 4. `orca serve`

- **What it is.** "Start an Orca runtime server without opening a desktop window", for headless
  Linux hosts, VMs and Cloud VM recipes. Desktop, web and mobile clients pair with it. It runs on
  orcad (Orca's Node server), with Electron as fallback. Linux is supported; `--supervise` serves
  systemd or launchd. [7][8] (F)
- **How long it lives.** SIGINT, SIGTERM or SIGHUP stops it. Its terminal host "keeps running when
  `orca serve` restarts", but only if the user manager outlives logout (`loginctl enable-linger`).
  #15956 (open) saw a service restart kill every session on 1.4.185. [3][7][8][12] (F)
- **Beside the desktop app: no.** They share one profile lock "to prevent concurrent desktop/serve
  writers". A desktop launch while orcad holds it ends with "Orca could not start". Serve exits 3
  "when another Orca already serves this profile". Docs: "Use only one host mode at a time." [7][8] (F)
- **Attaching.** The desktop joins only as a paired client (Settings → Remote Orca Servers → Add
  Server), documented for a second computer. The CLI targets a server with `--environment` or
  `--pairing-code`. [7][8][9] (F) Clients reopen to "the server-owned workspace, tab, and
  visible-pane state", so a CLI-made terminal should show there. A second profile on one machine is
  undocumented. (I) Neither was tested.

## 5. Guarantees and known issues

- **Documented:** "agents you had running keep running across an Orca quit" [1], and terminals open
  through an update "keep running, and stay attached, on the previous host" [11]. (F)
- **Open issues where the daemon died anyway** [12] (F): #23648, an AppImage daemon kept through an
  update crashed with SIGBUS a day later and dropped every PTY. #28703, systemd-oomd killed the whole
  daemon scope on 1.4.224, and no agent was resumed. #24152, `--command` terminals come back bare,
  including when "the daemon's scope is stopped at logout". #31720, a failed handshake after an update
  falls back to in-process PTYs and re-launches CLI conversations that are still running. #33883, that
  fallback is silent and does not survive a quit.
- The per-terminal scopes on 1.4.244 may now confine an OOM kill to one terminal. (I) #9138 and
  #18831 report old daemons still running after updates. (S)

## What this means for the factory

- A quit, restart or update leaves the run alive, so its claim is held because the run is still
  working, not stranded. It ends later through Stop or SessionEnd. A logout, reboot or daemon crash
  ends the session the way stopping herdr does, and SessionEnd probably fires `other`. The factory
  server likely dies in the same logout or reboot, though, so the claim stays held (the known gap),
  as it does after an OOM kill. (I)
- While Orca is closed, every `orca` call fails: a launch fails, and the run-end `terminal close`
  fails while the session runs on. After a relaunch the stored handle is stale. The adapter should
  re-find the tab by title with `orca terminal list --json` and retry the close once Orca is back. (I)
- After the daemon is lost, a run's tab comes back as a bare shell with no session and no claim, as
  herdr's does. The adapter can close it at startup, or leave it alone. (I)
- For the owner: Exit or `Ctrl+Q` keeps runs going. Quit Completely ends each run like a tab close,
  so SessionEnd fires. `loginctl enable-linger` would also keep runs alive through a logout. (I)

## Sources

1. Orca docs, `orca:docs/site/content/docs/model/session-restore.mdx`, FETCHED
2. Orca quit path: `orca:src/main/startup/main-process-quit.ts`, `startup/window-all-closed-quit-policy.ts`, `menu/app-menu-quit-item.ts`, `ipc/pty/kill-all.ts`, `daemon/daemon-provider-state.ts`, FETCHED
3. Orca daemon start: `orca:src/main/startup/main-process-pty-startup.ts`, `daemon/daemon-launched-child-spawn.ts`, `daemon/daemon-cgroup-scope.ts`, `daemon/daemon-user-manager-lifetime.ts`, `daemon/daemon-appimage-launch.ts`, `daemon/terminal-scopes.ts`, FETCHED
4. Orca update path: `orca:src/main/daemon/daemon-replacement-preflight.ts`, `daemon-bundle-staleness.ts`, `daemon-host-image.ts`, `degraded-daemon-pty-provider.ts`, FETCHED
5. Quit Completely: `orca:src/main/startup/quit-and-stop-all-sessions-prompt.ts`, FETCHED
6. Session close: `orca:src/main/daemon/terminal-session-teardown.ts`, `session-termination-controller.ts`, `pty-subprocess/subprocess-handle.ts`, FETCHED
7. `orca serve --help`, Orca 1.4.244 CLI, run locally; `orca:src/main/startup/serve-signal-handlers.ts`, `serve-quit-handling.ts`, `desktop-profile-instance-lock.ts`, `main-process-preflight-failure.ts`, FETCHED
8. Orca docs, `orca:docs/site/content/docs/remote-servers.mdx`, `ways-to-run.mdx`, FETCHED
9. Orca docs, `orca:docs/site/content/docs/cli/reference.mdx` (Terminal handles), `agents/hibernation.mdx`, `install.mdx`; `orca terminal list --help`, FETCHED
10. This machine, read-only, 2026-10-29: `ps` and `/proc/<pid>/cgroup` for Orca 1.4.244's app, daemon and a `claude`; `loginctl show-user -p Linger` (`no`); `orca status --json`; the shim `~/.config/orca/linux-orca-cli-shim/orca`, FETCHED
11. [Orca releases](https://github.com/stablyai/orca/releases) v1.4.243 and v1.4.244, GitHub API, 2026-10-29, FETCHED
12. Orca issues [#24152](https://github.com/stablyai/orca/issues/24152), [#23648](https://github.com/stablyai/orca/issues/23648), [#28703](https://github.com/stablyai/orca/issues/28703), [#31720](https://github.com/stablyai/orca/issues/31720), [#33883](https://github.com/stablyai/orca/issues/33883), [#15956](https://github.com/stablyai/orca/issues/15956), all open, FETCHED; #9138 and #18831, titles from search, SEARCH
13. [Claude Code hooks, SessionEnd](https://code.claude.com/docs/en/hooks#sessionend), FETCHED
14. This repo: `research/herdr-orca-t3code.md`, "Tried by hand", FETCHED
