import assert from 'node:assert/strict'
import { test } from 'node:test'
import { applyColorReplies, selectionStyle, type Rgb, type TerminalColors } from '../src/accent.ts'

test("applyColorReplies stores the terminal's background and palette colours, at any hex depth", () => {
  const colors: TerminalColors = new Map()
  const keys = [
    '\x1b]11;rgb:ffff/ffff/ffff\x1b\\',
    '\x1b]4;2;rgb:1e/75/4f\x07',
    'q',
    '\x1b]10;rgb:39/3a/34\x07',
  ]
  assert.equal(applyColorReplies(colors, keys), true)
  assert.deepEqual(
    colors,
    new Map<'background' | number, number[]>([
      ['background', [255, 255, 255]],
      [2, [30, 117, 79]],
    ]),
  )
  assert.equal(
    applyColorReplies(colors, ['\x1b]4;2;rgb:1e1e/7575/4f4f\x07']),
    false,
    'the same colour again',
  )
})

test('selectionStyle tints the background with a palette colour and writes in that colour', () => {
  const green: Rgb = [30, 117, 79]
  const light = new Map<'background' | number, Rgb>([
    ['background', [255, 255, 255]],
    [2, green],
  ])
  const dark = new Map<'background' | number, Rgb>([
    ['background', [40, 42, 54]],
    [2, [80, 250, 123]],
  ])
  assert.equal(selectionStyle(light, 2), '38;2;30;117;79;48;2;233;241;237')
  assert.equal(selectionStyle(dark, 2), '38;2;80;250;123;48;2;44;63;61')
  assert.equal(
    selectionStyle(new Map([[2, green]]), 2),
    '7;38;5;2',
    'reverse video without a background',
  )
})
