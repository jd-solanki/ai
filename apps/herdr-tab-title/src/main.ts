import { execFileSync } from 'node:child_process'
import { issueTab, tabLabel, type Issue } from './issue-tab.ts'

const herdr = process.env.HERDR_BIN_PATH ?? 'herdr'
const tab = issueTab(JSON.parse(process.env.HERDR_PLUGIN_EVENT_JSON ?? '{}'))

if (tab) {
  // For a tab event, herdr reports the cwd of that tab's focused pane, so gh reads the repo open in the tab.
  const cwd = JSON.parse(process.env.HERDR_PLUGIN_CONTEXT_JSON ?? '{}').focused_pane_cwd
  // Without it gh would read this plugin's own repo and title the tab wrongly.
  if (!cwd) throw new Error(`herdr reported no working directory for tab ${tab.tabId}`)
  // The issues endpoint answers for pull requests too: GitHub treats every pull request as an
  // issue, and gives only a pull request the pull_request key.
  const issue: Issue = JSON.parse(
    execFileSync(
      'gh',
      [
        'api',
        `repos/{owner}/{repo}/issues/${tab.issueNumber}`,
        '--jq',
        '{title, isPullRequest: (.pull_request != null)}',
      ],
      {
        cwd,
        encoding: 'utf8',
        // herdr waits on a hook with no timeout, so a hung gh would hold the hook forever.
        timeout: 10_000,
      },
    ),
  )
  execFileSync(herdr, ['tab', 'rename', tab.tabId, tabLabel(tab.issueNumber, issue)])
}
