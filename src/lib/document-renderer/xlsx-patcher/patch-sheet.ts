import { SharedStringTable } from './shared-strings'

const CELL_REGEX_CACHE = new Map<string, RegExp>()

function cellRegex(address: string): RegExp {
  let regex = CELL_REGEX_CACHE.get(address)
  if (!regex) {
    const escaped = address.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    regex = new RegExp(`<c r="${escaped}"([^>/]*)(?:/>|>([\\s\\S]*?)</c>)`, 'i')
    CELL_REGEX_CACHE.set(address, regex)
  }
  return regex
}

function extractStyle(attrs: string): string | null {
  const match = /\bs="(\d+)"/.exec(attrs)
  return match ? match[1] : null
}

function buildCellXml(
  address: string,
  style: string | null,
  value: string | number | null,
  sst: SharedStringTable
): string {
  const styleAttr = style != null ? ` s="${style}"` : ''

  if (value === null || value === '') {
    return `<c r="${address}"${styleAttr}/>`
  }

  if (typeof value === 'number') {
    return `<c r="${address}"${styleAttr}><v>${value}</v></c>`
  }

  const idx = sst.getIndex(value)
  return `<c r="${address}"${styleAttr} t="s"><v>${idx}</v></c>`
}

export function hideSheetRows(sheetXml: string, rows: number[]): string {
  if (rows.length === 0) return sheetXml
  const rowSet = new Set(rows)
  return sheetXml.replace(/<row\b([^>]*\br="(\d+)"[^>]*)>/g, (match, attrs, rowStr) => {
    const row = parseInt(rowStr, 10)
    if (!rowSet.has(row)) return match
    let updated = attrs
    if (!/\bhidden="1"/.test(updated)) {
      updated += ' hidden="1"'
    }
    if (/\bht="/.test(updated)) {
      updated = updated.replace(/\bht="[^"]*"/, 'ht="0"')
    } else {
      updated += ' ht="0" customHeight="1"'
    }
    return `<row${updated}>`
  })
}

export function patchSheetXml(
  sheetXml: string,
  assignments: Array<{ address: string; value: string | number | null }>,
  sst: SharedStringTable
): string {
  let result = sheetXml
  for (const { address, value } of assignments) {
    const regex = cellRegex(address)
    const match = regex.exec(result)
    if (!match) {
      continue
    }
    const style = extractStyle(match[1])
    const replacement = buildCellXml(address, style, value, sst)
    result = result.replace(match[0], replacement)
  }
  return result
}
