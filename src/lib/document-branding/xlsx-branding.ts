import ExcelJS from 'exceljs'
import { XLSX_BRANDING_ANCHORS, type ImagePlacement } from './anchors'

function imageExtension(mimeType: string): 'png' | 'jpeg' {
  return mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpeg' : 'png'
}

function readImagePixelSize(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length >= 24 && buffer[0] === 0x89 && buffer.toString('ascii', 1, 4) === 'PNG') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
  }
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2
    while (offset < buffer.length - 9) {
      if (buffer[offset] !== 0xff) break
      const marker = buffer[offset + 1]
      const len = buffer.readUInt16BE(offset + 2)
      if (marker === 0xc0 || marker === 0xc2 || marker === 0xc1) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        }
      }
      offset += 2 + len
    }
  }
  return null
}

function fitImagePixels(
  buffer: Buffer,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const size = readImagePixelSize(buffer)
  if (!size || size.width <= 0 || size.height <= 0) {
    return { width: maxWidth, height: maxHeight }
  }

  const aspect = size.width / size.height
  let width = maxWidth
  let height = Math.round(width / aspect)
  if (height > maxHeight) {
    height = maxHeight
    width = Math.round(height * aspect)
  }
  return { width, height }
}

function addImageToSheet(
  workbook: ExcelJS.Workbook,
  worksheet: ExcelJS.Worksheet,
  buffer: Buffer,
  mimeType: string,
  placement: ImagePlacement
) {
  const maxWidth = placement.maxWidth ?? placement.width
  const maxHeight = placement.maxHeight ?? placement.height
  const { width, height } = fitImagePixels(buffer, maxWidth, maxHeight)

  const imageId = workbook.addImage({
    buffer: buffer as unknown as ExcelJS.Buffer,
    extension: imageExtension(mimeType),
  })
  worksheet.addImage(imageId, {
    tl: { col: placement.col, row: placement.row },
    ext: { width, height },
  })
}

export async function applyBrandingToXlsx(
  xlsxBuffer: Buffer,
  category: string,
  options: {
    stamp?: { buffer: Buffer; mimeType: string } | null
    signature?: { buffer: Buffer; mimeType: string } | null
  }
): Promise<Buffer> {
  const anchors = XLSX_BRANDING_ANCHORS[category]
  if (!anchors) return xlsxBuffer

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(xlsxBuffer as unknown as ExcelJS.Buffer)
  const worksheet = workbook.worksheets[0]
  if (!worksheet) return xlsxBuffer

  if (options.stamp?.buffer && anchors.stamp) {
    addImageToSheet(workbook, worksheet, options.stamp.buffer, options.stamp.mimeType, anchors.stamp)
  }
  if (options.signature?.buffer && anchors.signature) {
    addImageToSheet(
      workbook,
      worksheet,
      options.signature.buffer,
      options.signature.mimeType,
      anchors.signature
    )
  }

  const out = await workbook.xlsx.writeBuffer()
  return Buffer.from(out)
}
