export const MENTION_REGEX = /@([^\s@#]+(?:\s+[^\s@#]+)*)/g

export function extractMentionNames(content: string): string[] {
  const names: string[] = []
  const regex = new RegExp(MENTION_REGEX.source, MENTION_REGEX.flags)
  let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    names.push(match[1].trim())
  }
  return names
}
