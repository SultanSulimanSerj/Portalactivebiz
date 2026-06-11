import { Packer } from 'docx'
import {
  generateContractDocument,
  type ContractData,
} from '@/lib/document-generator'
import {
  generateCommercialOfferDocument,
  type CommercialOfferData,
} from '@/lib/commercial-offer-generator'
import type { DocumentRenderer } from './types'

export async function renderContractDocx(data: ContractData): Promise<Buffer> {
  const doc = generateContractDocument(data)
  return Packer.toBuffer(doc)
}

export async function renderCommercialOfferDocx(data: CommercialOfferData): Promise<Buffer> {
  const doc = generateCommercialOfferDocument(data)
  return Packer.toBuffer(doc)
}

export const contractDocxRenderer: DocumentRenderer = {
  kind: 'docx',
  render: (input) => renderContractDocx(input as ContractData),
}

export const commercialOfferDocxRenderer: DocumentRenderer = {
  kind: 'docx',
  render: (input) => renderCommercialOfferDocx(input as CommercialOfferData),
}
