import { randomUUID } from 'node:crypto'
import { realpath } from 'node:fs/promises'
import { setTimeout as sleep } from 'node:timers/promises'
import type * as session from './session.ts'
import { refreshClone, run, sessionCommand } from './session.ts'

// The session host adapter for the Herdr app. `hc` runs the session and the labels put it in the window; `herdr-app do tab.new` would take focus.

const hostId = () => randomUUID().replaceAll('-', '')

// The repo workspace is the first the terminals at the clone itself name: `hc ls` has their folders and `hc get` their labels. A terminal another app started has no label.
async function findRepoSpace(clone: string): Promise<string | undefined> {
  const listed = await run('hc', ['ls', '--json'])
  try {
    const terminals: { address: string; cwd: string }[] = JSON.parse(listed.stdout).terminals
    const realClone = await realpath(clone)
    for (const { address, cwd } of terminals) {
      if (cwd !== realClone) continue
      const terminal = await run('hc', ['get', address, '--json'])
      const space = JSON.parse(terminal.stdout).labels['herdr.space']
      if (space) return space
    }
  } catch {
    // A core that is down, or a clone that is gone, fails the `hc run` that follows, which reports it.
  }
  return undefined
}

// The window refuses a rename until it adopts the tab, a moment after the terminal starts. A rename it never takes only costs the label.
async function renameTab(tab: string, name: string) {
  for (let tries = 0; tries < 20; tries++) {
    const renamed = await run('herdr-app', ['do', 'tab.rename', '--id', tab, '--name', name])
    if (!renamed.output.includes('no tab')) return
    await sleep(250)
  }
}

export const startSession: typeof session.startSession = async (launch, cwd) => {
  await refreshClone(cwd)
  // An id the window doesn't know becomes a new space or tab. A new space takes the repo's name, and closes with its last tab.
  const space = (await findRepoSpace(cwd)) ?? `sp${hostId()}`
  const tab = `tb${hostId()}`
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
    `herdr.tab=${tab}`,
    '--',
    sessionCommand(launch),
  ])
  try {
    // A warning on stderr must not break the parse.
    const { address } = JSON.parse(started.stdout)
    if (!address) throw new Error('no terminal address')
    await renameTab(tab, launch.tabLabel)
    return { ok: true, output: '', tab: address }
  } catch {
    // Thrown, it would crash the server with the claim held.
    return { ok: false, output: `hc run: ${started.output}` }
  }
}

// A run's tab holds one terminal, so ending it closes the tab, and a space with its last tab, with or without the window.
export const closeTab: typeof session.closeTab = async (tab) => {
  const killed = await run('hc', ['kill', tab, '--json'])
  // --rm answers not_found for a kill that worked, and a tab a human closed first is closed all the same.
  return { ...killed, ok: killed.ok || killed.output.includes('not_found') }
}
