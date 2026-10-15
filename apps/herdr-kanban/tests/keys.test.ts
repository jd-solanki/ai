import assert from 'node:assert/strict'
import { test } from 'node:test'
import { splitKeys } from '../src/keys.ts'

test('splitKeys reads every key in a chunk typed or sent at once', () => {
  assert.deepEqual(splitKeys('ll\x1b[Bk\r'), ['l', 'l', '\x1b[B', 'k', '\r'])
  assert.deepEqual(splitKeys('\x1b'), ['\x1b'])
})
