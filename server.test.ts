import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { test } from 'node:test'
import { claudeArgs, isSigned } from './server.ts'

const repository = { name: 'app', full_name: 'acme/app' }
function subject(...labels: string[]) {
  return { number: 12, html_url: 'https://github.com/acme/app/issues/12', labels: labels.map(name => ({ name })) }
}

test('claudeArgs starts a skill only for a matching label event', () => {
  const implement = claudeArgs('issues', { action: 'labeled', label: { name: 'agent:implement' }, repository, issue: subject('issue:spec') })
  assert.deepEqual(implement?.slice(0, 5), ['--bg', '--name', 'agent:implement app#12', '--worktree', 'implement-12'])
  assert.equal(implement?.at(-1), '/implement https://github.com/acme/app/issues/12')
  assert.equal(
    JSON.parse(implement?.[implement.indexOf('--settings') + 1] ?? '').hooks.Stop[0].hooks[0].command,
    'claude -p \'/create-pr https://github.com/acme/app/issues/12\' </dev/null',
  )
  assert.equal(claudeArgs('issues', { action: 'labeled', label: { name: 'agent:implement' }, repository, issue: subject() }), undefined)
  assert.equal(claudeArgs('issues', { action: 'unlabeled', label: { name: 'agent:implement' }, repository, issue: subject('issue:spec') }), undefined)
  assert.equal(claudeArgs('pull_request', { action: 'labeled', label: { name: 'pr:review' }, repository, pull_request: subject() })?.at(-1), '/review-pr https://github.com/acme/app/issues/12')
  assert.equal(claudeArgs('ping', { repository }), undefined)
})

test('isSigned accepts only the secret\'s signature', () => {
  const body = Buffer.from('{}')
  const signature = `sha256=${createHmac('sha256', 'secret').update(body).digest('hex')}`
  assert.ok(isSigned(body, signature, 'secret'))
  assert.ok(!isSigned(body, signature, 'other'))
  assert.ok(!isSigned(body, undefined, 'secret'))
})
