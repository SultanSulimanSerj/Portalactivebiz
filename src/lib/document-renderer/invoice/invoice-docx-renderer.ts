import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  Packer,
} from 'docx'
import type { InvoiceDocumentData } from '../fns-form-types'

function formatMoney(value: number): string {
  return value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export async function renderInvoiceDocx(data: InvoiceDocumentData): Promise<Buffer> {
  const rows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph('№')] }),
        new TableCell({ children: [new Paragraph('Наименование')] }),
        new TableCell({ children: [new Paragraph('Кол-во')] }),
        new TableCell({ children: [new Paragraph('Ед.')] }),
        new TableCell({ children: [new Paragraph('Сумма')] }),
      ],
    }),
    ...data.items.map(
      (item) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(String(item.lineNumber))] }),
            new TableCell({ children: [new Paragraph(item.name)] }),
            new TableCell({ children: [new Paragraph(String(item.quantity))] }),
            new TableCell({ children: [new Paragraph(item.unit)] }),
            new TableCell({
              children: [new Paragraph(formatMoney(item.totalWithVat))],
            }),
          ],
        })
    ),
  ]

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: `Счёт на оплату № ${data.documentNumber} от ${data.documentDate}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Поставщик: ${data.seller.legalName || data.seller.name}, ИНН ${data.seller.inn}`,
          }),
          new Paragraph({
            text: `Покупатель: ${data.buyer.legalName || data.buyer.name}, ИНН ${data.buyer.inn}`,
          }),
          new Paragraph({ text: `Проект: ${data.projectName}` }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
          new Paragraph({
            text: `Итого: ${formatMoney(data.totals.totalWithVat)} руб.`,
          }),
          ...(data.paymentPurpose
            ? [new Paragraph({ text: `Назначение платежа: ${data.paymentPurpose}` })]
            : []),
          ...(data.dueDate ? [new Paragraph({ text: `Оплатить до: ${data.dueDate}` })] : []),
        ],
      },
    ],
  })

  return Packer.toBuffer(doc)
}
