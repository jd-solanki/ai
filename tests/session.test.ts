import assert from 'node:assert/strict'
import { test } from 'node:test'
import { claudeArgs } from '../src/session.ts'

const repository = { name: 'app', full_name: 'acme/app' }
function subject(...labels: string[]) {
  return { number: 12, html_url: 'https://github.com/acme/app/issues/12', labels: labels.map(name => ({ name })) }
}

test('claudeArgs starts a skill only for a matching label event', () => {
  const args = (...launch: Parameters<typeof claudeArgs>) => Object.values(claudeArgs(...launch))[0] as string[]
  const implement = args('issues', { action: 'labeled', label: { name: 'agent:implement' }, repository, issue: subject('issue:spec') })
  assert.deepEqual(implement?.slice(0, 9), ['--bg', '--name', 'agent:implement app#12', '--worktree', 'implement-12', '--model', 'opus', '--effort', 'medium'])
  assert.equal(implement?.at(-1), '/implement https://github.com/acme/app/issues/12')
  assert.equal(
    JSON.parse(implement?.[implement.indexOf('--settings') + 1] ?? '').hooks.Stop[0].hooks[0].command,
    'claude -p \'/create-pr https://github.com/acme/app/issues/12\' </dev/null; gh issue edit https://github.com/acme/app/issues/12 --remove-label agent:implementing',
  )
  assert.deepEqual(claudeArgs('issues', { action: 'labeled', label: { name: 'agent:implement' }, repository, issue: subject() }), { skip: 'Work item lacks issue:spec' })
  assert.deepEqual(claudeArgs('issues', { action: 'unlabeled', label: { name: 'agent:implement' }, repository, issue: subject('issue:spec') }), { skip: 'Not a label applied to a work item' })
  assert.deepEqual(claudeArgs('issues', { action: 'labeled', label: { name: 'agent:review' }, repository, issue: subject() }), { skip: 'Not a trigger label for issues' })
  const review = args('pull_request', { action: 'labeled', label: { name: 'agent:review' }, repository, pull_request: subject() })
  assert.equal(review?.[review.indexOf('--effort') + 1], 'high')
  assert.equal(review?.at(-1), '/review-pr https://github.com/acme/app/issues/12')
  assert.deepEqual(claudeArgs('ping', { repository }), { skip: 'Not a label applied to a work item' })
})

test('claudeArgs swaps the trigger label for the working label and releases it on Stop', () => {
  const edit = ['pr', 'edit', 'https://github.com/acme/app/issues/12']
  const review = claudeArgs('pull_request', { action: 'labeled', label: { name: 'agent:review' }, repository, pull_request: subject() })
  assert.ok('claim' in review)
  assert.deepEqual(review.claim, [...edit, '--remove-label', 'agent:review', '--add-label', 'agent:reviewing'])
  assert.deepEqual(review.release, [...edit, '--remove-label', 'agent:reviewing'])
  assert.equal(
    JSON.parse(review.args[review.args.indexOf('--settings') + 1] ?? '').hooks.Stop[0].hooks[0].command,
    `gh ${review.release.join(' ')}`,
  )
  assert.deepEqual(
    claudeArgs('pull_request', { action: 'labeled', label: { name: 'agent:review' }, repository, pull_request: subject('agent:review', 'agent:reviewing') }),
    { skip: 'Work item already carries agent:reviewing', unlabel: [...edit, '--remove-label', 'agent:review'] },
  )
})
