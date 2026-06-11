/** Имя PDF-файла УПД (содержимое — конвертация из официального XLSX, см. xlsx-to-pdf.ts) */
export function buildUpdPdfFileName(documentNumber: string, documentDate: string): string {
  return `Исходящий УПД № ${documentNumber} от ${documentDate}.pdf`
}
