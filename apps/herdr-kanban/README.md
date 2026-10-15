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

Or bind it to a key in herdr's `config.toml`.

Arrow keys or `hjkl` move between cards. Enter focuses the selected herdr agent and closes the board. `q` or Escape closes it. The board refreshes every second.

To reach another machine, open herdr on it with `herdr --remote` and open the board there.
