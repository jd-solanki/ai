import { execFileSync } from 'node:child_process'
import { clampSelection, findCard, render, toColumns, type Selection } from './board.ts'

const herdr = process.env.HERDR_BIN_PATH ?? 'herdr'
// shortcut: polls the snapshot because the herdr CLI has no event stream; move to the socket's events.subscribe if polling ever lags.
const REFRESH_MS = 1000
const ENTER_FULL_SCREEN = '\x1b[?1049h\x1b[?25l' // alternate screen, cursor hidden
const LEAVE_FULL_SCREEN = '\x1b[?25h\x1b[?1049l'
const CLEAR_SCREEN = '\x1b[H\x1b[2J'
const KEY_STEPS: Record<string, { column: number; card: number }> = {
  '\x1b[A': { column: 0, card: -1 },
  k: { column: 0, card: -1 },
  '\x1b[B': { column: 0, card: 1 },
  j: { column: 0, card: 1 },
  '\x1b[C': { column: 1, card: 0 },
  l: { column: 1, card: 0 },
  '\x1b[D': { column: -1, card: 0 },
  h: { column: -1, card: 0 },
}
const QUIT_KEYS = ['q', '\x1b', '\x03']
// Piped, so herdr's stderr lands in the error message instead of on the board.
const CAPTURED = { encoding: 'utf8', stdio: 'pipe' } as const

let columns = readColumns()
let selected: Selection = { column: 0, card: 0 }
let failure = ''

function readColumns() {
  const output = execFileSync(herdr, ['api', 'snapshot'], CAPTURED)
  return toColumns(JSON.parse(output).result.snapshot)
}

function selectedCard() {
  return columns[selected.column].cards[selected.card]
}

function draw() {
  const { columns: width, rows: height } = process.stdout
  const board = render(columns, selected, width, failure ? height - 1 : height)
  process.stdout.write(`${CLEAR_SCREEN}${board}${failure ? `\n${failure}` : ''}`)
}

function refresh() {
  const paneId = selectedCard()?.paneId
  try {
    columns = readColumns()
    failure = ''
  } catch (error) {
    // Keep the last board: a server restart or handoff fails a snapshot or two.
    failure = `Could not read herdr's state: ${(error as Error).message.split('\n')[0]}`
  }
  selected = (paneId && findCard(columns, paneId)) || clampSelection(columns, selected)
  draw()
}

function focusSelected() {
  const card = selectedCard()
  if (!card) return
  try {
    execFileSync(herdr, ['agent', 'focus', card.paneId], CAPTURED)
  } catch (error) {
    failure = `Could not focus ${card.title}: ${(error as Error).message.split('\n')[0]}`
    return draw()
  }
  process.exit(0)
}

process.stdout.write(ENTER_FULL_SCREEN)
// On 'exit' so a crash still gives the terminal back and its stack trace stays readable.
process.on('exit', () => process.stdout.write(LEAVE_FULL_SCREEN))
process.stdin.setRawMode(true)
process.stdin.setEncoding('utf8')
process.stdin.on('data', (key: string) => {
  if (QUIT_KEYS.includes(key)) process.exit(0)
  if (key === '\r') return focusSelected()
  const step = KEY_STEPS[key]
  if (!step) return
  selected = clampSelection(columns, {
    column: selected.column + step.column,
    card: selected.card + step.card,
  })
  draw()
})
process.stdout.on('resize', draw)
setInterval(refresh, REFRESH_MS)
draw()
