# Herdr: replace a `#123` tab label with the issue or PR title

Researched 2026-10-16 against herdr 0.9.5 (`herdr --version`) and gh 2.102.0
(`gh --version`). Herdr source is cited at tag `v0.9.5` (commit `2ecf19a`) of
<https://github.com/herdrdev/herdr>, written below as `src/...:line`. Herdr docs are cited
from the raw files the official index <https://herdr.dev/llms.txt> links, written below as
`plugins.mdx:line` and so on, under
`https://raw.githubusercontent.com/herdrdev/herdr/v0.9.5/docs/next/website/src/content/docs/`.

## Verdict

**Possible, with small caveats.** Herdr plugins can declare event hooks on `tab.renamed` and
`tab.created`. The hook gets the new label, the tab ID and the tab's focused-pane cwd, and can
call `herdr tab rename`. No polling or wrapper is needed. The caveats are in **Caveats**
below.

## Findings

### Herdr has a plugin system, and the whole CLI is its API

- A plugin is a directory with a `herdr-plugin.toml` manifest. It declares `[[build]]`,
  `[[startup]]`, `[[actions]]`, `[[events]]`, `[[panes]]` and `[[link_handlers]]`
  (`plugins.mdx:18-21`, `plugins.mdx:60-99`).
- "There is no separate plugin SDK or restricted command set. The entire Herdr CLI is the
  plugin API." Plugins should call Herdr through `HERDR_BIN_PATH` (`plugins.mdx:23-29`).
- Commands are argv arrays, not run through a shell (`plugins.mdx:119-121`).
- `apps/herdr-kanban/` in this repo is a herdr plugin (`CONTRIBUTING.md:15`). Its manifest
  declares only a `[[panes]]` entry (`apps/herdr-kanban/herdr-plugin.toml:8-12`). It reads
  and drives herdr by shelling out to the CLI through `HERDR_BIN_PATH`
  (`apps/herdr-kanban/src/main.ts:16`, `:57` `api snapshot`, `:89` `agent focus`). So it
  shows the "CLI is the API" model, but it doesn't use event hooks.

### Read and set a tab's label

- `herdr tab list [--workspace <id>]`, `herdr tab get <tab_id>` and
  `herdr tab rename <tab_id> <label>` (`cli.mdx:190-197`; also `herdr tab` on 0.9.5).
- `TabInfo` carries `tab_id`, `workspace_id`, `label`, `number`, `focused`, `pane_count` and
  `agent_status` (`herdr api schema --json`, `.schemas.event."$defs".TabInfo`). On this
  machine, `herdr tab list` already shows tabs labelled `#25` and `#28`.

### Event hooks exist for tab rename and creation

- `[[events]] on = "<event>"` runs `command` when the event fires (`plugins.mdx:84-86`).
  The allowed hook events are `PLUGIN_HOOK_EVENT_KINDS`, which include `tab.created`,
  `tab.renamed`, `tab.closed`, `tab.moved` and `tab.focused` (`src/api/schema/events.rs:286-309`).
  An unknown `on` name is kept, with a warning (`src/app/api/plugins/manifest.rs:335-342`).
- Every emitted event runs matching hooks of every enabled plugin
  (`src/app/api.rs:795-798`, `src/app/api/plugins/runtime.rs:203-251`).
- **Renaming in the TUI fires the hook.** The TUI's rename-tab overlay (default
  `prefix+shift+t`, `src/config/model.rs:1150`) sends a `TabRename` API request
  (`src/client/shell/overlay_input.rs:974-982`). The server handles it in
  `handle_tab_rename`, which emits `tab.renamed` with the new `label`
  (`src/app/api/tabs.rs:142-172`). `herdr tab rename` takes the same path.
- **A tab created with a label fires only `tab.created`, not `tab.renamed`.**
  `tab create --label`, and naming a new tab in the TUI
  (`src/client/shell/overlay_input.rs:961-972`), set the label directly without emitting
  `tab.renamed`, then emit `tab.created` carrying the `TabInfo` with its label
  (`src/app/api/tabs.rs:101-120`, `src/app/creation.rs:249-258`). So hook both events.

### What a hook receives

- Env: `HERDR_BIN_PATH`, `HERDR_SOCKET_PATH`, `HERDR_PLUGIN_EVENT` (the event name),
  `HERDR_PLUGIN_EVENT_JSON`, `HERDR_PLUGIN_CONTEXT_JSON`, plus `HERDR_WORKSPACE_ID`,
  `HERDR_TAB_ID` and `HERDR_PANE_ID` when known. The working directory is the plugin
  directory (`plugins.mdx:265-275`, `src/app/api/plugins/runtime.rs:39-70`).
- `HERDR_PLUGIN_EVENT_JSON` is `{"event": "tab.renamed", "data": {"type": "tab_renamed",
"tab_id", "workspace_id", "label"}}`. For `tab.created`, `data` is
  `{"type": "tab_created", "tab": TabInfo}` (`src/api/schema/events.rs:361-365`,
  `herdr api schema --json` `EventData`).
- For tab events, `HERDR_PLUGIN_CONTEXT_JSON` describes that tab, not the user's focus. It
  includes `tab_id`, `tab_label` and `focused_pane_cwd`: the cwd of the tab's focused pane
  (`src/app/api/plugins/context.rs:107-125`, `:233-252`, `:347-369`). A pane's cwd is the
  OSC 7 one the shell reports, or else the shell process's cwd (`src/pane.rs:3806-3818`).

### Polling fallback (not needed)

- Outside a plugin, `events.subscribe` on the socket streams `tab.created` and
  `tab.renamed` (`socket-api.mdx:820-823`). Polling `herdr tab list` would also work. The
  hook is simpler than both.

### Resolving `#123` to a title

- `gh api repos/{owner}/{repo}/issues/123 --jq .title` covers issues and PRs: "GitHub's REST
  API considers every pull request an issue, but not every issue is a pull request. You can
  identify pull requests by the `pull_request` key." See
  <https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#get-an-issue>.
- `{owner}` and `{repo}` "get populated with values from the repository of the current
  directory", or from `GH_REPO` (`gh api --help`). So the repo comes from the git remote of
  the tab's focused-pane cwd, once the hook `cd`s there.
- Checked in this repo: `gh api 'repos/{owner}/{repo}/issues/29'` returned PR #29 with
  `pull_request` set. `gh issue view 29 --json title` also returned PR #29's title on
  gh 2.102.0.

## Smallest viable design

`herdr-plugin.toml`:

```toml
id = "jd-solanki.tab-issue-title"
name = "tab issue title"
version = "0.1.0"
min_herdr_version = "0.9.5"
platforms = ["linux", "macos"]

[[events]]
on = "tab.renamed"
command = ["sh", "title.sh"]

[[events]]
on = "tab.created"
command = ["sh", "title.sh"]
```

`title.sh`:

```sh
#!/bin/sh
# Rename a tab labelled exactly "#123" to "#123 <issue or PR title>".
label=$(printf %s "$HERDR_PLUGIN_EVENT_JSON" | jq -r '.data.label // .data.tab.label')
tab=$(printf %s "$HERDR_PLUGIN_EVENT_JSON" | jq -r '.data.tab_id // .data.tab.tab_id')
n=$(printf %s "$label" | sed -n 's/^#\([0-9][0-9]*\)$/\1/p')
[ -n "$n" ] || exit 0 # also ends the loop: our own rename fires tab.renamed again
cwd=$(printf %s "$HERDR_PLUGIN_CONTEXT_JSON" | jq -r '.focused_pane_cwd // empty')
[ -n "$cwd" ] && cd "$cwd" || exit 0
title=$(gh api "repos/{owner}/{repo}/issues/$n" --jq .title) || exit 1
exec "$HERDR_BIN_PATH" tab rename "$tab" "#$n $title"
```

Then run `herdr plugin link <dir>`. I dry-ran it with `HERDR_BIN_PATH=echo` and hand-built
event JSON:

- `#29` in this repo printed `tab rename wA:t9 #29 chore(software-factory): …`.
- A `tab.created` event for `#25` printed `#25 <title>`.
- A label that already had a title exited 0 without renaming.
- A cwd outside a git repo exited 1 with gh's error.

It was not run as a linked plugin.

## Caveats

- **Loop guard.** The hook's own rename fires `tab.renamed` again. Only an exact `#<digits>`
  label matches, so the second run exits. Keep that guard if the format changes.
- **Repo comes from the focused pane's cwd.** If that pane is outside the repo, or in a
  fork whose `origin` differs from the repo you mean, gh fails or picks the wrong repo. Set
  `GH_REPO` or add a per-workspace mapping only if that happens.
- **Environment.** Hooks inherit the herdr server's environment (`plugins.mdx:37-40`). `gh`
  (logged in) and `jq` must be on that PATH. A failure shows in
  `herdr plugin log list --plugin <id>`.
- **Long titles.** Issue #25's title is a full sentence. Truncating it in the script is a
  one-line `cut -c1-60`, if wanted.
- **Remote machines.** Hooks run on the machine whose herdr server owns the tab, so gh must
  be set up there too.

## Not verified

- Not run end to end as a linked plugin, by design: that would rename tabs in the live
  session. Run it in a named test session (`herdr --session test`) to confirm.
- Whether `tab_display_name` ever differs from the custom label wasn't checked. The design
  reads the label from the event JSON instead.
