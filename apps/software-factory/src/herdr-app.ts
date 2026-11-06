import { randomUUID } from 'node:crypto'
import { realpath } from 'node:fs/promises'
import { setTimeout as sleep } from 'node:timers/promises'
import type * as session from './session.ts'
import { refreshClone, run, sessionCommand } from './session.ts'

// The session host adapter for the Herdr app. `hc` runs the session and the labels put it in the window; `herdr-app do tab.new` would take focus.

const newId = () => randomUUID().replaceAll('-', '')

// The repo workspace is the first the terminals at the clone itself name. A terminal another app started has no label.
async function findRepoWorkspace(clone: string): Promise<string | undefined> {
  const listed = await run('hc', ['ls', '--json'])
  try {
    const terminals: { address: string }[] = JSON.parse(listed.stdout).terminals
    const realClone = await realpath(clone)
    for (const { address } of terminals) {
      const terminal = await run('hc', ['get', address, '--json'])
      // A terminal that exited since the list answers nothing.
      if (!terminal.ok) continue
      const { cwd, foreground, labels } = JSON.parse(terminal.stdout)
      // `cwd` is where the terminal started; a shell cd'd into another repo since must not count.
      if ((foreground?.cwd ?? cwd) === realClone && labels['herdr.space'])
        return labels['herdr.space']
    }
  } catch {
    // A core `hc` can't reach, or a clone that is gone, fails the `hc run` that follows, which reports it.
  }
}

// The window refuses a rename until it adopts the tab, a moment after the terminal starts. A rename it never takes, as with no window open, only costs the label.
async function renameTab(tabId: string, name: string) {
  for (let tries = 0; tries < 20; tries++) {
    const renamed = await run('herdr-app', ['do', 'tab.rename', '--id', tabId, '--name', name])
    if (!renamed.output.includes('no tab')) return
    await sleep(250)
  }
}

export const startSession: typeof session.startSession = async (launch, cwd) => {
  await refreshClone(cwd)
  // An id the window doesn't know becomes a new space or tab. A new space takes the repo's name, and closes with its last tab.
  const space = (await findRepoWorkspace(cwd)) ?? `sp${newId()}`
  const tabId = `tb${newId()}`
  const started = await run('hc', [
    'run',
    '--bg',
    '--json',
    // The server runs in an hc terminal: its child would end with it.
    '--no-parent',
    '--rm',
    '--cwd',
    cwd,
    '--label',
    `herdr.space=${space}`,
    '--label',
    `herdr.tab=${tabId}`,
    '--',
    sessionCommand(launch),
  ])
  try {
    // A warning on stderr must not break the parse.
    const { address } = JSON.parse(started.stdout)
    if (!address) throw new Error('no terminal address')
    // Not awaited: the run registers when this returns, and a crash reported before then finds no run and keeps its claim.
    void renameTab(tabId, launch.tabLabel)
    return { ok: true, output: '', tab: address }
  } catch {
    // Thrown, it would crash the server with the claim held.
    return { ok: false, output: `hc run: ${started.output}` }
  }
}

// Ending the run's terminal closes its tab, and a space with its last tab, with or without the window.
// shortcut: a shell the owner split into a run's tab outlives the run, close the tab by its id if that gets in the way.
export const closeTab: typeof session.closeTab = async (tab) => {
  const killed = await run('hc', ['kill', tab, '--json'])
  // --rm answers not_found for a kill that worked, and a tab a human closed first is closed all the same.
  return { ...killed, ok: killed.ok || killed.output.includes('not_found') }
}
