import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { applyColorReplies, colorQueries, type TerminalColors } from './accent.ts'
import {
  cardAt,
  clampSelection,
  findCard,
  render,
  rowsFrom,
  STATE_COLORS,
  toColumns,
  type Selection,
} from './board.ts'
import { splitKeys } from './keys.ts'

const herdr = process.env.HERDR_BIN_PATH ?? 'herdr'
// shortcut: polls the snapshot because the herdr CLI has no event stream; move to the socket's events.subscribe if polling ever lags.
const REFRESH_MS = 1000
const ENTER_FULL_SCREEN = '\x1b[?1049h\x1b[?25l\x1b[?1000h\x1b[?1006h' // alternate screen, cursor hidden, SGR mouse clicks
const LEAVE_FULL_SCREEN = '\x1b[?1006l\x1b[?1000l\x1b[?25h\x1b[?1049l'
const LEFT_CLICK = /^\x1b\[<0;(\d+);(\d+)M$/
// Button 8 is a left click with Option held. A terminal never reports Cmd: Cmd+click arrives as a plain click.
const OPTION_CLICK = /^\x1b\[<8;(\d+);(\d+)M$/
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
const QUIT_KEYS = ['q', '\x03']
const COLOR_QUERIES = colorQueries(Object.values(STATE_COLORS))
// Piped, so herdr's stderr lands in the error message instead of on the board.
// Timed out, because a blocked call freezes the quit keys.
const CAPTURED = { encoding: 'utf8', stdio: 'pipe', timeout: 3000 } as const

const rows = rowsFrom(readHerdrConfig())
let columns = readColumns()
let selected: Selection = { column: 0, card: 0 }
let failure = ''
// Kept until the next Enter or click, as a refresh clears only its own failure.
let actionFailure = ''
const terminalColors: TerminalColors = new Map()

// herdr gives a plugin none of its config, but its help names the file it reads, on any platform.
function readHerdrConfig() {
  try {
    const path = execFileSync(herdr, ['--help'], CAPTURED).match(/^Config: (.+)$/m)?.[1]
    return path ? readFileSync(path, 'utf8') : ''
  } catch {
    // No config file means herdr's defaults.
    return ''
  }
}

function readColumns() {
  const output = execFileSync(herdr, ['api', 'snapshot'], CAPTURED)
  return toColumns(JSON.parse(output).result.snapshot, rows)
}

function selectedCard() {
  return columns[selected.column].cards[selected.card]
}

function draw() {
  const { columns: width, rows: height } = process.stdout
  const message = failure || actionFailure
  const board = render(columns, selected, width, message ? height - 1 : height, terminalColors)
  process.stdout.write(`${CLEAR_SCREEN}${board}${message ? `\n\x1b[31m${message}\x1b[0m` : ''}`)
}

function refresh() {
  const paneId = selectedCard()?.paneId
  try {
    columns = readColumns()
    failure = ''
  } catch (error) {
    // Keep the last board: a server restart or handoff fails a snapshot or two.
    failure = `Could not read herdr's state: ${firstLine(error)}`
  }
  selected = (paneId && findCard(columns, paneId)) || clampSelection(columns, selected)
  draw()
  process.stdout.write(COLOR_QUERIES)
}

function focusSelected() {
  actionFailure = ''
  const card = selectedCard()
  if (!card) return
  try {
    execFileSync(herdr, ['agent', 'focus', card.paneId], CAPTURED)
  } catch (error) {
    actionFailure = `Could not focus ${card.lines.join(' ')}: ${firstLine(error)}`
    draw()
  }
}

function openSelectedOnGitHub() {
  actionFailure = ''
  const card = selectedCard()
  if (!card) return
  if (!card.issue) {
    actionFailure = `No #number in the tab name of ${card.lines.join(' ')}`
    return draw()
  }
  try {
    execFileSync('gh', ['browse', card.issue.number], { ...CAPTURED, cwd: card.issue.cwd })
  } catch (error) {
    actionFailure = `Could not open #${card.issue.number} on GitHub: ${firstLine(error)}`
    draw()
  }
}

function firstLine(error: unknown) {
  return (error as Error).message.split('\n')[0]
}

function click(x: number, y: number, act: () => void) {
  const card = cardAt(columns, process.stdout.columns, x, y)
  if (!card) return
  selected = card
  draw()
  act()
}

function press(key: string) {
  if (QUIT_KEYS.includes(key)) process.exit(0)
  if (key === '\r') return focusSelected()
  const leftClick = key.match(LEFT_CLICK)
  if (leftClick) return click(Number(leftClick[1]), Number(leftClick[2]), focusSelected)
  const optionClick = key.match(OPTION_CLICK)
  if (optionClick)
    return click(Number(optionClick[1]), Number(optionClick[2]), openSelectedOnGitHub)
  const step = KEY_STEPS[key]
  if (!step) return
  selected = clampSelection(columns, {
    column: selected.column + step.column,
    card: selected.card + step.card,
  })
  draw()
}

process.stdout.write(ENTER_FULL_SCREEN)
// On 'exit' so a crash still gives the terminal back and its stack trace stays readable.
process.on('exit', () => process.stdout.write(LEAVE_FULL_SCREEN))
process.stdin.setRawMode(true)
process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk: string) => {
  const keys = splitKeys(chunk)
  // press ignores a colour reply; the replies to one refresh's question arrive together.
  keys.forEach(press)
  if (applyColorReplies(terminalColors, keys)) draw()
})
process.stdout.on('resize', draw)
setInterval(refresh, REFRESH_MS)
draw()
process.stdout.write(COLOR_QUERIES)
