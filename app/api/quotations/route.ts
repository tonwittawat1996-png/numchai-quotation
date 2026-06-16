import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { appendRow, getRows, getNextQuotationNumber } from "@/lib/sheets"
import { Quotation } from "@/lib/types"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await getRows("Quotations")
  const quotations = rows.map((r) => ({
    quotationNo: r[0],
    date: r[1],
    customerName: r[2],
    customerPhone: r[3],
    total: r[4],
    status: r[5],
    createdBy: r[6],
    id: r[7],
    approvedBy: r[20] || "",
    approvalNote: r[22] || "",
  }))
  return NextResponse.json(quotations)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body: any = await req.json()
  const quotationNo = await getNextQuotationNumber()
  const id = Date.now().toString()

  await appendRow("Quotations", [
    quotationNo,           // 0
    body.date,             // 1
    body.customerName,     // 2
    body.customerPhone,    // 3
    body.total,            // 4
    body.status || "draft",// 5
    body.createdBy || session.user?.name || "", // 6
    id,                    // 7
    body.customerAddress,  // 8
    body.customerTaxId,    // 9
    body.discount,         // 10
    body.vat,              // 11
    body.subtotal,         // 12
    body.vatEnabled ? "yes" : "no", // 13
    body.paymentTerms,     // 14
    body.notes,            // 15
    session.user?.email || "", // 16
    body.customerBranch || "", // 17
    body.costAmount || 0,  // 18
    "",                    // 19 (reserved)
    "",                    // 20 approvedBy
    "",                    // 21 approvedAt
    "",                    // 22 approvalNote
  ])

  for (const item of body.items) {
    await appendRow("QuotationItems", [id, item.description, item.qty, item.unit, item.unitPrice, item.total])
  }

  return NextResponse.json({ quotationNo, id })
}
