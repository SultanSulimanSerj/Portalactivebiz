import type { XlsxQualityMetrics } from '../types'

export function inspectXlsxXml(sheetXml: string, sharedStringsXml: string): XlsxQualityMetrics {
  const mergeMatches = sheetXml.match(/<mergeCell ref="/g)
  const mergeCount = mergeMatches ? mergeMatches.length : 0

  const texts: string[] = []
  const siRegex = /<si>([\s\S]*?)<\/si>/g
  let siMatch: RegExpExecArray | null
  while ((siMatch = siRegex.exec(sharedStringsXml)) !== null) {
    const tRegex = /<t[^>]*>([\s\S]*?)<\/t>/g
    let tMatch: RegExpExecArray | null
    let combined = ''
    while ((tMatch = tRegex.exec(siMatch[1])) !== null) {
      combined += tMatch[1]
    }
    texts.push(combined)
  }

  const countSubstring = (needle: string) =>
    texts.filter((text) => text.includes(needle)).length

  return {
    mergeCount,
    substringCounts: {
      '(подпись)': countSubstring('(подпись)'),
      '(ф.и.о.)': countSubstring('(ф.и.о.)'),
    },
  }
}

export function assertUpdQuality(metrics: XlsxQualityMetrics, expectedMerges = 338): void {
  if (metrics.mergeCount !== expectedMerges) {
    throw new Error(
      `Нарушена структура УПД: merge cells ${metrics.mergeCount}, ожидалось ${expectedMerges}`
    )
  }
  if (metrics.substringCounts['(подпись)'] !== 1) {
    throw new Error(
      `Нарушена структура УПД: (подпись) x${metrics.substringCounts['(подпись)']}, ожидалось 1`
    )
  }
  if (metrics.substringCounts['(ф.и.о.)'] !== 1) {
    throw new Error(
      `Нарушена структура УПД: (ф.и.о.) x${metrics.substringCounts['(ф.и.о.)']}, ожидалось 1`
    )
  }
}
