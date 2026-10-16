import assert from 'node:assert/strict'
import { test } from 'node:test'
import { splitKeys } from '../src/keys.ts'

test('splitKeys reads every key in a chunk typed or sent at once', () => {
  assert.deepEqual(splitKeys('ll\x1b[Bk\r'), ['l', 'l', '\x1b[B', 'k', '\r'])
  assert.deepEqual(splitKeys('\x1b'), ['\x1b'])
})

test('splitKeys keeps a mouse click whole', () => {
  assert.deepEqual(splitKeys('\x1b[<0;12;5M\x1b[<0;12;5mj'), [
    '\x1b[<0;12;5M',
    '\x1b[<0;12;5m',
    'j',
  ])
})

test("splitKeys keeps the terminal's colour reply whole, whichever terminator ends it", () => {
  assert.deepEqual(splitKeys('\x1b]11;rgb:ffff/ffff/ffff\x1b\\\x1b]4;2;rgb:1e/75/4f\x07q'), [
    '\x1b]11;rgb:ffff/ffff/ffff\x1b\\',
    '\x1b]4;2;rgb:1e/75/4f\x07',
    'q',
  ])
})
