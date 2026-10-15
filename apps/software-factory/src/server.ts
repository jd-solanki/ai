import { createServer } from 'node:http'
import { buffer } from 'node:stream/consumers'
import { handleRunReport, type Runs } from './run-end.ts'
import { closeWorkspace, gh, PORT, startSession } from './session.ts'
import { handleWebhook } from './webhook.ts'

const { GITHUB_WEBHOOK_SECRET: secret, REPOS_DIR: reposDir } = process.env
if (!secret || !reposDir) throw new Error('Set GITHUB_WEBHOOK_SECRET and REPOS_DIR')
// git, gh and herdr inherit this env.
delete process.env.GITHUB_WEBHOOK_SECRET

// shortcut: runs live in memory, so a server restart leaves in-flight claims held, rebuild from herdr's run workspaces if restarts get common.
const runs: Runs = new Map()

createServer(async (req, res) => {
  const body = await buffer(req)
  const isRunReport = req.url?.startsWith('/runs/')
  const { status, body: outcome } = isRunReport
    ? await handleRunReport(req.url ?? '', body, { runs, gh, closeWorkspace })
    : await handleWebhook(req.headers, body, { secret, reposDir, runs, startSession, gh })
  // A run report's path holds its token, so it is logged as a run report, not by its path.
  const source = isRunReport ? 'run report' : req.headers['x-github-delivery']
  console.log(new Date().toISOString(), source, status, outcome)
  res.writeHead(status).end(outcome)
}).listen(PORT)
