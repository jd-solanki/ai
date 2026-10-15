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
herdr plugin pane open --plugin jd-solanki.herdr-kanban --entrypoint board
```

It opens as a tab, so you can keep it open and move to other tabs and workspaces.

Arrow keys or `hjkl` move between cards. Enter focuses the selected herdr agent and leaves the board open. `q` closes it. The board refreshes every second.

To keep it on a second monitor, run `herdr` in a terminal window there. Each attached client views its own workspace and tab, so that window can stay on the board while you work in the other.

To reach another machine, open herdr on it with `herdr --remote` and open the board there.
