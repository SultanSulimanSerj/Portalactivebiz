import { escapeXmlText } from './xml-escape'

const SI_TEXT_REGEX = /<si>([\s\S]*?)<\/si>/g
const SI_PLAIN_REGEX = /<t[^>]*>([\s\S]*?)<\/t>/

function extractSiText(siInner: string): string {
  const parts: string[] = []
  const tRegex = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g
  let match: RegExpExecArray | null
  while ((match = tRegex.exec(siInner)) !== null) {
    parts.push(match[1])
  }
  if (parts.length === 0) {
    const single = SI_PLAIN_REGEX.exec(siInner)
    return single ? single[1] : ''
  }
  return parts.join('')
}

export class SharedStringTable {
  private readonly strings: string[]
  private readonly indexByValue: Map<string, number>

  constructor(sstXml: string) {
    this.strings = []
    this.indexByValue = new Map()
    const inner = sstXml.replace(/^[\s\S]*?<sst[^>]*>/, '').replace(/<\/sst>[\s\S]*$/, '')
    let match: RegExpExecArray | null
    SI_TEXT_REGEX.lastIndex = 0
    while ((match = SI_TEXT_REGEX.exec(inner)) !== null) {
      const text = extractSiText(match[1])
      const index = this.strings.length
      this.strings.push(text)
      if (!this.indexByValue.has(text)) {
        this.indexByValue.set(text, index)
      }
    }
  }

  getIndex(value: string): number {
    const existing = this.indexByValue.get(value)
    if (existing !== undefined) return existing

    const index = this.strings.length
    this.strings.push(value)
    this.indexByValue.set(value, index)
    return index
  }

  toXml(): string {
    const items = this.strings
      .map((text) => `<si><t>${escapeXmlText(text)}</t></si>`)
      .join('')
    const count = this.strings.length
    return (
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${count}" uniqueCount="${count}">` +
      items +
      `</sst>`
    )
  }
}
