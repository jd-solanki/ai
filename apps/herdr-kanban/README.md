# herdr kanban

A herdr plugin that shows every herdr agent on the server in a column for its state: working, blocked, done and idle. It reads herdr's own state, so it works for any agent herdr detects, and stores nothing.

## Requirements

- herdr 0.9.5 or newer, with the server restarted onto it.
- Node, in the range `engines` in the root `package.json` sets. The plugin runs TypeScript directly, with no build step.

## Install

```bash
herdr plugin install jd-solanki/ai/apps/herdr-kanban
```

While working on it, link the folder instead: `herdr plugin link apps/herdr-kanban`.

## Use it

```bash
ws=$(herdr workspace create --label "🗂️ Kanban")
herdr plugin pane open --plugin jd-solanki.herdr-kanban --entrypoint board --focus \
  --workspace "$(jq -r .result.workspace.workspace_id <<<"$ws")"
herdr tab close "$(jq -r .result.tab.tab_id <<<"$ws")"
```

It opens in its own workspace, 🗂️ Kanban, so it sits in the sidebar one click away while you work in other workspaces, and switches you to it. herdr only addresses a workspace and a tab by ID, so `ws` keeps the IDs the new workspace reports. The last line closes the empty shell tab the new workspace starts with. The script needs `jq`.

To open it as a tab in the current workspace instead, run only `herdr plugin pane open --plugin jd-solanki.herdr-kanban --entrypoint board`.

Arrow keys or `hjkl` move between cards. The selected card is filled with its column's colour. Enter, or a click on a card, focuses that herdr agent and leaves the board open. Each column takes the colour herdr's sidebar gives its state, from your terminal's palette. `q` closes it. The board refreshes every second.

A card shows the same fields, in the same order, as that herdr agent's row in herdr's sidebar: it reads `rows` under `[ui.sidebar.agents]` from your herdr config when it opens, so reopen it after changing them. `rows_by_agent` and a style table's colours are not read, and `machine`, `pane` and `$name` fields stay empty. `state_icon` is left out, since the column already shows the state.

To keep it on a second monitor, run `herdr` in a terminal window there. Each attached client views its own workspace and tab, so that window can stay on the board while you work in the other.

To reach another machine, open herdr on it with `herdr --remote` and open the board there.
