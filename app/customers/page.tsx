"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

interface Customer {
  id: string
  code: string
  name: string
  customerType: string
  branch: string
  address: string
  phone: string
  taxId: string
  contactPerson: string
  email: string
  notes: string
  createdAt: string
}

const CUSTOMER_TYPES = ["บริษัท จำกัด", "บริษัท มหาชน จำกัด", "ห้างหุ้นส่วนจำกัด", "ห้างหุ้นส่วนสามัญ", "บุคคลธรรมดา", "ร้านค้า", "หน่วยงานราชการ", "อื่นๆ"]

const EMPTY: Customer = {
  id: "", code: "", name: "", customerType: "บริษัท จำกัด",
  branch: "สำนักงานใหญ่", address: "", phone: "", taxId: "",
  contactPerson: "", email: "", notes: "", createdAt: ""
}

export default function CustomersPage() {
  const [list, setList] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [customBranch, setCustomBranch] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function loadList() {
    setLoading(true)
    try {
      const res = await fetch("/api/customers")
      const text = await res.text()
      const data = text ? JSON.parse(text) : []
      setList(Array.isArray(data) ? data : [])
    } catch { setList([]) }
    setLoading(false)
  }

  useEffect(() => { loadList() }, [])

  function generateNextCode() {
    const nums = list.map(c => c.code).filter(c => /^CUS-\d+$/.test(c)).map(c => parseInt(c.replace("CUS-", ""), 10))
    return nums.length === 0 ? "CUS-001" : `CUS-${String(Math.max(...nums) + 1).padStart(3, "0")}`
  }

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY, code: generateNextCode() })
    setCustomBranch(false)
    setError("")
    setShowForm(true)
  }

  function openEdit(c: Customer) {
    setEditing(c)
    setForm({ ...c })
    setCustomBranch(c.branch !== "สำนักงานใหญ่")
    setError("")
    setShowForm(true)
  }

  function handleBranchChange(val: string) {
    if (val === "custom") {
      setCustomBranch(true)
      setForm(f => ({ ...f, branch: "" }))
    } else {
      setCustomBranch(false)
      setForm(f => ({ ...f, branch: val }))
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSaving(true)
    try {
      const method = editing ? "PUT" : "POST"
      const body = editing ? { ...form, id: editing.id } : form
      const res = await fetch("/api/customers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setSaving(false); return }
      setSuccess(editing ? "แก้ไขข้อมูลลูกค้าสำเร็จ!" : "เพิ่มลูกค้าสำเร็จ!")
      setShowForm(false)
      loadList()
      setTimeout(() => setSuccess(""), 3000)
    } catch { setError("เกิดข้อผิดพลาด") }
    setSaving(false)
  }

  const filtered = list.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.contactPerson.toLowerCase().includes(search.toLowerCase())
  )

  const typeColors: Record<string, string> = {
    "บริษัท จำกัด": "bg-blue-50 text-blue-700",
    "บริษัท มหาชน จำกัด": "bg-purple-50 text-purple-700",
    "ห้างหุ้นส่วนจำกัด": "bg-orange-50 text-orange-700",
    "ห้างหุ้นส่วนสามัญ": "bg-yellow-50 text-yellow-700",
    "บุคคลธรรมดา": "bg-green-50 text-green-700",
    "ร้านค้า": "bg-pink-50 text-pink-700",
    "หน่วยงานราชการ": "bg-gray-100 text-gray-700",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/quotations" className="text-sm text-gray-500 hover:text-gray-700">← กลับ</Link>
          <h1 className="text-2xl font-bold text-gray-900">ฐานข้อมูลลูกค้า</h1>
          <span className="text-sm text-gray-400">({list.length} ราย)</span>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
          + เพิ่มลูกค้า
        </button>
      </div>

      {success && <div className="p-3 bg-green-50 border border-green-100 text-green-700 text-sm rounded-lg">{success}</div>}

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="ค้นหาชื่อ รหัส เบอร์โทร หรือผู้ติดต่อ..."
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white shadow-sm"
      />

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">{editing ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มลูกค้าใหม่"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
              {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">{error}</div>}

              {/* รหัส + ประเภท */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รหัสลูกค้า</label>
                  <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
                    placeholder="เช่น CUS-001"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทลูกค้า</label>
                  <select value={form.customerType} onChange={e => setForm({ ...form, customerType: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                    {CUSTOMER_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* ชื่อ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อลูกค้า / บริษัท <span className="text-red-500">*</span>
                </label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="เช่น นำชัย เทคโนโลยี"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                <p className="text-xs text-gray-400 mt-1">ไม่ต้องใส่คำนำหน้า เช่น บริษัท / ห้างหุ้นส่วน (เลือกจาก "ประเภท" แล้ว)</p>
              </div>

              {/* สาขา */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สาขา</label>
                <div className="flex gap-2">
                  <select
                    value={customBranch ? "custom" : form.branch}
                    onChange={e => handleBranchChange(e.target.value)}
                    className="w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="สำนักงานใหญ่">สำนักงานใหญ่</option>
                    <option value="custom">สาขาที่... (ระบุ)</option>
                  </select>
                  {customBranch && (
                    <input
                      value={form.branch}
                      onChange={e => setForm({ ...form, branch: e.target.value })}
                      placeholder="เช่น 00001 หรือ สาขากรุงเทพ"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  )}
                </div>
              </div>

              {/* ที่อยู่ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
                <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  rows={2} placeholder="ที่อยู่จัดส่ง / ออกใบกำกับภาษี"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
              </div>

              {/* เบอร์ + เลขภาษี */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="0xx-xxx-xxxx"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เลขผู้เสียภาษี</label>
                  <input value={form.taxId} onChange={e => setForm({ ...form, taxId: e.target.value })}
                    placeholder="13 หลัก"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              {/* ผู้ติดต่อ + อีเมล */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ผู้ติดต่อ</label>
                  <input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                    placeholder="ชื่อผู้ติดต่อหลัก"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">อีเมลลูกค้า</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="contact@company.com"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              {/* หมายเหตุ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ / โน้ต</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={2} placeholder="บันทึกข้อมูลเพิ่มเติม..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">ยกเลิก</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-sm mb-3">{list.length === 0 ? "ยังไม่มีข้อมูลลูกค้า" : "ไม่พบลูกค้าที่ค้นหา"}</div>
            {list.length === 0 && <button onClick={openCreate} className="text-sm text-red-600 font-medium hover:text-red-700">+ เพิ่มลูกค้าคนแรก</button>}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">รหัส</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">ชื่อลูกค้า</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">ประเภท / สาขา</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">ผู้ติดต่อ</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">เบอร์โทร</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.code || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{c.name}</div>
                    {c.address && <div className="text-xs text-gray-400 truncate max-w-xs">{c.address}</div>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[c.customerType] || "bg-gray-100 text-gray-600"}`}>
                      {c.customerType}
                    </span>
                    <div className="text-xs text-gray-400 mt-0.5">{c.branch}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.contactPerson || "-"}</td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{c.phone || "-"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(c)} className="text-xs text-red-600 hover:text-red-700 font-medium">แก้ไข</button>
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
