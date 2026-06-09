import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { appendRow, getRows, updateRow } from "@/lib/sheets"

export interface Customer {
  id: string
  code: string
  name: string
  customerType: string   // บริษัท / หจก. / บุคคล / ร้านค้า
  branch: string         // สำนักงานใหญ่ / สาขาที่ XXX
  address: string
  phone: string
  taxId: string
  contactPerson: string
  email: string
  notes: string
  createdAt: string
}

function rowToCustomer(r: any[]): Customer {
  return {
    id: r[0] || "",
    code: r[1] || "",
    name: r[2] || "",
    customerType: r[3] || "บริษัท จำกัด",
    branch: r[4] || "สำนักงานใหญ่",
    address: r[5] || "",
    phone: r[6] || "",
    taxId: r[7] || "",
    contactPerson: r[8] || "",
    email: r[9] || "",
    notes: r[10] || "",
    createdAt: r[11] || "",
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const rows = await getRows("Customers")
    return NextResponse.json(rows.map(rowToCustomer))
  } catch (err: any) {
    console.error("GET /api/customers:", err.message)
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    if (!body.name?.trim()) return NextResponse.json({ error: "กรุณาใส่ชื่อลูกค้า" }, { status: 400 })

    const id = Date.now().toString()
    const createdAt = new Date().toISOString()
    await appendRow("Customers", [
      id,
      (body.code || "").trim(),
      body.name.trim(),
      body.customerType || "บริษัท จำกัด",
      body.branch || "สำนักงานใหญ่",
      (body.address || "").trim(),
      (body.phone || "").trim(),
      (body.taxId || "").trim(),
      (body.contactPerson || "").trim(),
      (body.email || "").trim(),
      (body.notes || "").trim(),
      createdAt,
    ])
    return NextResponse.json({ success: true, id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาด" }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: "ไม่พบ ID" }, { status: 400 })

    const rows = await getRows("Customers")
    const idx = rows.findIndex(r => r[0] === body.id)
    if (idx === -1) return NextResponse.json({ error: "ไม่พบลูกค้า" }, { status: 404 })

    await updateRow("Customers", idx, [
      body.id,
      (body.code || "").trim(),
      body.name.trim(),
      body.customerType || "บริษัท จำกัด",
      body.branch || "สำนักงานใหญ่",
      (body.address || "").trim(),
      (body.phone || "").trim(),
      (body.taxId || "").trim(),
      (body.contactPerson || "").trim(),
      (body.email || "").trim(),
      (body.notes || "").trim(),
      rows[idx][11] || "",
    ])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาด" }, { status: 400 })
  }
}
