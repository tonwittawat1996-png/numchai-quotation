import { appendRow, getRows, updateRow } from "./sheets"
import bcrypt from "bcryptjs"

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  employeeCode: string
  createdAt: string
  role: "admin" | "staff"
}

export async function getUsers(): Promise<User[]> {
  const rows = await getRows("Users")
  return rows.map((r) => ({
    id: r[0],
    name: r[1],
    email: r[2],
    passwordHash: r[3],
    employeeCode: r[4] || "",
    createdAt: r[5] || "",
    role: (r[6] === "admin" ? "admin" : "staff") as "admin" | "staff",
  }))
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const users = await getUsers()
  return users.find((u) => u.email.toLowerCase() === username.toLowerCase()) || null
}

export const findUserByEmail = findUserByUsername

export async function createUser(
  name: string,
  username: string,
  password: string,
  employeeCode: string = "",
  role: "admin" | "staff" = "staff"
): Promise<User> {
  const existing = await findUserByUsername(username)
  if (existing) throw new Error("ชื่อผู้ใช้งานนี้มีอยู่แล้ว")

  const passwordHash = await bcrypt.hash(password, 10)
  const id = Date.now().toString()
  const createdAt = new Date().toISOString()

  await appendRow("Users", [id, name, username, passwordHash, employeeCode, createdAt, role])

  return { id, name, email: username, passwordHash, employeeCode, createdAt, role }
}

export async function updateUserRole(id: string, role: "admin" | "staff"): Promise<void> {
  const rows = await getRows("Users")
  const idx = rows.findIndex(r => r[0] === id)
  if (idx === -1) throw new Error("ไม่พบผู้ใช้งาน")
  const r = rows[idx]
  await updateRow("Users", idx, [r[0], r[1], r[2], r[3], r[4] || "", r[5] || "", role])
}

export async function verifyUser(username: string, password: string): Promise<User | null> {
  const user = await findUserByUsername(username)
  if (!user) return null
  const ok = await bcrypt.compare(password, user.passwordHash)
  return ok ? user : null
}
