import { realpath } from 'node:fs/promises'
import type * as session from './session.ts'
import { refreshClone, run, sessionCommand } from './session.ts'

// The session host adapter for Orca. Orca must be running: its CLI reaches the app's runtime.
// shortcut: a run keeps its tab's handle, which an Orca restart invalidates, so a run ending after one keeps its claim; find the tab by title if Orca restarts mid-run.

// An Orca tab puts the session in the owner's agent list. Orca typed --command into a fresh shell in every trial, so nothing waits for the prompt.
export const startSession: typeof session.startSession = async (launch, cwd) => {
  await refreshClone(cwd)
  // Orca opens a tab only in a project it knows. Adding a known one changes nothing.
  const clone = await realpath(cwd).catch(() => cwd)
  const added = await run('orca', ['repo', 'add', '--path', clone, '--json'])
  if (!added.ok) return { ok: false, output: `orca repo add: ${added.output}` }
  const created = await run('orca', [
    'terminal',
    'create',
    '--worktree',
    `path:${clone}`,
    '--title',
    launch.tabLabel,
    '--command',
    sessionCommand(launch),
    '--json',
  ])
  try {
    // A warning on stderr must not break the parse.
    const { handle } = JSON.parse(created.stdout).result.terminal
    if (!handle) throw new Error('no terminal handle')
    return { ok: true, output: '', tab: handle }
  } catch {
    // Thrown, it would crash the server with the claim held.
    return { ok: false, output: `orca terminal create: ${created.output}` }
  }
}

// A stale handle stays a failed close: after an Orca restart its session may still run in Orca's terminal daemon.
// Orca answers `ptyKilled: false` even when the close ends the tab's process, so only the exit code counts.
export const closeTab: typeof session.closeTab = (tab) =>
  run('orca', ['terminal', 'close', '--terminal', tab, '--tab', '--json'])
