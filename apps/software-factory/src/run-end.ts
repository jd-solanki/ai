import { crash, handOff } from './hand-off.ts'
import type { closeTab, gh, Launch } from './session.ts'

export type Run = Pick<Launch, 'name' | 'work' | 'release'> & {
  tab: string
  cwd: string
  // The clean stop waiting to end the run, until the session takes another turn.
  cleanStop?: symbol
}
export type Runs = Map<string, Run>

interface Factory {
  runs: Runs
  gh: typeof gh
  closeTab: typeof closeTab
  sleep: (ms: number) => Promise<unknown>
}

type Reply = { status: number; body?: string }

// A session takes the turn a queued result starts within milliseconds of its Stop's reply: 12ms in jd-solanki/ai#30.
const NEXT_TURN_WAIT_MS = 5000

// Why a run crashed, by the hook that reported its session ending before a clean stop.
const CRASHES: Record<string, string> = {
  StopFailure: 'stopped on an API error before it finished',
  SessionEnd: 'exited before it finished',
}

// A run ends at its clean stop, handing its work item on, or crashes when its session ends any other way.
// shortcut: a report sent while the server is down, or a session killed with no SessionEnd, leaves the claim held, poll herdr for run tabs if that happens.
export async function handleRunReport(
  path: string,
  body: Buffer,
  factory: Factory,
): Promise<Reply & { ended?: Promise<Reply> }> {
  const [, , token = '', hook = ''] = path.split('/')
  const run = factory.runs.get(token)
  // Closing a run's tab ends its session, which reports here once more.
  if (!run) return { status: 404, body: 'No run in progress for this report' }

  if (hook === 'UserPromptSubmit') {
    run.cleanStop = undefined
    return { status: 200, body: `${run.name}: Started a turn` }
  }
  if (Object.hasOwn(CRASHES, hook)) return endRun({ token, run, hook, body }, factory)
  if (hook !== 'Stop') return { status: 404, body: `Not a run report: ${hook}` }

  let backgroundTasks: unknown
  try {
    backgroundTasks = JSON.parse(body.toString()).background_tasks
  } catch {
    return { status: 400, body: `${run.name}: A Stop report must be JSON` }
  }
  // A Stop that does not say no background work is left is not a clean stop.
  if (!Array.isArray(backgroundTasks) || backgroundTasks.length)
    return { status: 200, body: `${run.name}: Background work may still be running` }

  // A subagent that finished during the turn is in no background task, yet its queued result starts another turn once this Stop is answered.
  const cleanStop = Symbol('clean stop')
  run.cleanStop = cleanStop
  const ended = factory.sleep(NEXT_TURN_WAIT_MS).then((): Reply | Promise<Reply> => {
    if (factory.runs.get(token) !== run) return { status: 200, body: `${run.name}: Already ended` }
    if (run.cleanStop !== cleanStop) return { status: 200, body: `${run.name}: Took another turn` }
    return endRun({ token, run, hook, body }, factory)
  })
  return { status: 202, body: `${run.name}: Ends unless the session takes another turn`, ended }
}

async function endRun(
  { token, run, hook, body }: { token: string; run: Run; hook: string; body: Buffer },
  { runs, gh, closeTab }: Factory,
): Promise<Reply> {
  // The run lasts as long as its session, so it is released only once the session is gone.
  runs.delete(token)
  const closed = await closeTab(run.tab)
  // A session that ended runs no more, so a close herdr refuses must not keep its claim.
  if (!closed.ok && hook !== 'SessionEnd') {
    runs.set(token, run)
    return { status: 500, body: `${run.name}: ${closed.output.trim()}` }
  }
  // The API error behind a StopFailure goes to the server's log only, not to the work item.
  const ghInClone = (args: string[]) => gh(args, run.cwd)
  const crashed = hook === 'StopFailure' ? `Crashed: ${body.toString().trim()}` : 'Crashed'
  const why = Object.hasOwn(CRASHES, hook) ? CRASHES[hook] : undefined
  const { outcomes, did } = why
    ? {
        outcomes: await crash(run, why, ghInClone),
        did: crashed,
      }
    : await handOff(run, ghInClone)
  const failed = outcomes.filter((outcome) => !outcome.ok)
  const outcome = failed.map(({ output }) => output.trim()).join('\n') || did
  return { status: failed.length ? 500 : 200, body: `${run.name}: ${outcome}` }
}
