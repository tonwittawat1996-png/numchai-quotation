import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUsers } from "@/lib/users"

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
