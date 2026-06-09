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
  }))
  return NextResponse.json(quotations)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body: Omit<Quotation, "quotationNo" | "id"> = await req.json()
  const quotationNo = await getNextQuotationNumber()
  const id = Date.now().toString()

  // บันทึก header ใน Quotations sheet
  await appendRow("Quotations", [
    quotationNo,
    body.date,
    body.customerName,
    body.customerPhone,
    body.total,
    body.status || "draft",
    (body as any).createdBy || session.user?.name || "",
    id,
    body.customerAddress,
    body.customerTaxId,
    body.discount,
    body.vat,
    body.subtotal,
    body.vatEnabled ? "yes" : "no",
    body.paymentTerms,
    body.notes,
    session.user?.email || "",
  ])

  // บันทึก items ใน QuotationItems sheet
  for (const item of body.items) {
    await appendRow("QuotationItems", [
      id,
      item.description,
      item.qty,
      item.unit,
      item.unitPrice,
      item.total,
    ])
  }

  return NextResponse.json({ quotationNo, id })
}
