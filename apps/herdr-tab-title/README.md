# herdr tab title

A herdr plugin that titles a tab you name `#123` with that GitHub issue or pull request's title, so the tab reads `🛠️ #123 Fix the login redirect`, or `🔀 #123 …` for a pull request.

## Requirements

- herdr 0.9.5 or newer, with the server restarted onto it.
- Node, in the range `engines` in the root `package.json` sets. The plugin runs TypeScript directly, with no build step.
- `gh`, logged in, on the `PATH` of the herdr server. The plugin runs in the server's environment, not your shell's.

## Install

```bash
herdr plugin install jd-solanki/ai/apps/herdr-tab-title
```

While working on it, link the folder instead: `herdr plugin link apps/herdr-tab-title`.

## Use it

Name a tab `#123`, by renaming it or when you create it. The label must be exactly `#` and digits; any other label is left alone. A title longer than 25 characters is cut to 24 and ends in `…`. 🛠️ marks an issue and 🔀 a pull request.

The repository comes from the working directory of the tab's focused pane, read the way `gh` reads it: from that directory's git remote. Open the tab in the right clone before naming it. Both issues and pull requests work, because GitHub numbers them from one sequence.

If the tab keeps its `#123` label, the lookup failed. `herdr plugin log list --plugin jd-solanki.herdr-tab-title` shows why: `gh` not found or not logged in, no git remote in that directory, or no such issue.

On a machine reached with `herdr --remote`, the plugin runs on that machine, so `gh` must be set up there.

## Develop

Run the tests with `pnpm --filter herdr-tab-title test:unit`.
