export interface QuotationItem {
  description: string
  qty: number
  unit: string
  unitPrice: number
  total: number
}

export interface Quotation {
  id: string
  quotationNo: string
  date: string
  customerName: string
  customerAddress: string
  customerPhone: string
  customerTaxId: string
  customerBranch: string
  items: QuotationItem[]
  subtotal: number
  discount: number
  vat: number
  total: number
  vatEnabled: boolean
  paymentTerms: string
  notes: string
  createdBy: string
  createdByEmail: string
  status: "draft" | "sent" | "won" | "lost"
}
