import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { buffer } from 'node:stream/consumers'
import { setTimeout as sleep } from 'node:timers/promises'
import { handleRunReport, type Runs } from './run-end.ts'
import { closeTab, gh, PORT, startSession } from './session.ts'
import { findFactoryUp, handleWebhook } from './webhook.ts'

const { GITHUB_WEBHOOK_SECRET: secret, REPOS_DIR: reposDir, DEFER_TO } = process.env
if (!secret || !reposDir) throw new Error('Set GITHUB_WEBHOOK_SECRET and REPOS_DIR')
// git, gh and herdr inherit this env.
delete process.env.GITHUB_WEBHOOK_SECRET

// shortcut: runs live in memory, so a server restart leaves in-flight claims held, rebuild from herdr's run tabs if restarts get common.
const runs: Runs = new Map()

const preferredFactories = DEFER_TO?.split(',').filter(Boolean) ?? []

createServer(async (req, res) => {
  // Another factory's DEFER_TO checks that this one is up.
  if (req.method === 'HEAD') return res.end()
  const body = await buffer(req)
  const isRunReport = req.url?.startsWith('/runs/')
  const reply: Awaited<ReturnType<typeof handleRunReport>> = isRunReport
    ? await handleRunReport(req.url ?? '', body, { runs, gh, closeTab, sleep })
    : await handleWebhook(req.headers, body, {
        secret,
        reposDir,
        runs,
        startSession,
        gh,
        findPreferredFactoryUp: () => findFactoryUp(preferredFactories),
      })
  // A run report's path holds its token, so it is logged as a run report, not by its path.
  const source = isRunReport ? 'run report' : req.headers['x-github-delivery']
  const log = ({ status, body }: { status: number; body?: string }) =>
    console.log(new Date().toISOString(), source, status, body)
  log(reply)
  res.writeHead(reply.status).end(reply.body)
  // A clean stop ends its run after the reply, once the session has had its chance to take another turn.
  void reply.ended?.then(log)
}).listen(PORT, () =>
  spawn('pnpm', ['--silent', '--workspace-root', 'factory:check'], { stdio: 'inherit' }),
)
