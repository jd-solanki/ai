import { createServer } from 'node:http'
import { buffer } from 'node:stream/consumers'
import { startSession } from './session.ts'
import { handleWebhook } from './webhook.ts'

const PORT = 3456

const { GITHUB_WEBHOOK_SECRET: secret, REPOS_DIR: reposDir } = process.env
if (!secret || !reposDir)
  throw new Error('Set GITHUB_WEBHOOK_SECRET and REPOS_DIR')
// `claude --bg` may spawn the long-lived background service, which hands this env to every later session.
delete process.env.GITHUB_WEBHOOK_SECRET

createServer(async (req, res) => {
  const { status, body } = await handleWebhook(req.headers, await buffer(req), { secret, reposDir, startSession })
  res.writeHead(status).end(body)
}).listen(PORT)
