import type { EdoXmlRenderer } from '../types'

/**
 * Заглушка для будущего XML-экспорта в ЭДО (ON_NSCHFDOPPR и др.).
 * Реализация — отдельный этап после стабилизации XLSX/PDF/DOCX.
 */
export class EdoXmlRendererNotImplementedError extends Error {
  constructor(formatId: string) {
    super(
      `XML-экспорт (${formatId}) для ЭДО пока не реализован. Сначала формируйте печатную форму.`
    )
    this.name = 'EdoXmlRendererNotImplementedError'
  }
}

export function createEdoXmlRendererStub(formatId: string): EdoXmlRenderer {
  return {
    formatId,
    async render() {
      throw new EdoXmlRendererNotImplementedError(formatId)
    },
  }
}

export const UPD_EDO_FORMAT_ID = 'ON_NSCHFDOPPR'
export const updEdoXmlRenderer = createEdoXmlRendererStub(UPD_EDO_FORMAT_ID)
