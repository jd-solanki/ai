// An arrow key, an SGR mouse report or the terminal's colour reply is one escape sequence; anything else is one character.
const KEY = /\x1b\[[A-D]|\x1b\[<\d+;\d+;\d+[Mm]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|[\s\S]/g

export function splitKeys(chunk: string) {
  return chunk.match(KEY) ?? []
}
