import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { claudeArgs } from '../src/session.ts'

const repository = { name: 'app', full_name: 'acme/app' }
const labeled = { action: 'labeled', sender: { login: 'octocat' }, repository }
function subject(...labels: string[]) {
  return { number: 12, html_url: 'https://github.com/acme/app/issues/12', labels: labels.map(name => ({ name })) }
}
function stopCommand(args: string[]): string {
  return JSON.parse(args[args.indexOf('--settings') + 1] ?? '').hooks.Stop[0].hooks[0].command
}

test('claudeArgs starts a skill only for a matching label event', () => {
  const args = (...launch: Parameters<typeof claudeArgs>) => Object.values(claudeArgs(...launch))[0] as string[]
  const implement = args('issues', { ...labeled, label: { name: 'agent:implement' }, issue: subject('issue:spec') })
  assert.deepEqual(implement?.slice(0, 9), ['--bg', '--name', 'agent:implement app#12', '--worktree', 'implement-spec-12', '--model', 'opus', '--effort', 'medium'])
  assert.equal(implement?.at(-1), '/implement-spec https://github.com/acme/app/issues/12')
  assert.deepEqual(claudeArgs('issues', { ...labeled, label: { name: 'agent:implement' }, issue: subject() }), { skip: 'Work item lacks issue:spec' })
  assert.deepEqual(claudeArgs('issues', { ...labeled, action: 'unlabeled', label: { name: 'agent:implement' }, issue: subject('issue:spec') }), { skip: 'Not a label applied to a work item' })
  assert.deepEqual(claudeArgs('issues', { ...labeled, label: { name: 'agent:review' }, issue: subject() }), { skip: 'Not a trigger label for issues' })
  const review = args('pull_request', { ...labeled, label: { name: 'agent:review' }, pull_request: subject() })
  assert.equal(review?.[review.indexOf('--effort') + 1], 'high')
  assert.equal(review?.at(-1), '/review-pr https://github.com/acme/app/issues/12')
  const fix = args('pull_request', { ...labeled, label: { name: 'agent:fix' }, pull_request: subject() })
  assert.equal(fix?.at(-1), '/implement https://github.com/acme/app/issues/12')
  assert.deepEqual(claudeArgs('ping', { repository }), { skip: 'Not a label applied to a work item' })
})

test('claudeArgs tells each session who to mention and which agent it hands off to', () => {
  const handOff = (event: string, label: string, work: object) => {
    const launch = claudeArgs(event, { ...labeled, label: { name: label }, ...work })
    assert.ok('args' in launch)
    return launch.args[launch.args.indexOf('--append-system-prompt') + 1] ?? ''
  }
  const implement = handOff('issues', 'agent:implement', { issue: subject('issue:spec') })
  assert.match(implement, /@octocat applied agent:implement/)
  assert.match(implement, /apply the agent:review label/)
  assert.match(handOff('pull_request', 'agent:review', { pull_request: subject() }), /apply the agent:fix label/)
  assert.match(handOff('pull_request', 'agent:fix', { pull_request: subject() }), /apply the agent:review label/)

  const review = claudeArgs('pull_request', { ...labeled, label: { name: 'agent:review' }, pull_request: subject() })
  assert.ok('args' in review)
  assert.deepEqual(JSON.parse(review.args[review.args.indexOf('--settings') + 1] ?? '').permissions.allow, ['Bash(gh pr ready:*)'])
})

test('claudeArgs swaps the trigger label for the working label and releases it once the session is idle', () => {
  const edit = ['pr', 'edit', 'https://github.com/acme/app/issues/12']
  const review = claudeArgs('pull_request', { ...labeled, label: { name: 'agent:review' }, pull_request: subject() })
  assert.ok('claim' in review)
  assert.deepEqual(review.claim, [...edit, '--remove-label', 'agent:review', '--add-label', 'agent:reviewing'])
  assert.deepEqual(review.release, [...edit, '--remove-label', 'agent:reviewing'])

  const [idle, released] = stopCommand(review.args).split(' && ')
  assert.equal(released, `gh ${review.release.join(' ')}`)
  const stop = (background_tasks: object[]) => spawnSync('sh', ['-c', `${idle} && echo released`], { input: JSON.stringify({ background_tasks }), encoding: 'utf8' }).stdout
  assert.equal(stop([]), 'released\n')
  assert.equal(stop([{ type: 'shell', status: 'running' }]), '')

  assert.deepEqual(
    claudeArgs('pull_request', { ...labeled, label: { name: 'agent:review' }, pull_request: subject('agent:review', 'agent:reviewing') }),
    { skip: 'Work item already carries agent:reviewing', unlabel: [...edit, '--remove-label', 'agent:review'] },
  )
})
