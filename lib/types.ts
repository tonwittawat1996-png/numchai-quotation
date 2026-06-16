export interface QuotationItem {
  description: string
  qty: number
  unit: string
  unitPrice: number
  total: number
  costPrice?: number   // ต้นทุนต่อหน่วย (จากคลังสินค้า)
  gpPercent?: number   // GP% = (unitPrice - costPrice) / unitPrice * 100
}

export type QuotationStatus = "draft" | "pending" | "approved" | "rejected" | "sent"

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
  status: QuotationStatus
  // ต้นทุน / กำไร (internal only)
  costAmount: number
  // Approval
  approvedBy: string
  approvedAt: string
  approvalNote: string
}
