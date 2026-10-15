import type { closeWorkspace, gh, Launch } from './session.ts'

export type Runs = Map<string, Pick<Launch, 'name' | 'release' | 'crash'> & { workspace: string }>

interface Factory {
  runs: Runs
  gh: typeof gh
  closeWorkspace: typeof closeWorkspace
}

// A run ends at its clean stop, or crashes when its session ends any other way.
// shortcut: a report sent while the server is down, or a session killed with no SessionEnd, leaves the claim held, poll herdr for run workspaces if that happens.
export async function handleRunReport(
  path: string,
  body: Buffer,
  { runs, gh, closeWorkspace }: Factory,
): Promise<{ status: number; body?: string }> {
  const [, , token = '', hook] = path.split('/')
  const run = runs.get(token)
  // Closing a run's workspace ends its session, which reports here once more.
  if (!run) return { status: 404, body: 'No run in progress for this report' }

  const why = { StopFailure: 'stopped on an API error', SessionEnd: 'exited' }[hook ?? '']
  if (!why) {
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
  }

  // The run lasts as long as its session, so it is released only once the session is gone.
  runs.delete(token)
  const closed = await closeWorkspace(run.workspace)
  if (!closed.ok) {
    runs.set(token, run)
    return { status: 500, body: `${run.name}: ${closed.output.trim()}` }
  }
  const outcomes = [await gh(run.release)]
  if (why) outcomes.push(await gh(run.crash(why)))
  const failed = outcomes.filter((outcome) => !outcome.ok)
  const outcome =
    failed.map(({ output }) => output.trim()).join('\n') || (why ? 'Crashed' : 'Ended')
  return { status: failed.length ? 500 : 200, body: `${run.name}: ${outcome}` }
}
