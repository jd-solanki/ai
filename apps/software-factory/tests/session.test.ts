import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { claudeArgs, type WebhookPayload } from '../src/session.ts'

const repository = { name: 'app', full_name: 'acme/app' }
const labeled = { action: 'labeled', sender: { login: 'octocat' }, repository }
function subject(...labels: string[]) {
  return {
    number: 12,
    html_url: 'https://github.com/acme/app/issues/12',
    labels: labels.map((name) => ({ name })),
  }
}
function launch(event: string, label: string, work: Partial<WebhookPayload>) {
  const launched = claudeArgs(event, { ...labeled, label: { name: label }, ...work })
  assert.ok('args' in launched, JSON.stringify(launched))
  return launched
}
const flag = (args: string[], name: string) => args[args.indexOf(name) + 1]
const implement = () => launch('issues', 'agent:implement', { issue: subject('issue:spec') })
const review = () => launch('pull_request', 'agent:review', { pull_request: subject() })
const fix = () => launch('pull_request', 'agent:fix', { pull_request: subject() })
const upgrade = () =>
  launch('pull_request', 'agent:upgrade', { pull_request: subject('⬆️ Renovate') })

test('claudeArgs starts the trigger label skill in a background session of its own', () => {
  const { args } = implement()
  assert.ok(args.includes('--bg'))
  assert.equal(flag(args, '--worktree'), 'implement-spec-12')
  assert.equal(flag(args, '--permission-mode'), 'auto')
  assert.equal(args.at(-1), '/implement-spec https://github.com/acme/app/issues/12')
  assert.equal(review().args.at(-1), '/review-pr https://github.com/acme/app/issues/12')
  assert.equal(fix().args.at(-1), '/implement https://github.com/acme/app/issues/12')
})

test('claudeArgs starts nothing for a label event that is not a trigger', () => {
  const skip = (event: string, payload: WebhookPayload) => claudeArgs(event, payload)
  assert.deepEqual(skip('ping', { repository }), { skip: 'Not a label applied to a work item' })
  assert.deepEqual(
    skip('issues', {
      ...labeled,
      action: 'unlabeled',
      label: { name: 'agent:implement' },
      issue: subject('issue:spec'),
    }),
    { skip: 'Not a label applied to a work item' },
  )
  assert.deepEqual(
    skip('issues', { ...labeled, label: { name: 'agent:review' }, issue: subject() }),
    { skip: 'Not a trigger label for issues' },
  )
  assert.deepEqual(
    skip('issues', { ...labeled, label: { name: 'agent:implement' }, issue: subject() }),
    { skip: 'Work item lacks issue:spec' },
  )
  assert.deepEqual(
    skip('pull_request', { ...labeled, label: { name: 'agent:upgrade' }, pull_request: subject() }),
    { skip: 'Work item lacks ⬆️ Renovate' },
  )
})

test('claudeArgs runs review at higher effort than implementation', () => {
  const rank = ['low', 'medium', 'high', 'xhigh', 'max']
  const effort = ({ args }: { args: string[] }) => rank.indexOf(flag(args, '--effort') ?? '')
  assert.ok(effort(review()) > effort(implement()))
})

test('claudeArgs tells each session who to mention and which agent it hands off to', () => {
  const prompt = ({ args }: { args: string[] }) => flag(args, '--append-system-prompt') ?? ''
  assert.match(prompt(implement()), /@octocat applied agent:implement/)
  assert.match(
    prompt(implement()),
    /goes on https:\/\/github.com\/acme\/app\/issues\/12, mentioning them/,
  )
  assert.match(prompt(implement()), /apply the agent:review label/)
  assert.match(prompt(review()), /apply the agent:fix label/)
  assert.match(prompt(fix()), /apply the agent:review label/)
  assert.match(prompt(upgrade()), /With commits, .*apply the agent:review label/)
  assert.match(prompt(upgrade()), /With none, .*mark the pull request ready for review/)
})

test('claudeArgs claims a work item with the working label of its trigger', () => {
  assert.equal(implement().claim.at(-1), 'agent:implementing')
  assert.equal(upgrade().claim.at(-1), 'agent:upgrading')
})

test('claudeArgs releases the claim once the session is idle, or on an API error with a comment', () => {
  const hook = (event: 'Stop' | 'StopFailure') =>
    JSON.parse(flag(review().args, '--settings') ?? '').hooks[event][0].hooks[0].command as string
  const released =
    "'gh' 'pr' 'edit' 'https://github.com/acme/app/issues/12' '--remove-label' 'agent:reviewing'"
  const [idle, stopReleased] = hook('Stop').split(' && ')
  assert.equal(stopReleased, released)
  const stop = (background_tasks: object[]) =>
    spawnSync('sh', ['-c', `${idle} && echo released`], {
      input: JSON.stringify({ background_tasks }),
      encoding: 'utf8',
    }).stdout
  assert.equal(stop([]), 'released\n')
  assert.equal(stop([{ type: 'shell', status: 'running' }]), '')
  assert.equal(
    hook('StopFailure'),
    `${released}; 'gh' 'pr' 'comment' 'https://github.com/acme/app/issues/12' '--body' '@octocat the agent:review run stopped on an API error before it finished. Apply agent:review again to retry.'`,
  )
})
