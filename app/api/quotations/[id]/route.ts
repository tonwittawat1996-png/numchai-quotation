import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getRows, updateRow, appendRow, deleteRows } from "@/lib/sheets"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await getRows("Quotations")
  const row = rows.find((r) => r[7] === id)
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const itemRows = await getRows("QuotationItems")
  const items = itemRows
    .filter((r) => r[0] === id)
    .map((r) => ({
      description: r[1],
      qty: Number(r[2]),
      unit: r[3],
      unitPrice: Number(r[4]),
      total: Number(r[5]),
    }))

  return NextResponse.json({
    id: row[7],
    quotationNo: row[0],
    date: row[1],
    customerName: row[2],
    customerPhone: row[3],
    total: Number(row[4]),
    status: row[5],
    createdBy: row[6],
    customerAddress: row[8],
    customerTaxId: row[9],
    discount: Number(row[10]),
    vat: Number(row[11]),
    subtotal: Number(row[12]),
    vatEnabled: row[13] === "yes",
    paymentTerms: row[14],
    notes: row[15],
    createdByEmail: row[16],
    items,
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()

    // หา row index ของ Quotations
    const rows = await getRows("Quotations")
    const rowIdx = rows.findIndex((r) => r[7] === id)
    if (rowIdx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const existingRow = rows[rowIdx]

    // อัปเดต Quotations row
    await updateRow("Quotations", rowIdx, [
      existingRow[0], // quotationNo ไม่เปลี่ยน
      body.date,
      body.customerName,
      body.customerPhone,
      body.total,
      body.status || existingRow[5],
      body.createdBy || existingRow[6],
      id,
      body.customerAddress || "",
      body.customerTaxId || "",
      body.discount || 0,
      body.vat || 0,
      body.subtotal || 0,
      body.vatEnabled ? "yes" : "no",
      body.paymentTerms || "",
      body.notes || "",
      existingRow[16] || session.user?.email || "",
    ])

    // ลบ QuotationItems เก่า แล้วเพิ่มใหม่
    const itemRows = await getRows("QuotationItems")
    const oldIndices = itemRows
      .map((r, i) => (r[0] === id ? i : -1))
      .filter((i) => i !== -1)

    await deleteRows("QuotationItems", oldIndices)

    // เพิ่ม items ใหม่
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

    return NextResponse.json({ success: true, id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาด" }, { status: 400 })
  }
}
