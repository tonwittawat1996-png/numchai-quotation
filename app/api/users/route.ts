import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUsers, updateUserRole } from "@/lib/users"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const users = await getUsers()
    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        employeeCode: u.employeeCode,
        role: u.role,
        label: u.name,
      }))
    )
  } catch (err: any) {
    console.error("GET /api/users error:", err.message)
    return NextResponse.json([])
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as any)?.role !== "admin") return NextResponse.json({ error: "เฉพาะ Admin เท่านั้น" }, { status: 403 })

    const body = await req.json()
    if (!body.id || !body.role) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 })
    if (!["admin", "staff"].includes(body.role)) return NextResponse.json({ error: "Role ไม่ถูกต้อง" }, { status: 400 })

    await updateUserRole(body.id, body.role)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาด" }, { status: 400 })
  }
}
