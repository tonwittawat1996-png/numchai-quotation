import { appendRow, getRows } from "./sheets"
import bcrypt from "bcryptjs"

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  employeeCode: string
  createdAt: string
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
  }))
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const users = await getUsers()
  // ค้นหาจาก email column (ใช้เก็บ username หรือ email ก็ได้)
  return users.find((u) => u.email.toLowerCase() === username.toLowerCase()) || null
}

// backward compat
export const findUserByEmail = findUserByUsername

export async function createUser(
  name: string,
  username: string,
  password: string,
  employeeCode: string = ""
): Promise<User> {
  const existing = await findUserByUsername(username)
  if (existing) throw new Error("ชื่อผู้ใช้งานนี้มีอยู่แล้ว")

  const passwordHash = await bcrypt.hash(password, 10)
  const id = Date.now().toString()
  const createdAt = new Date().toISOString()

  // เก็บ username ใน email column (ใช้เป็น login identifier)
  await appendRow("Users", [id, name, username, passwordHash, employeeCode, createdAt])

  return { id, name, email: username, passwordHash, employeeCode, createdAt }
}

export async function verifyUser(username: string, password: string): Promise<User | null> {
  const user = await findUserByUsername(username)
  if (!user) return null
  const ok = await bcrypt.compare(password, user.passwordHash)
  return ok ? user : null
}
