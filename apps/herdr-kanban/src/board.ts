import { selectionStyle, type TerminalColors } from './accent.ts'

export interface Snapshot {
  agents: {
    pane_id: string
    agent_status: string
    agent: string
    display_agent?: string
    workspace_id: string
    tab_id: string
    terminal_title?: string
    terminal_title_stripped?: string
  }[]
  workspaces: { workspace_id: string; label: string }[]
  tabs: { tab_id: string; label: string }[]
}

export interface Card {
  paneId: string
  // One line per configured row, as herdr's sidebar draws it.
  lines: string[]
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

export type Rows = string[][]
// herdr's own default, for a config that sets no rows.
const DEFAULT_ROWS: Rows = [['state_icon', 'machine', 'workspace', 'tab'], ['agent']]
// Everything a rows array holds: strings, inline style tables, brackets and comments.
const ROWS_TOKEN = /"([^"]*)"|'([^']*)'|\{[^}]*\}|#.*|[[\]]|[^\s,]/g

// shortcut: reads only a `rows =` line under a `[ui.sidebar.agents]` header, and ignores rows_by_agent; any other TOML spelling, or a style table holding a table, falls back to herdr's default. Parse full TOML if a config needs one.
export function rowsFrom(config: string): Rows {
  const section = config
    .split(/^\s*\[ui\.sidebar\.agents\]\s*(?:#.*)?$/m)[1]
    ?.split(/^\s*\[[\w.-]+\]\s*(?:#.*)?$/m)[0]
  const start = section?.search(/^\s*rows\s*=/m) ?? -1
  if (!section || start === -1) return DEFAULT_ROWS
  const stack: unknown[][] = [[]]
  for (const [token, double, single] of section
    .slice(section.indexOf('=', start) + 1)
    .matchAll(ROWS_TOKEN)) {
    const list = stack.at(-1)!
    if (token.startsWith('#')) continue
    if (token === '[') stack.push(list[list.push([]) - 1] as unknown[])
    else if (token === ']') stack.pop()
    // A style table names its token; its colours are herdr's to draw.
    else if (token.startsWith('{')) list.push(token.match(/\btoken\s*=\s*["']([^"']*)/)?.[1])
    else if ((double ?? single) !== undefined) list.push(double ?? single)
    else return DEFAULT_ROWS
    if (stack.length <= 1) break
  }
  const rows = stack[0]?.[0]
  const isRows =
    stack.length === 1 &&
    Array.isArray(rows) &&
    rows.length > 0 &&
    rows.every((row) => Array.isArray(row) && row.every((token) => typeof token === 'string'))
  return isRows ? rows : DEFAULT_ROWS
}

export function toColumns(snapshot: Snapshot, rows: Rows = DEFAULT_ROWS): Column[] {
  const labels = new Map(snapshot.workspaces.map((w) => [w.workspace_id, w.label]))
  const tabLabels = new Map(snapshot.tabs.map((tab) => [tab.tab_id, tab.label]))
  const columnOf = (status: string) => (STATUSES.includes(status) ? status : 'unknown')
  const columns = [...STATUSES, 'unknown'].map((status) => ({
    status,
    cards: snapshot.agents
      .filter((agent) => columnOf(agent.agent_status) === status)
      .map((agent) => {
        // shortcut: the snapshot has no machine, pane name or $metadata, so those tokens stay empty, read them from herdr once it reports them.
        // state_icon stays empty: the column already shows the state's colour.
        const values: Record<string, string | undefined> = {
          state_text: agent.agent_status,
          workspace: labels.get(agent.workspace_id) ?? agent.workspace_id,
          tab: tabLabels.get(agent.tab_id),
          agent: agent.display_agent ?? agent.agent,
          terminal_title: agent.terminal_title,
          terminal_title_stripped: agent.terminal_title_stripped,
        }
        return { paneId: agent.pane_id, lines: rows.map((row) => line(row, values)) }
      }),
  }))
  return columns.filter((column) => STATUSES.includes(column.status) || column.cards.length)
}

// herdr drops an empty value with its separator.
function line(row: string[], values: Record<string, string | undefined>) {
  return row
    .map((token) => values[token])
    .filter(Boolean)
    .join(' · ')
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

// herdr's sidebar colours each state from its theme; these are the same colours from the terminal's palette, by number.
export const STATE_COLORS: Record<string, number> = {
  working: 3,
  blocked: 1,
  done: 6,
  idle: 2,
  unknown: 8,
}

const style = (codes: string, text: string) => `\x1b[${codes}m${text}\x1b[0m`
const fit = (text: string, size: number) => text.slice(0, Math.max(size - 1, 0)).padEnd(size)

// Breaks a line at its last space that fits, or mid-word when none does.
function wrap(text: string, width: number) {
  if (width < 1) return ['']
  const lines: string[] = []
  let rest = text
  while (rest.length > width) {
    const space = rest.lastIndexOf(' ', width)
    const end = space > 0 ? space : width
    lines.push(rest.slice(0, end))
    rest = rest.slice(end).trimStart()
  }
  return [...lines, rest]
}

interface ColumnLine {
  text: string
  // Set on a card's lines: the card's index and the configured row the line wraps.
  card?: number
  row?: number
}

// A column top to bottom: its header and a blank line, then each card's rows wrapped to the
// text width left by the highlight's padding on each side and the column gap, then a blank line.
function layoutColumn(column: Column, columnWidth: number): ColumnLine[] {
  return [
    { text: `${column.status.toUpperCase()} ${column.cards.length}` },
    { text: '' },
    ...column.cards.flatMap((card, cardIndex) => [
      ...card.lines.flatMap((text, row) =>
        wrap(text, columnWidth - 3).map((piece) => ({ text: piece, card: cardIndex, row })),
      ),
      { text: '' },
    ]),
  ]
}

// shortcut: no scrolling and titles wrap by code unit, so wide emoji can shift a column; scroll once a column outgrows the pane.
export function render(
  columns: Column[],
  selected: Selection,
  width: number,
  height: number,
  terminalColors: TerminalColors = new Map(),
) {
  const columnWidth = Math.floor(width / columns.length)
  const blank = fit('', columnWidth)
  const blocks = columns.map((column, columnIndex) => {
    const paletteIndex = STATE_COLORS[column.status]
    const color = `38;5;${paletteIndex}`
    const selection = selectionStyle(terminalColors, paletteIndex)
    return layoutColumn(column, columnWidth).map(({ text, card, row }, line) => {
      if (line === 0) return ` ${style(`1;${color}`, fit(text, columnWidth - 1))}`
      if (card === undefined) return blank
      const isSelected = columnIndex === selected.column && card === selected.card
      const firstStyle = isSelected ? `1;${selection}` : '1'
      const restStyle = isSelected ? selection : '2'
      return `${style(row === 0 ? firstStyle : restStyle, ` ${text}`.padEnd(columnWidth - 1))} `
    })
  })
  const rowCount = Math.min(height, Math.max(...blocks.map((block) => block.length)))
  return Array.from({ length: rowCount }, (_, row) =>
    blocks.map((block) => block[row] ?? blank).join(''),
  ).join('\n')
}

// x and y are 1-based terminal cells, as a mouse report gives them.
export function cardAt(columns: Column[], width: number, x: number, y: number) {
  const columnWidth = Math.floor(width / columns.length)
  const column = Math.floor((x - 1) / columnWidth)
  const card = columns[column] && layoutColumn(columns[column], columnWidth)[y - 1]?.card
  return card === undefined ? undefined : { column, card }
}
