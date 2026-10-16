import { isDeepStrictEqual } from 'node:util'

export type Rgb = [number, number, number]
// The terminal's background under 'background', and its palette colours by number.
export type TerminalColors = Map<'background' | number, Rgb>

const COLOR_REPLY = /\](?:(11)|4;(\d+));rgb:([\da-f]+)\/([\da-f]+)\/([\da-f]+)/i
// How much colour the background takes, like a web UI's soft variant at 10% opacity.
const TINT = 0.1

// Asks the terminal for its background and the given palette colours.
// herdr answers from its theme, so asking again follows a light and dark switch.
export function colorQueries(paletteIndexes: number[]) {
  return `\x1b]11;?\x07${paletteIndexes.map((index) => `\x1b]4;${index};?\x07`).join('')}`
}

// Stores every colour reply among the keys, and says whether a colour changed, so a burst of replies costs one redraw at most.
export function applyColorReplies(colors: TerminalColors, keys: string[]) {
  let changed = false
  for (const key of keys) {
    const match = key.match(COLOR_REPLY)
    if (!match) continue
    const slot = match[1] ? 'background' : Number(match[2])
    // A channel comes as 1 to 4 hex digits, scaled to its own depth.
    const rgb = match
      .slice(3)
      .map((hex) => Math.round((parseInt(hex, 16) / (16 ** hex.length - 1)) * 255)) as Rgb
    if (isDeepStrictEqual(colors.get(slot), rgb)) continue
    colors.set(slot, rgb)
    changed = true
  }
  return changed
}

// SGR codes for a selected card: text in its palette colour on the background mixed toward it,
// or reverse video until the terminal reports both.
export function selectionStyle(colors: TerminalColors, paletteIndex: number) {
  const background = colors.get('background')
  const accent = colors.get(paletteIndex)
  if (!background || !accent) return `7;38;5;${paletteIndex}`
  const tint = background.map((channel, i) => Math.round(channel + (accent[i] - channel) * TINT))
  return `38;2;${accent.join(';')};48;2;${tint.join(';')}`
}
