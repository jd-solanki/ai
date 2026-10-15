import assert from 'node:assert/strict'
import { test } from 'node:test'
import { clampSelection, findCard, toColumns, type Snapshot } from '../src/board.ts'

const workspaces = [
  { workspace_id: 'w1', label: 'nuxtstart' },
  { workspace_id: 'w2', label: 'ai' },
]
function herdrAgent(pane_id: string, agent_status: string, more = {}) {
  return {
    pane_id,
    agent_status,
    agent: 'claude',
    workspace_id: 'w1',
    cwd: '/Users/jd/Projects/nuxtstart',
    terminal_title_stripped: 'Fix login',
    ...more,
  }
}

test('toColumns puts each herdr agent in the column for its state', () => {
  const snapshot: Snapshot = {
    workspaces,
    agents: [
      herdrAgent('w1:p1', 'working'),
      herdrAgent('w2:p1', 'blocked', {
        workspace_id: 'w2',
        display_agent: 'Codex: api',
        terminal_title_stripped: '',
        cwd: '/Users/jd/Projects/ai',
      }),
      herdrAgent('w1:p2', 'idle', { agent: 'pi' }),
    ],
  }
  assert.deepEqual(toColumns(snapshot), [
    {
      status: 'working',
      cards: [{ paneId: 'w1:p1', title: 'Fix login', provider: 'claude', workspace: 'nuxtstart' }],
    },
    {
      status: 'blocked',
      cards: [{ paneId: 'w2:p1', title: 'ai', provider: 'Codex: api', workspace: 'ai' }],
    },
    { status: 'done', cards: [] },
    {
      status: 'idle',
      cards: [{ paneId: 'w1:p2', title: 'Fix login', provider: 'pi', workspace: 'nuxtstart' }],
    },
  ])
})

test('clampSelection keeps the selection on the board as cards come and go', () => {
  const columns = toColumns({
    workspaces,
    agents: [herdrAgent('w1:p1', 'working'), herdrAgent('w1:p2', 'working')],
  })
  assert.deepEqual(clampSelection(columns, { column: 0, card: 5 }), { column: 0, card: 1 })
  assert.deepEqual(clampSelection(columns, { column: -1, card: 0 }), { column: 0, card: 0 })
  assert.deepEqual(clampSelection(columns, { column: 9, card: 1 }), { column: 3, card: 0 })
})

test('toColumns adds an unknown column only while a herdr agent is in it', () => {
  const snapshot = { workspaces, agents: [herdrAgent('w1:p1', 'unknown')] }
  assert.deepEqual(
    toColumns(snapshot).map((column) => column.status),
    ['working', 'blocked', 'done', 'idle', 'unknown'],
  )
})

test('toColumns puts a herdr agent in a state it does not know under unknown', () => {
  const snapshot = { workspaces, agents: [herdrAgent('w1:p1', 'paused')] }
  assert.deepEqual(toColumns(snapshot).at(-1), {
    status: 'unknown',
    cards: [{ paneId: 'w1:p1', title: 'Fix login', provider: 'claude', workspace: 'nuxtstart' }],
  })
})

test('findCard follows a herdr agent to the column its new state puts it in', () => {
  const columns = toColumns({
    workspaces,
    agents: [herdrAgent('w1:p1', 'blocked'), herdrAgent('w1:p2', 'done')],
  })
  assert.deepEqual(findCard(columns, 'w1:p2'), { column: 2, card: 0 })
  assert.equal(findCard(columns, 'w9:p9'), undefined)
})
