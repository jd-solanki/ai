import assert from 'node:assert/strict'
import { test } from 'node:test'
import { issueTab, tabLabel } from '../src/issue-tab.ts'

test('issueTab reads the issue number from a tab renamed to #<number>', () => {
  const event = {
    event: 'tab.renamed',
    data: { type: 'tab_renamed', tab_id: 'w1:t2', workspace_id: 'w1', label: '#29' },
  }
  assert.deepEqual(issueTab(event), { tabId: 'w1:t2', issueNumber: '29' })
})

test('issueTab ignores a label that is not exactly #<number>, so its own rename does not loop', () => {
  for (const label of ['#29 chore: nitpicks', 'notes', '#', '#29a', 'x#29']) {
    const event = {
      event: 'tab.renamed',
      data: { type: 'tab_renamed', tab_id: 'w1:t2', workspace_id: 'w1', label },
    }
    assert.equal(issueTab(event), undefined, label)
  }
})

test('issueTab reads the issue number from a tab created already labelled #<number>', () => {
  const tab = {
    tab_id: 'w1:t3',
    workspace_id: 'w1',
    number: 3,
    label: '#25',
    focused: true,
    pane_count: 1,
    agent_status: 'idle',
  }
  const event = { event: 'tab.created', data: { type: 'tab_created', tab } }
  assert.deepEqual(issueTab(event), { tabId: 'w1:t3', issueNumber: '25' })
})

const issue = (title: string) => ({ title, isPullRequest: false })

test('tabLabel marks an issue with 🛠️ and a pull request with 🔀', () => {
  assert.equal(tabLabel('7', issue('Fix it')), '🛠️ #7 Fix it')
  assert.equal(tabLabel('29', { title: 'Nitpicks', isPullRequest: true }), '🔀 #29 Nitpicks')
})

test('tabLabel keeps a title of up to 25 characters whole', () => {
  assert.equal(tabLabel('7', issue('Fix the login retry delay')), '🛠️ #7 Fix the login retry delay')
})

test('tabLabel clamps a longer title to 25 characters, ending in an ellipsis', () => {
  assert.equal(
    tabLabel('29', issue('chore(software-factory): nitpicks')),
    '🛠️ #29 chore(software-factory):…',
  )
  assert.equal(tabLabel('8', issue('🚀'.repeat(26))), `🛠️ #8 ${'🚀'.repeat(24)}…`)
})
