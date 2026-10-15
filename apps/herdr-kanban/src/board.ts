import { basename } from 'node:path'

export interface Snapshot {
  agents: {
    pane_id: string
    agent_status: string
    agent: string
    display_agent?: string
    workspace_id: string
    cwd: string
    terminal_title_stripped: string
  }[]
  workspaces: { workspace_id: string; label: string }[]
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
  const columnOf = (status: string) => (STATUSES.includes(status) ? status : 'unknown')
  const columns = [...STATUSES, 'unknown'].map((status) => ({
    status,
    cards: snapshot.agents
      .filter((agent) => columnOf(agent.agent_status) === status)
      .map((agent) => ({
        paneId: agent.pane_id,
        title: agent.terminal_title_stripped || basename(agent.cwd),
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

// shortcut: no scrolling and titles are cut by code unit, so wide emoji can shift a column; scroll once a column outgrows the pane.
export function render(columns: Column[], selected: Selection, width: number, height: number) {
  const columnWidth = Math.floor(width / columns.length)
  const cell = (text: string) => text.slice(0, columnWidth - 1).padEnd(columnWidth)
  const highlight = (line: string) => `\x1b[7m${line}\x1b[27m`
  const blocks = columns.map((column, columnIndex) => [
    cell(`${column.status.toUpperCase()} (${column.cards.length})`),
    cell(''),
    ...column.cards.flatMap((card, cardIndex) => {
      const lines = [cell(card.title), cell(`${card.provider} · ${card.workspace}`)]
      const isSelected = columnIndex === selected.column && cardIndex === selected.card
      return [...(isSelected ? lines.map(highlight) : lines), cell('')]
    }),
  ])
  const rowCount = Math.min(height, Math.max(...blocks.map((block) => block.length)))
  return Array.from({ length: rowCount }, (_, row) =>
    blocks.map((block) => block[row] ?? cell('')).join(''),
  ).join('\n')
}
