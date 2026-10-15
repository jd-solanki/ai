import { basename } from 'node:path'

export interface Snapshot {
  agents: {
    pane_id: string
    agent_status: string
    agent: string
    display_agent?: string
    workspace_id: string
    tab_id: string
    cwd: string
    terminal_title_stripped: string
  }[]
  workspaces: { workspace_id: string; label: string }[]
  tabs: { tab_id: string; label: string }[]
}

export interface Card {
  paneId: string
  title: string
  provider: string
  workspace: string
}

export interface Column {
  status: string
  cards: Card[]
}

export interface Selection {
  column: number
  card: number
}

const STATUSES = ['working', 'blocked', 'done', 'idle']

export function toColumns(snapshot: Snapshot): Column[] {
  const labels = new Map(snapshot.workspaces.map((w) => [w.workspace_id, w.label]))
  const tabLabels = new Map(snapshot.tabs.map((tab) => [tab.tab_id, tab.label]))
  const columnOf = (status: string) => (STATUSES.includes(status) ? status : 'unknown')
  const columns = [...STATUSES, 'unknown'].map((status) => ({
    status,
    cards: snapshot.agents
      .filter((agent) => columnOf(agent.agent_status) === status)
      .map((agent) => ({
        paneId: agent.pane_id,
        title: tabLabels.get(agent.tab_id) || agent.terminal_title_stripped || basename(agent.cwd),
        provider: agent.display_agent ?? agent.agent,
        workspace: labels.get(agent.workspace_id) ?? agent.workspace_id,
      })),
  }))
  return columns.filter((column) => STATUSES.includes(column.status) || column.cards.length)
}

export function findCard(columns: Column[], paneId: string): Selection | undefined {
  for (const [column, { cards }] of columns.entries()) {
    const card = cards.findIndex((each) => each.paneId === paneId)
    if (card !== -1) return { column, card }
  }
}

export function clampSelection(columns: Column[], { column, card }: Selection): Selection {
  const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), Math.max(max, 0))
  const clampedColumn = clamp(column, columns.length - 1)
  return { column: clampedColumn, card: clamp(card, columns[clampedColumn].cards.length - 1) }
}

// A column is a header row and a blank row, then each card: title, provider line, blank row.
const HEADER_ROWS = 2
const CARD_ROWS = 3
// herdr's sidebar colours each state from its theme; these are the same colours from the terminal's palette.
const STATE_COLORS: Record<string, string> = {
  working: '33',
  blocked: '31',
  done: '36',
  idle: '32',
  unknown: '90',
}

const style = (codes: string, text: string) => `\x1b[${codes}m${text}\x1b[0m`
const fit = (text: string, size: number) => text.slice(0, Math.max(size - 1, 0)).padEnd(size)

// shortcut: no scrolling and titles are cut by code unit, so wide emoji can shift a column; scroll once a column outgrows the pane.
export function render(columns: Column[], selected: Selection, width: number, height: number) {
  const columnWidth = Math.floor(width / columns.length)
  const blank = fit('', columnWidth)
  const blocks = columns.map((column, columnIndex) => {
    const color = STATE_COLORS[column.status]
    const header = `● ${column.status.toUpperCase()} ${column.cards.length}`
    return [
      style(`1;${color}`, fit(header, columnWidth)),
      blank,
      ...column.cards.flatMap((card, cardIndex) => {
        const isSelected = columnIndex === selected.column && cardIndex === selected.card
        const bar = isSelected ? style(color, '▌') : ' '
        const titleStyle = isSelected ? `1;${color}` : '1'
        return [
          `${bar} ${style(titleStyle, fit(card.title, columnWidth - 2))}`,
          `${bar} ${style('2', fit(`${card.provider} · ${card.workspace}`, columnWidth - 2))}`,
          blank,
        ]
      }),
    ]
  })
  const rowCount = Math.min(height, Math.max(...blocks.map((block) => block.length)))
  return Array.from({ length: rowCount }, (_, row) =>
    blocks.map((block) => block[row] ?? blank).join(''),
  ).join('\n')
}

// x and y are 1-based terminal cells, as a mouse report gives them.
export function cardAt(columns: Column[], width: number, x: number, y: number) {
  const column = Math.floor((x - 1) / Math.floor(width / columns.length))
  const cardRow = y - 1 - HEADER_ROWS
  const card = Math.floor(cardRow / CARD_ROWS)
  const isOnCard = cardRow >= 0 && cardRow % CARD_ROWS < CARD_ROWS - 1
  if (column < columns.length && isOnCard && card < columns[column].cards.length) {
    return { column, card }
  }
}
