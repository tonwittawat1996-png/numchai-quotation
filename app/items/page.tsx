"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

interface Item {
  id: string
  code: string
  name: string
  unit: string
  defaultPrice: number
  category: string
  description: string
}

const EMPTY_FORM = { id: "", code: "", name: "", unit: "ชุด", defaultPrice: 0, category: "", description: "" }

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
    const next = Math.max(...nums) + 1
    return `ITEM-${String(next).padStart(3, "0")}`
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

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setError("")
  }

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

  const filtered = list.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.code.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/quotations" className="text-sm text-gray-500 hover:text-gray-700">← กลับ</Link>
          <h1 className="text-2xl font-bold text-gray-900">คลังสินค้า</h1>
          <span className="text-sm text-gray-400">({list.length} รายการ)</span>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
          + เพิ่มสินค้า
        </button>
      </div>

      {success && (
        <div className="p-3 bg-green-50 border border-green-100 text-green-700 text-sm rounded-lg">{success}</div>
      )}

      {/* Search */}
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
                  <input
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                    placeholder="เช่น ELV-001"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                  <input
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    placeholder="เช่น ลิฟต์โดยสาร"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อสินค้า / บริการ <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="เช่น ลิฟต์โดยสาร 4 คน ความเร็ว 1 m/s"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หน่วย</label>
                  <input
                    value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                    placeholder="ชุด"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคา Default (บาท)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.defaultPrice}
                    onChange={e => setForm({ ...form, defaultPrice: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
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
                <th className="text-left px-4 py-3 font-semibold text-gray-600">รหัส</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">ชื่อสินค้า</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">หมวดหมู่</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">หน่วย</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">ราคา Default</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.code || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-gray-400 truncate max-w-xs">{item.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{item.category || "-"}</td>
                  <td className="px-4 py-3 text-center text-gray-500 hidden sm:table-cell">{item.unit}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                    {Number(item.defaultPrice).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(item)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium">
                      แก้ไข
                    </button>
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
