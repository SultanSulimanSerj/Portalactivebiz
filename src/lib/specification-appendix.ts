import {
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageBreak,
} from 'docx'

export interface SpecificationItem {
  name: string
  description?: string | null
  quantity: number
  unit: string
  unitPrice: number
  total: number
  category: string
}

export interface SpecificationData {
  estimateName: string
  contractNumber: string
  contractDate: string
  projectName: string
  workAddress: string
  startDate: string
  endDate: string
  items: SpecificationItem[]
  total: number
  totalCost: number
  profit: number
  vatEnabled: boolean
  vatRate: number
  vatAmount: number
  totalWithVat: number
}

function formatMoney(value: number): string {
  return value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function headerCell(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20 })] })],
    shading: { fill: 'E8E8E8' },
  })
}

function bodyCell(text: string, align?: (typeof AlignmentType)[keyof typeof AlignmentType]): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        text,
        alignment: align,
      }),
    ],
  })
}

export function buildSpecificationAppendix(data: SpecificationData): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      text: `Приложение № 1 к Договору № ${data.contractNumber} от ${data.contractDate}`,
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      text: `СПЕЦИФИКАЦИЯ № 1`,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: `Наименование: ${data.estimateName}`,
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: `Объект / проект: ${data.projectName}`,
      spacing: { after: 100 },
    }),
  ]

  if (data.workAddress) {
    elements.push(
      new Paragraph({
        text: `Адрес выполнения работ: ${data.workAddress}`,
        spacing: { after: 100 },
      })
    )
  }

  if (data.startDate || data.endDate) {
    elements.push(
      new Paragraph({
        text: `Срок выполнения работ: ${data.startDate || '—'} — ${data.endDate || '—'}`,
        spacing: { after: 200 },
      })
    )
  }

  const tableRows = [
    new TableRow({
      children: [
        headerCell('№'),
        headerCell('Наименование'),
        headerCell('Категория'),
        headerCell('Кол-во'),
        headerCell('Ед.'),
        headerCell('Цена, ₽'),
        headerCell('Сумма, ₽'),
      ],
    }),
    ...data.items.map((item, index) =>
      new TableRow({
        children: [
          bodyCell(String(index + 1), AlignmentType.CENTER),
          bodyCell(item.description ? `${item.name} (${item.description})` : item.name),
          bodyCell(item.category),
          bodyCell(formatMoney(item.quantity), AlignmentType.RIGHT),
          bodyCell(item.unit, AlignmentType.CENTER),
          bodyCell(formatMoney(item.unitPrice), AlignmentType.RIGHT),
          bodyCell(formatMoney(item.total), AlignmentType.RIGHT),
        ],
      })
    ),
  ]

  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
        insideVertical: { style: BorderStyle.SINGLE, size: 1 },
      },
      rows: tableRows,
    })
  )

  elements.push(
    new Paragraph({
      text: `Итого по спецификации: ${formatMoney(data.total)} ₽`,
      alignment: AlignmentType.RIGHT,
      spacing: { before: 200, after: 100 },
    })
  )

  if (data.vatEnabled) {
    elements.push(
      new Paragraph({
        text: `НДС (${data.vatRate}%): ${formatMoney(data.vatAmount)} ₽`,
        alignment: AlignmentType.RIGHT,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: `Всего с НДС: ${formatMoney(data.totalWithVat)} ₽`,
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 },
      })
    )
  } else {
    elements.push(
      new Paragraph({
        text: 'НДС не облагается.',
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 },
      })
    )
  }

  elements.push(
    new Paragraph({
      text: 'Спецификация является неотъемлемой частью Договора.',
      spacing: { before: 200, after: 400 },
      alignment: AlignmentType.JUSTIFIED,
    })
  )

  return elements
}
