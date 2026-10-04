import { createServer } from 'node:http'
import { buffer } from 'node:stream/consumers'
import { gh, startSession } from './session.ts'
import { handleWebhook } from './webhook.ts'

const PORT = 3456

const { GITHUB_WEBHOOK_SECRET: secret, REPOS_DIR: reposDir } = process.env
if (!secret || !reposDir) throw new Error('Set GITHUB_WEBHOOK_SECRET and REPOS_DIR')
// Every session inherits this env.
delete process.env.GITHUB_WEBHOOK_SECRET

createServer(async (req, res) => {
  const { status, body } = await handleWebhook(req.headers, await buffer(req), {
    secret,
    reposDir,
    startSession,
    gh,
  })
  console.log(new Date().toISOString(), req.headers['x-github-delivery'], status, body)
  res.writeHead(status).end(body)
}).listen(PORT)
