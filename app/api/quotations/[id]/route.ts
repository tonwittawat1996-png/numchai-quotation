import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getRows, updateRow, appendRow, deleteRows } from "@/lib/sheets"

function rowToQuotation(row: any[], id: string, items: any[]) {
  return {
    id,
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
    customerBranch: row[17] || "",
    costAmount: Number(row[18] || 0),
    approvedBy: row[20] || "",
    approvedAt: row[21] || "",
    approvalNote: row[22] || "",
    items,
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await getRows("Quotations")
  const row = rows.find((r) => r[7] === id)
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const itemRows = await getRows("QuotationItems")
  const items = itemRows.filter((r) => r[0] === id).map((r) => ({
    description: r[1], qty: Number(r[2]), unit: r[3], unitPrice: Number(r[4]), total: Number(r[5]),
  }))

  return NextResponse.json(rowToQuotation(row, id, items))
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const rows = await getRows("Quotations")
    const rowIdx = rows.findIndex((r) => r[7] === id)
    if (rowIdx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const existing = rows[rowIdx]
    const role = (session.user as any)?.role

    // Approve/Reject action (admin only)
    if (body.action === "approve" || body.action === "reject") {
      if (role !== "admin") return NextResponse.json({ error: "ไม่มีสิทธิ์อนุมัติ" }, { status: 403 })
      const newStatus = body.action === "approve" ? "approved" : "rejected"
      const updatedRow = [...existing]
      updatedRow[5] = newStatus
      updatedRow[20] = session.user?.name || ""
      updatedRow[21] = new Date().toISOString()
      updatedRow[22] = body.approvalNote || ""
      await updateRow("Quotations", rowIdx, updatedRow)
      return NextResponse.json({ success: true })
    }

    // ไม่อนุมัติให้แก้ใบที่ approved/sent ถ้าไม่ใช่ admin
    if (role !== "admin" && (existing[5] === "approved" || existing[5] === "sent")) {
      return NextResponse.json({ error: "ไม่สามารถแก้ไขใบที่อนุมัติแล้วได้" }, { status: 403 })
    }

    await updateRow("Quotations", rowIdx, [
      existing[0],
      body.date,
      body.customerName,
      body.customerPhone,
      body.total,
      body.status || existing[5],
      body.createdBy || existing[6],
      id,
      body.customerAddress || "",
      body.customerTaxId || "",
      body.discount || 0,
      body.vat || 0,
      body.subtotal || 0,
      body.vatEnabled ? "yes" : "no",
      body.paymentTerms || "",
      body.notes || "",
      existing[16] || session.user?.email || "",
      body.customerBranch || "",
      body.costAmount || 0,
      "",
      existing[20] || "",
      existing[21] || "",
      existing[22] || "",
    ])

    const itemRows = await getRows("QuotationItems")
    const oldIndices = itemRows.map((r, i) => (r[0] === id ? i : -1)).filter((i) => i !== -1)
    await deleteRows("QuotationItems", oldIndices)
    for (const item of body.items) {
      await appendRow("QuotationItems", [id, item.description, item.qty, item.unit, item.unitPrice, item.total])
    }

    return NextResponse.json({ success: true, id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาด" }, { status: 400 })
  }
}
