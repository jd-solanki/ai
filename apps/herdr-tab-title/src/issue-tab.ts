type Tab = { tab_id: string; label: string }
type TabEvent = { data: Tab | { tab: Tab } }

const ISSUE_LABEL = /^#(\d+)$/

// tab.renamed carries the tab's fields in data; tab.created nests them under data.tab.
export function issueTab(event: TabEvent) {
  const tab = 'tab' in event.data ? event.data.tab : event.data
  const issueNumber = tab.label.match(ISSUE_LABEL)?.[1]
  if (issueNumber) return { tabId: tab.tab_id, issueNumber }
}

const MAX_TITLE_LENGTH = 25

export type Issue = { title: string; isPullRequest: boolean }

export function tabLabel(issueNumber: string, { title, isPullRequest }: Issue) {
  // Code points, so an emoji is never cut in half.
  const characters = Array.from(title)
  const clamped =
    characters.length > MAX_TITLE_LENGTH
      ? `${characters.slice(0, MAX_TITLE_LENGTH - 1).join('')}…`
      : title
  return `${isPullRequest ? '🔀' : '🛠️'} #${issueNumber} ${clamped}`
}
