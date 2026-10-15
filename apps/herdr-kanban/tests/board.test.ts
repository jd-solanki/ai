import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  cardAt,
  clampSelection,
  findCard,
  rowsFrom,
  toColumns,
  type Snapshot,
} from '../src/board.ts'

const workspaces = [
  { workspace_id: 'w1', label: 'nuxtstart' },
  { workspace_id: 'w2', label: 'ai' },
]
const tabs = [{ tab_id: 'w1:t1', label: 'PR #84 - Kiosk Pairing' }]
function herdrAgent(pane_id: string, agent_status: string, more = {}) {
  return {
    pane_id,
    agent_status,
    agent: 'claude',
    workspace_id: 'w1',
    tab_id: 'w1:t9',
    terminal_title_stripped: 'Fix login',
    ...more,
  }
}

test('toColumns puts each herdr agent in the column for its state', () => {
  const snapshot: Snapshot = {
    workspaces,
    tabs,
    agents: [
      herdrAgent('w1:p1', 'working'),
      herdrAgent('w2:p1', 'blocked', {
        workspace_id: 'w2',
        display_agent: 'Codex: api',
        terminal_title_stripped: '',
      }),
      herdrAgent('w1:p2', 'idle', { agent: 'pi' }),
    ],
  }
  assert.deepEqual(toColumns(snapshot), [
    {
      status: 'working',
      cards: [{ paneId: 'w1:p1', lines: ['● nuxtstart', 'claude'] }],
    },
    {
      status: 'blocked',
      cards: [{ paneId: 'w2:p1', lines: ['● ai', 'Codex: api'] }],
    },
    { status: 'done', cards: [] },
    {
      status: 'idle',
      cards: [{ paneId: 'w1:p2', lines: ['● nuxtstart', 'pi'] }],
    },
  ])
})

test("toColumns lays out a card like the herdr agent's row in the sidebar", () => {
  const snapshot = {
    workspaces,
    tabs,
    agents: [
      herdrAgent('w1:p1', 'idle', { tab_id: 'w1:t1' }),
      herdrAgent('w1:p2', 'idle', { terminal_title: '◐ Fix login' }),
    ],
  }
  const lines = (rows: string[][]) => toColumns(snapshot, rows)[3].cards.map((card) => card.lines)
  assert.deepEqual(lines([['state_icon', 'workspace'], ['tab']]), [
    ['● nuxtstart', 'PR #84 - Kiosk Pairing'],
    ['● nuxtstart', ''],
  ])
  assert.deepEqual(
    lines([
      ['workspace', 'state_icon', 'machine', 'state_text', 'agent'],
      ['terminal_title', 'pane'],
    ]),
    [
      ['nuxtstart · ● idle · claude', ''],
      ['nuxtstart · ● idle · claude', '◐ Fix login'],
    ],
  )
})

test('cardAt finds the card under a click on an 80-column board', () => {
  const columns = toColumns({
    workspaces,
    tabs,
    agents: [herdrAgent('w1:p1', 'working'), herdrAgent('w1:p2', 'working')],
  })
  assert.deepEqual(cardAt(columns, 80, 1, 3), { column: 0, card: 0 })
  assert.deepEqual(cardAt(columns, 80, 20, 7), { column: 0, card: 1 })
  assert.equal(cardAt(columns, 80, 1, 1), undefined, 'the header is not a card')
  assert.equal(cardAt(columns, 80, 1, 5), undefined, 'the gap between cards is not a card')
  assert.equal(cardAt(columns, 80, 1, 9), undefined, 'below the last card')
  assert.equal(cardAt(columns, 80, 21, 3), undefined, 'an empty column')
})

test('cardAt finds the card under a click when each card is one row tall', () => {
  const agents = [herdrAgent('w1:p1', 'working'), herdrAgent('w1:p2', 'working')]
  const columns = toColumns({ workspaces, tabs, agents }, [['workspace']])
  assert.deepEqual(cardAt(columns, 80, 1, 5), { column: 0, card: 1 })
  assert.equal(cardAt(columns, 80, 1, 4), undefined, 'the gap between cards is not a card')
})

test('clampSelection keeps the selection on the board as cards come and go', () => {
  const columns = toColumns({
    workspaces,
    tabs,
    agents: [herdrAgent('w1:p1', 'working'), herdrAgent('w1:p2', 'working')],
  })
  assert.deepEqual(clampSelection(columns, { column: 0, card: 5 }), { column: 0, card: 1 })
  assert.deepEqual(clampSelection(columns, { column: -1, card: 0 }), { column: 0, card: 0 })
  assert.deepEqual(clampSelection(columns, { column: 9, card: 1 }), { column: 3, card: 0 })
})

test('toColumns adds an unknown column only while a herdr agent is in it', () => {
  const snapshot = { workspaces, tabs, agents: [herdrAgent('w1:p1', 'unknown')] }
  assert.deepEqual(
    toColumns(snapshot).map((column) => column.status),
    ['working', 'blocked', 'done', 'idle', 'unknown'],
  )
})

test('toColumns puts a herdr agent in a state it does not know under unknown', () => {
  const snapshot = { workspaces, tabs, agents: [herdrAgent('w1:p1', 'paused')] }
  assert.deepEqual(toColumns(snapshot).at(-1), {
    status: 'unknown',
    cards: [{ paneId: 'w1:p1', lines: ['● nuxtstart', 'claude'] }],
  })
})

test('findCard follows a herdr agent to the column its new state puts it in', () => {
  const columns = toColumns({
    workspaces,
    tabs,
    agents: [herdrAgent('w1:p1', 'blocked'), herdrAgent('w1:p2', 'done')],
  })
  assert.deepEqual(findCard(columns, 'w1:p2'), { column: 2, card: 0 })
  assert.equal(findCard(columns, 'w9:p9'), undefined)
})

test('rowsFrom reads the sidebar agent rows from herdr config', () => {
  const config = `[ui]
theme = "dark" # rows = [["agent"]]

# Agent sidebar rows.
[ui.sidebar.agents]
rows = [
  ["state_icon", "workspace"], # top
  [{ token = "tab", fg = "#ff0000", bold = true }],
]
rows_by_agent.claude = [["agent"]]

[keys]
rows = [["pane"]]
`
  assert.deepEqual(rowsFrom(config), [['state_icon', 'workspace'], ['tab']])
})

test("rowsFrom falls back to herdr's default rows when none are set or they cannot be read", () => {
  const herdrDefault = [['state_icon', 'machine', 'workspace', 'tab'], ['agent']]
  assert.deepEqual(rowsFrom(''), herdrDefault)
  assert.deepEqual(rowsFrom('[ui.sidebar.agents]\nrows = [["tab"'), herdrDefault)
  assert.deepEqual(rowsFrom('[ui.sidebar.agents]\nrows = ["tab"]'), herdrDefault)
  assert.deepEqual(rowsFrom('[ui.sidebar.agents]\nrows = ]'), herdrDefault)
})
