"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

interface Item {
  id: string
  code: string
  name: string
  unit: string
  costPrice: number
  category: string
  description: string
  isDefault: boolean
}

const EMPTY_FORM = { id: "", code: "", name: "", unit: "ชุด", costPrice: 0, category: "", description: "", isDefault: false }

export default function ItemsPage() {
  const [list, setList] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function loadList() {
    setLoading(true)
    try {
      const res = await fetch("/api/items")
      const text = await res.text()
      const data = text ? JSON.parse(text) : []
      setList(Array.isArray(data) ? data : [])
    } catch { setList([]) }
    setLoading(false)
  }

  useEffect(() => { loadList() }, [])

  function generateNextCode(): string {
    if (list.length === 0) return "ITEM-001"
    const nums = list
      .map(i => i.code)
      .filter(c => /^ITEM-\d+$/.test(c))
      .map(c => parseInt(c.replace("ITEM-", ""), 10))
    if (nums.length === 0) return `ITEM-${String(list.length + 1).padStart(3, "0")}`
    return `ITEM-${String(Math.max(...nums) + 1).padStart(3, "0")}`
  }

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, code: generateNextCode() })
    setError("")
    setShowForm(true)
  }

  function openEdit(item: Item) {
    setEditing(item)
    setForm({ ...item })
    setError("")
    setShowForm(true)
  }

  function closeForm() { setShowForm(false); setEditing(null); setError("") }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSaving(true)
    try {
      const method = editing ? "PUT" : "POST"
      const body = editing ? { ...form, id: editing.id } : form
      const res = await fetch("/api/items", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setSaving(false); return }
      setSuccess(editing ? "แก้ไขสำเร็จ!" : "เพิ่มสินค้าสำเร็จ!")
      closeForm()
      loadList()
      setTimeout(() => setSuccess(""), 3000)
    } catch { setError("เกิดข้อผิดพลาด") }
    setSaving(false)
  }

  // Toggle isDefault โดยไม่ต้องเปิดฟอร์ม
  async function toggleDefault(item: Item) {
    try {
      await fetch("/api/items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, isDefault: !item.isDefault }),
      })
      loadList()
    } catch {}
  }

  const filtered = list.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.code.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  )

  const defaultCount = list.filter(i => i.isDefault).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/quotations" className="text-sm text-gray-500 hover:text-gray-700">← กลับ</Link>
          <h1 className="text-2xl font-bold text-gray-900">คลังสินค้า</h1>
          <span className="text-sm text-gray-400">({list.length} รายการ)</span>
          {defaultCount > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              ⭐ {defaultCount} รายการ default
            </span>
          )}
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
          + เพิ่มสินค้า
        </button>
      </div>

      {success && (
        <div className="p-3 bg-green-50 border border-green-100 text-green-700 text-sm rounded-lg">{success}</div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        💡 รายการที่ติด ⭐ <strong>Default</strong> จะขึ้นอัตโนมัติทุกครั้งที่สร้างใบเสนอราคา — กดสวิตช์ในตารางเพื่อเปิด/ปิดได้เลย
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="ค้นหาชื่อสินค้า รหัส หรือหมวดหมู่..."
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white shadow-sm"
      />

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                {editing ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">{error}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รหัสสินค้า</label>
                  <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
                    placeholder="เช่น ELV-001"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                  <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    placeholder="เช่น ลิฟต์โดยสาร"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อสินค้า / บริการ <span className="text-red-500">*</span>
                </label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="เช่น ลิฟต์โดยสาร 4 คน ความเร็ว 1 m/s" required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="รายละเอียดเพิ่มเติม..." rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หน่วย</label>
                  <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                    placeholder="ชุด"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคาต้นทุน (บาท)</label>
                  <input type="number" min={0} value={form.costPrice}
                    onChange={e => setForm({ ...form, costPrice: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              {/* Default toggle */}
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-gray-800">⭐ แสดงใน Default</div>
                  <div className="text-xs text-gray-500">ขึ้นอัตโนมัติทุกครั้งที่สร้างใบเสนอราคา</div>
                </div>
                <button type="button"
                  onClick={() => setForm({ ...form, isDefault: !form.isDefault })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isDefault ? "bg-green-500" : "bg-gray-200"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isDefault ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm}
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

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-sm mb-3">
              {list.length === 0 ? "ยังไม่มีสินค้าในคลัง" : "ไม่พบสินค้าที่ค้นหา"}
            </div>
            {list.length === 0 && (
              <button onClick={openCreate} className="text-sm text-red-600 font-medium hover:text-red-700">
                + เพิ่มสินค้าชิ้นแรก
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-center px-3 py-3 font-semibold text-gray-600 w-16">Default</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">รหัส</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">ชื่อสินค้า</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">หมวดหมู่</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">หน่วย</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">ราคาต้นทุน</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(item => (
                <tr key={item.id} className={`hover:bg-gray-50 ${item.isDefault ? "bg-green-50/40" : ""}`}>
                  <td className="px-3 py-3 text-center">
                    <button onClick={() => toggleDefault(item)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${item.isDefault ? "bg-green-500" : "bg-gray-200"}`}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${item.isDefault ? "translate-x-4" : "translate-x-1"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.code || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {item.name}
                      {item.isDefault && <span className="ml-1 text-yellow-500 text-xs">⭐</span>}
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-400 truncate max-w-xs">{item.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{item.category || "-"}</td>
                  <td className="px-4 py-3 text-center text-gray-500 hidden sm:table-cell">{item.unit}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                    {Number(item.costPrice).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(item)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium">แก้ไข</button>
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
