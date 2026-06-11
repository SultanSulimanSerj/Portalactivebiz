/** Excel column letters → 0-based index (A=0, Z=25, AA=26). */
export function columnLettersToIndex(col: string): number {
  let index = 0
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.charCodeAt(i) - 64)
  }
  return index - 1
}

export function parseCellAddress(address: string): { col: string; row: number } {
  const match = /^([A-Z]+)(\d+)$/.exec(address.toUpperCase())
  if (!match) {
    throw new Error(`Некорректный адрес ячейки: ${address}`)
  }
  return { col: match[1], row: parseInt(match[2], 10) }
}

export function compareCellAddresses(a: string, b: string): number {
  const pa = parseCellAddress(a)
  const pb = parseCellAddress(b)
  const colDiff = columnLettersToIndex(pa.col) - columnLettersToIndex(pb.col)
  if (colDiff !== 0) return colDiff
  return pa.row - pb.row
}
