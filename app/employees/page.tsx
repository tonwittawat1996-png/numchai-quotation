"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface Employee {
  id: string
  name: string
  employeeCode: string
  role: string
  label: string
}

export default function EmployeesPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === "admin"
  const [list, setList] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // สำหรับแก้ไขสิทธิ์
  const [editingRole, setEditingRole] = useState<Employee | null>(null)
  const [newRole, setNewRole] = useState<"admin" | "staff">("staff")
  const [savingRole, setSavingRole] = useState(false)

  const [form, setForm] = useState({
    name: "",
    employeeCode: "",
    username: "",
    password: "",
    role: "staff" as "admin" | "staff",
  })

  async function loadList() {
    setLoading(true)
    try {
      const res = await fetch("/api/users")
      const text = await res.text()
      if (!text) { setList([]); setLoading(false); return }
      const data = JSON.parse(text)
      setList(Array.isArray(data) ? data : [])
    } catch { setList([]) }
    setLoading(false)
  }

  useEffect(() => { loadList() }, [])

  function generateNextCode(currentList: Employee[]): string {
    const nums = currentList
      .map(e => e.employeeCode)
      .filter(c => /^EMP-\d+$/.test(c))
      .map(c => parseInt(c.replace("EMP-", ""), 10))
    if (nums.length === 0) return "EMP-001"
    return `EMP-${String(Math.max(...nums) + 1).padStart(3, "0")}`
  }

  function openForm() {
    setForm({ name: "", employeeCode: generateNextCode(list), username: "", password: "", role: "staff" })
    setError("")
    setShowForm(true)
  }

  function openEditRole(emp: Employee) {
    setEditingRole(emp)
    setNewRole(emp.role === "admin" ? "admin" : "staff")
    setError("")
  }

  async function handleSaveRole(e: React.FormEvent) {
    e.preventDefault()
    if (!editingRole) return
    setSavingRole(true)
    setError("")
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingRole.id, role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "เกิดข้อผิดพลาด"); setSavingRole(false); return }
      setSuccess(`อัปเดตสิทธิ์ ${editingRole.name} เป็น ${newRole === "admin" ? "ผู้บริหาร" : "พนักงาน"} สำเร็จ!`)
      setEditingRole(null)
      loadList()
      setTimeout(() => setSuccess(""), 4000)
    } catch { setError("เกิดข้อผิดพลาด") }
    setSavingRole(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSaving(true)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          password: form.password,
          employeeCode: form.employeeCode,
          role: form.role,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setSaving(false); return }
      setSuccess(`เพิ่ม ${data.name} (${form.employeeCode}) สำเร็จ!`)
      setShowForm(false)
      loadList()
      setTimeout(() => setSuccess(""), 4000)
    } catch { setError("เกิดข้อผิดพลาด") }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/quotations/new" className="text-sm text-gray-500 hover:text-gray-700">← กลับ</Link>
          <h1 className="text-2xl font-bold text-gray-900">จัดการพนักงาน</h1>
          <span className="text-sm text-gray-400">({list.length} คน)</span>
        </div>
        <button onClick={openForm}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
          + เพิ่มพนักงาน
        </button>
      </div>

      {success && (
        <div className="p-3 bg-green-50 border border-green-100 text-green-700 text-sm rounded-lg">{success}</div>
      )}

      {/* Modal แก้ไขสิทธิ์ */}
      {editingRole && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">แก้ไขสิทธิ์การใช้งาน</h2>
              <button onClick={() => setEditingRole(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleSaveRole} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">{error}</div>
              )}
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <div className="text-xs text-gray-400 mb-0.5">พนักงาน</div>
                <div className="font-semibold text-gray-900">{editingRole.name}</div>
                <div className="text-xs text-gray-400 font-mono">{editingRole.employeeCode}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">เลือกสิทธิ์ใหม่</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${newRole === "staff" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="newRole" value="staff" checked={newRole === "staff"}
                      onChange={() => setNewRole("staff")} className="sr-only" />
                    <span className="text-2xl">👷</span>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-800">พนักงาน</div>
                      <div className="text-xs text-gray-400">Staff</div>
                    </div>
                  </label>
                  <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${newRole === "admin" ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="newRole" value="admin" checked={newRole === "admin"}
                      onChange={() => setNewRole("admin")} className="sr-only" />
                    <span className="text-2xl">👔</span>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-800">ผู้บริหาร</div>
                      <div className="text-xs text-gray-400">Admin</div>
                    </div>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditingRole(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                  ยกเลิก
                </button>
                <button type="submit" disabled={savingRole}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                  {savingRole ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal เพิ่มพนักงาน */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">เพิ่มพนักงานใหม่</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">{error}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รหัสพนักงาน <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.employeeCode}
                    onChange={e => setForm({ ...form, employeeCode: e.target.value })}
                    placeholder="เช่น EMP-001"
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">auto-generate แก้ไขได้</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อ-นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="เช่น สมชาย ใจดี"
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สิทธิ์การใช้งาน</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="role" value="staff" checked={form.role === "staff"}
                      onChange={() => setForm({ ...form, role: "staff" })} className="text-red-600" />
                    <span className="text-sm text-gray-700">👷 พนักงาน (Staff)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="role" value="admin" checked={form.role === "admin"}
                      onChange={() => setForm({ ...form, role: "admin" })} className="text-red-600" />
                    <span className="text-sm text-gray-700">👔 ผู้บริหาร (Admin)</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อผู้ใช้งาน (สำหรับ Login) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="เช่น Big, Ton, Arm"
                  required
                  autoComplete="off"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-400 mt-0.5">ชื่อเล่นก็ได้ ใช้สำหรับ Login</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสผ่าน <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  required
                  minLength={6}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                  ยกเลิก
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* รายชื่อพนักงาน */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">กำลังโหลด...</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-sm mb-3">ยังไม่มีพนักงานในระบบ</div>
            <button onClick={openForm} className="text-sm text-red-600 font-medium hover:text-red-700">
              + เพิ่มพนักงานคนแรก
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">รหัส</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">ชื่อ-นามสกุล</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">สิทธิ์</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {list.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm font-medium text-red-600">
                    {emp.employeeCode || <span className="text-gray-300 font-normal">-</span>}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${emp.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                      {emp.role === "admin" ? "👔 ผู้บริหาร" : "👷 พนักงาน"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isAdmin && (
                      <button
                        onClick={() => openEditRole(emp)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        แก้ไขสิทธิ์
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
