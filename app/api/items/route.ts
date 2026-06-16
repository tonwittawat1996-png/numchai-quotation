import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { appendRow, getRows, updateRow } from "@/lib/sheets"

export interface Item {
  id: string
  code: string
  name: string
  unit: string
  costPrice: number      // ราคาต้นทุน (เดิมชื่อ defaultPrice)
  category: string
  description: string
  isDefault: boolean     // ขึ้นอัตโนมัติในใบเสนอราคา
}

function rowToItem(r: any[]): Item {
  return {
    id: r[0] || "",
    code: r[1] || "",
    name: r[2] || "",
    unit: r[3] || "ชุด",
    costPrice: Number(r[4]) || 0,
    category: r[5] || "",
    description: r[6] || "",
    isDefault: r[7] === "yes",
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const rows = await getRows("Items")
    return NextResponse.json(rows.map(rowToItem))
  } catch (err: any) {
    console.error("GET /api/items:", err.message)
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    if (!body.name?.trim()) return NextResponse.json({ error: "กรุณาใส่ชื่อสินค้า" }, { status: 400 })

    const id = Date.now().toString()
    await appendRow("Items", [
      id,
      (body.code || "").trim(),
      body.name.trim(),
      (body.unit || "ชุด").trim(),
      Number(body.costPrice) || 0,
      (body.category || "").trim(),
      (body.description || "").trim(),
      body.isDefault ? "yes" : "no",
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

    const rows = await getRows("Items")
    const idx = rows.findIndex(r => r[0] === body.id)
    if (idx === -1) return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 })

    await updateRow("Items", idx, [
      body.id,
      (body.code || "").trim(),
      body.name.trim(),
      (body.unit || "ชุด").trim(),
      Number(body.costPrice) || 0,
      (body.category || "").trim(),
      (body.description || "").trim(),
      body.isDefault ? "yes" : "no",
    ])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาด" }, { status: 400 })
  }
}
