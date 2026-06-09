import { NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/users"

export async function POST(req: NextRequest) {
  try {
    const { name, username, password, employeeCode } = await req.json()

    if (!name?.trim()) return NextResponse.json({ error: "กรุณาใส่ชื่อ-นามสกุล" }, { status: 400 })
    if (!username?.trim()) return NextResponse.json({ error: "กรุณาใส่ชื่อผู้ใช้งาน" }, { status: 400 })
    if (!password || password.length < 4)
      return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร" }, { status: 400 })

    const user = await createUser(name.trim(), username.trim(), password, (employeeCode || "").trim())
    return NextResponse.json({ success: true, name: user.name })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาด" }, { status: 400 })
  }
}
