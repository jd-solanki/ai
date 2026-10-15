// An arrow key or an SGR mouse report is one escape sequence; anything else is one character.
const KEY = /\x1b\[[A-D]|\x1b\[<\d+;\d+;\d+[Mm]|[\s\S]/g

export function splitKeys(chunk: string) {
  return chunk.match(KEY) ?? []
}
