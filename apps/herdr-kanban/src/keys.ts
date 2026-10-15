// An arrow key is one escape sequence; anything else is one character.
const KEY = /\x1b\[[A-D]|[\s\S]/g

export function splitKeys(chunk: string) {
  return chunk.match(KEY) ?? []
}
