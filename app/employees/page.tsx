"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

interface Employee {
  id: string
  name: string
  employeeCode: string
  label: string
}

export default function EmployeesPage() {
  const [list, setList] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [form, setForm] = useState({
    name: "",
    employeeCode: "",
    username: "",
    password: "",
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

  // Auto-generate รหัสพนักงาน EMP-001, EMP-002, ...
  function generateNextCode(currentList: Employee[]): string {
    const nums = currentList
      .map(e => e.employeeCode)
      .filter(c => /^EMP-\d+$/.test(c))
      .map(c => parseInt(c.replace("EMP-", ""), 10))
    if (nums.length === 0) return "EMP-001"
    return `EMP-${String(Math.max(...nums) + 1).padStart(3, "0")}`
  }

  function openForm() {
    setForm({ name: "", employeeCode: generateNextCode(list), username: "", password: "" })
    setError("")
    setShowForm(true)
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

      {/* Form Modal */}
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

              {/* Preview */}
              {(form.employeeCode || form.name) && (
                <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-sm">
                  <span className="text-gray-500 text-xs">แสดงในใบเสนอราคา: </span>
                  <span className="font-medium text-gray-800">
                    {form.employeeCode && form.name
                      ? `${form.employeeCode} - ${form.name}`
                      : form.name || form.employeeCode}
                  </span>
                </div>
              )}

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
                <th className="text-left px-4 py-3 font-semibold text-gray-600">แสดงในใบเสนอราคา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {list.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm font-medium text-red-600">
                    {emp.employeeCode || <span className="text-gray-300 font-normal">-</span>}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
                  <td className="px-4 py-3 text-gray-500">{emp.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
