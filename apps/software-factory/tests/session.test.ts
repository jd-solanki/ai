import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { claudeArgs } from '../src/session.ts'

const repository = { name: 'app', full_name: 'acme/app' }
const labeled = { action: 'labeled', sender: { login: 'octocat' }, repository }
function subject(...labels: string[]) {
  return {
    number: 12,
    html_url: 'https://github.com/acme/app/issues/12',
    labels: labels.map((name) => ({ name })),
  }
}
function settings(args: string[]) {
  return JSON.parse(args[args.indexOf('--settings') + 1] ?? '')
}
function hookCommand(args: string[], event: 'Stop' | 'StopFailure'): string {
  return settings(args).hooks[event][0].hooks[0].command
}

test('claudeArgs starts a skill only for a matching label event', () => {
  const args = (...launch: Parameters<typeof claudeArgs>) =>
    Object.values(claudeArgs(...launch))[0] as string[]
  const implement = args('issues', {
    ...labeled,
    label: { name: 'agent:implement' },
    issue: subject('issue:spec'),
  })
  assert.deepEqual(implement?.slice(0, 11), [
    '--bg',
    '--name',
    'agent:implement app#12',
    '--worktree',
    'implement-spec-12',
    '--model',
    'opus',
    '--effort',
    'medium',
    '--permission-mode',
    'auto',
  ])
  assert.equal(implement?.at(-1), '/implement-spec https://github.com/acme/app/issues/12')
  assert.deepEqual(
    claudeArgs('issues', { ...labeled, label: { name: 'agent:implement' }, issue: subject() }),
    { skip: 'Work item lacks issue:spec' },
  )
  assert.deepEqual(
    claudeArgs('issues', {
      ...labeled,
      action: 'unlabeled',
      label: { name: 'agent:implement' },
      issue: subject('issue:spec'),
    }),
    { skip: 'Not a label applied to a work item' },
  )
  assert.deepEqual(
    claudeArgs('issues', { ...labeled, label: { name: 'agent:review' }, issue: subject() }),
    { skip: 'Not a trigger label for issues' },
  )
  const review = args('pull_request', {
    ...labeled,
    label: { name: 'agent:review' },
    pull_request: subject(),
  })
  assert.equal(review?.[review.indexOf('--effort') + 1], 'high')
  assert.equal(review?.at(-1), '/review-pr https://github.com/acme/app/issues/12')
  const fix = args('pull_request', {
    ...labeled,
    label: { name: 'agent:fix' },
    pull_request: subject(),
  })
  assert.equal(fix?.at(-1), '/implement https://github.com/acme/app/issues/12')
  assert.deepEqual(claudeArgs('ping', { repository }), {
    skip: 'Not a label applied to a work item',
  })
})

test('claudeArgs tells each session who to mention and which agent it hands off to', () => {
  const handOff = (event: string, label: string, work: object) => {
    const launch = claudeArgs(event, { ...labeled, label: { name: label }, ...work })
    assert.ok('args' in launch)
    return launch.args[launch.args.indexOf('--append-system-prompt') + 1] ?? ''
  }
  const implement = handOff('issues', 'agent:implement', { issue: subject('issue:spec') })
  assert.match(implement, /@octocat applied agent:implement/)
  assert.match(implement, /goes on https:\/\/github.com\/acme\/app\/issues\/12, mentioning them/)
  assert.match(implement, /apply the agent:review label/)
  assert.match(
    handOff('pull_request', 'agent:review', { pull_request: subject() }),
    /apply the agent:fix label/,
  )
  assert.match(
    handOff('pull_request', 'agent:fix', { pull_request: subject() }),
    /apply the agent:review label/,
  )
  const upgradeHandOff = handOff('pull_request', 'agent:upgrade', {
    pull_request: subject('⬆️ Renovate'),
  })
  assert.match(upgradeHandOff, /With commits, .*apply the agent:review label/)
  assert.match(upgradeHandOff, /With none, .*mark the pull request ready for review/)
  assert.match(upgradeHandOff, /Comment on each match, not on this pull request/)
  const upgrade = { ...labeled, label: { name: 'agent:upgrade' } }
  assert.deepEqual(claudeArgs('pull_request', { ...upgrade, pull_request: subject() }), {
    skip: 'Work item lacks ⬆️ Renovate',
  })
  const claimed = claudeArgs('pull_request', { ...upgrade, pull_request: subject('⬆️ Renovate') })
  assert.ok('claim' in claimed)
  assert.equal(claimed.claim.at(-1), 'agent:upgrading')

  const review = claudeArgs('pull_request', {
    ...labeled,
    label: { name: 'agent:review' },
    pull_request: subject(),
  })
  assert.ok('args' in review)
  assert.deepEqual(settings(review.args).permissions.allow, [
    'Bash(gh pr ready:*)',
    'Bash(gh pr edit:*)',
  ])
  assert.equal(settings(review.args).worktree.baseRef, 'fresh')
})

test('claudeArgs swaps the trigger label for the working label and releases it once the session is idle', () => {
  const edit = ['pr', 'edit', 'https://github.com/acme/app/issues/12']
  const review = claudeArgs('pull_request', {
    ...labeled,
    label: { name: 'agent:review' },
    pull_request: subject(),
  })
  assert.ok('claim' in review)
  assert.deepEqual(review.claim, [
    ...edit,
    '--remove-label',
    'agent:review',
    '--add-label',
    'agent:reviewing',
  ])
  assert.deepEqual(review.release, [...edit, '--remove-label', 'agent:reviewing'])

  const released =
    "'gh' 'pr' 'edit' 'https://github.com/acme/app/issues/12' '--remove-label' 'agent:reviewing'"
  const [idle, stopReleased] = hookCommand(review.args, 'Stop').split(' && ')
  assert.equal(stopReleased, released)
  const stop = (background_tasks: object[]) =>
    spawnSync('sh', ['-c', `${idle} && echo released`], {
      input: JSON.stringify({ background_tasks }),
      encoding: 'utf8',
    }).stdout
  assert.equal(stop([]), 'released\n')
  assert.equal(stop([{ type: 'shell', status: 'running' }]), '')
  assert.equal(
    hookCommand(review.args, 'StopFailure'),
    `${released}; 'gh' 'pr' 'comment' 'https://github.com/acme/app/issues/12' '--body' '@octocat the agent:review run stopped on an API error before it finished. Apply agent:review again to retry.'`,
  )

  assert.deepEqual(
    claudeArgs('pull_request', {
      ...labeled,
      label: { name: 'agent:review' },
      pull_request: subject('agent:review', 'agent:reviewing'),
    }),
    {
      skip: 'Work item already carries agent:reviewing',
      unlabel: [...edit, '--remove-label', 'agent:review'],
    },
  )
})
