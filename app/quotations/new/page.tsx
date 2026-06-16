"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { QuotationItem } from "@/lib/types"

const PAYMENT_TERMS = [
  "ชำระเงินสด 100% ก่อนติดตั้ง",
  "มัดจำ 50% ก่อนสั่งผลิต ส่วนที่เหลือก่อนติดตั้ง",
  "มัดจำ 30% เมื่อตกลงราคา ชำระส่วนที่เหลือเมื่อติดตั้งเสร็จ",
  "เครดิต 30 วัน",
]

const EMPTY_ITEM: QuotationItem = { description: "", qty: 1, unit: "ชุด", unitPrice: 0, total: 0, costPrice: 0, gpPercent: 0 }

interface SalesPerson {
  id: string
  name: string
  employeeCode: string
  label: string
}

interface CatalogItem {
  id: string
  code: string
  name: string
  unit: string
  costPrice: number
  category: string
  description: string
  isDefault: boolean
}

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
}

function calcGP(unitPrice: number, costPrice: number): number {
  if (!unitPrice || unitPrice <= 0) return 0
  return ((unitPrice - costPrice) / unitPrice) * 100
}

function calcPriceFromGP(gpPercent: number, costPrice: number): number {
  if (gpPercent >= 100) return 0
  return costPrice / (1 - gpPercent / 100)
}

export default function NewQuotationPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [salesList, setSalesList] = useState<SalesPerson[]>([])
  const [selectedSales, setSelectedSales] = useState("")
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [showCatalog, setShowCatalog] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState("")
  const [targetRow, setTargetRow] = useState<number | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [customerSearch, setCustomerSearch] = useState("")

  const today = new Date().toISOString().split("T")[0]

  const [form, setForm] = useState({
    date: today,
    customerName: "",
    customerAddress: "",
    customerPhone: "",
    customerTaxId: "",
    customerBranch: "",
    paymentTerms: PAYMENT_TERMS[0],
    notes: "",
    vatEnabled: true,
    discount: 0,
    costAmount: 0,
  })

  const [items, setItems] = useState<QuotationItem[]>([{ ...EMPTY_ITEM }])
  const [defaultsLoaded, setDefaultsLoaded] = useState(false)

  useEffect(() => {
    fetch("/api/users")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSalesList(data)
          const me = data.find((u: SalesPerson) => u.name === session?.user?.name)
          setSelectedSales(me ? me.label : (data[0]?.label || ""))
        }
      })
      .catch(() => {})
    fetch("/api/items")
      .then(r => r.text())
      .then(t => {
        try {
          const d: CatalogItem[] = JSON.parse(t)
          if (Array.isArray(d)) {
            setCatalog(d)
            // Pre-fill default items only once
            if (!defaultsLoaded) {
              const defaults = d.filter(ci => ci.isDefault)
              if (defaults.length > 0) {
                setItems(defaults.map(ci => ({
                  description: ci.description ? `${ci.name} - ${ci.description}` : ci.name,
                  qty: 1,
                  unit: ci.unit,
                  unitPrice: 0,
                  total: 0,
                  costPrice: ci.costPrice,
                  gpPercent: 0,
                })))
              }
              setDefaultsLoaded(true)
            }
          }
        } catch {}
      })
      .catch(() => {})
    fetch("/api/customers")
      .then(r => r.text()).then(t => { try { const d = JSON.parse(t); if (Array.isArray(d)) setCustomers(d) } catch {} })
      .catch(() => {})
  }, [session])

  function selectCustomer(c: Customer) {
    setForm(f => ({
      ...f,
      customerName: c.name,
      customerAddress: c.address,
      customerPhone: c.phone,
      customerTaxId: c.taxId,
      customerBranch: c.branch || "",
    }))
    setShowCustomerPicker(false)
    setCustomerSearch("")
  }

  function openCatalog(rowIndex: number) {
    setTargetRow(rowIndex)
    setCatalogSearch("")
    setShowCatalog(true)
  }

  function selectCatalogItem(ci: CatalogItem) {
    if (targetRow === null) return
    const updated = [...items]
    const qty = Number(updated[targetRow].qty) || 1
    updated[targetRow] = {
      ...updated[targetRow],
      description: ci.description ? `${ci.name} - ${ci.description}` : ci.name,
      unit: ci.unit,
      costPrice: ci.costPrice,
      unitPrice: updated[targetRow].unitPrice,
      gpPercent: calcGP(updated[targetRow].unitPrice, ci.costPrice),
      total: qty * updated[targetRow].unitPrice,
    }
    setItems(updated)
    setShowCatalog(false)
    setTargetRow(null)
  }

  function updateItem(index: number, field: keyof QuotationItem, rawValue: string | number) {
    const updated = [...items]
    const item = { ...updated[index] }

    if (field === "unitPrice") {
      const unitPrice = Number(rawValue)
      item.unitPrice = unitPrice
      item.gpPercent = calcGP(unitPrice, item.costPrice || 0)
      item.total = Number(item.qty) * unitPrice
    } else if (field === "gpPercent") {
      const gp = Number(rawValue)
      item.gpPercent = gp
      const price = calcPriceFromGP(gp, item.costPrice || 0)
      item.unitPrice = Math.round(price * 100) / 100
      item.total = Number(item.qty) * item.unitPrice
    } else if (field === "qty") {
      item.qty = Number(rawValue)
      item.total = item.qty * item.unitPrice
    } else if (field === "costPrice") {
      item.costPrice = Number(rawValue)
      item.gpPercent = calcGP(item.unitPrice, item.costPrice)
    } else {
      (item as any)[field] = rawValue
    }

    updated[index] = item
    setItems(updated)
  }

  function addItem() {
    setItems([...items, { ...EMPTY_ITEM }])
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((s, i) => s + i.total, 0)
  const vatAmount = form.vatEnabled ? subtotal * 0.07 : 0
  const total = subtotal + vatAmount - Number(form.discount)

  // Auto-calc total costAmount from per-row costPrice * qty
  const autoCostAmount = items.reduce((s, i) => s + (i.costPrice || 0) * i.qty, 0)

  async function handleSubmit(status: "draft" | "sent" | "pending") {
    setSaving(true)
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          costAmount: form.costAmount || autoCostAmount,
          items,
          subtotal,
          vat: vatAmount,
          total,
          status,
          createdBy: selectedSales || session?.user?.name || "",
          createdByEmail: session?.user?.email || "",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/quotations/${data.id}`)
    } catch {
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">สร้างใบเสนอราคา</h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleSubmit("draft")}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            บันทึก Draft
          </button>
          <button
            onClick={() => handleSubmit("pending")}
            disabled={saving}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : "📤 ส่งขออนุมัติ"}
          </button>
        </div>
      </div>

      {/* Catalog Modal */}
      {showCatalog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">เลือกสินค้าจากคลัง</h2>
              <button onClick={() => setShowCatalog(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-4 border-b border-gray-100">
              <input
                autoFocus
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                placeholder="ค้นหาชื่อสินค้า หรือรหัส..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {catalog.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  ยังไม่มีสินค้าในคลัง —{" "}
                  <a href="/items" className="text-red-600 hover:underline">เพิ่มสินค้า</a>
                </div>
              ) : (
                catalog
                  .filter(ci =>
                    ci.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                    ci.code.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                    ci.category.toLowerCase().includes(catalogSearch.toLowerCase())
                  )
                  .map(ci => (
                    <button
                      key={ci.id}
                      onClick={() => selectCatalogItem(ci)}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 border-b border-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-gray-900 text-sm">{ci.name}</span>
                          {ci.isDefault && <span className="ml-1 text-yellow-500 text-xs">⭐</span>}
                          {ci.code && <span className="ml-2 text-xs text-gray-400 font-mono">{ci.code}</span>}
                          {ci.category && <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{ci.category}</span>}
                          {ci.description && <div className="text-xs text-gray-400 mt-0.5">{ci.description}</div>}
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          <div className="text-xs text-gray-500">ต้นทุน</div>
                          <div className="text-sm font-semibold text-gray-700">
                            {Number(ci.costPrice).toLocaleString("th-TH")}
                          </div>
                          <div className="text-xs text-gray-400">{ci.unit}</div>
                        </div>
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Picker Modal */}
      {showCustomerPicker && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">เลือกลูกค้า</h2>
              <button onClick={() => setShowCustomerPicker(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-4 border-b border-gray-100">
              <input autoFocus value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                placeholder="ค้นหาชื่อ รหัส หรือเบอร์โทร..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="overflow-y-auto flex-1">
              {customers.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  ยังไม่มีข้อมูลลูกค้า —{" "}
                  <a href="/customers" className="text-red-600 hover:underline">เพิ่มลูกค้า</a>
                </div>
              ) : customers
                  .filter(c =>
                    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                    c.code.toLowerCase().includes(customerSearch.toLowerCase()) ||
                    c.phone.includes(customerSearch) ||
                    c.contactPerson?.toLowerCase().includes(customerSearch.toLowerCase())
                  )
                  .map(c => (
                    <button key={c.id} onClick={() => selectCustomer(c)}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 border-b border-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{c.name}</div>
                          {c.contactPerson && <div className="text-xs text-gray-500">ผู้ติดต่อ: {c.contactPerson}</div>}
                          {c.address && <div className="text-xs text-gray-400 truncate max-w-xs">{c.address}</div>}
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          {c.code && <div className="text-xs font-mono text-gray-400">{c.code}</div>}
                          {c.phone && <div className="text-xs text-gray-500">{c.phone}</div>}
                        </div>
                      </div>
                    </button>
                  ))
              }
            </div>
          </div>
        </div>
      )}

      {/* ข้อมูลทั่วไป */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">ข้อมูลทั่วไป</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">ผู้เสนอราคา</label>
              <a href="/employees" className="text-xs text-red-600 hover:text-red-700 font-medium">+ จัดการพนักงาน</a>
            </div>
            {salesList.length > 0 ? (
              <select
                value={selectedSales}
                onChange={e => setSelectedSales(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {salesList.map(s => (
                  <option key={s.id} value={s.label}>{s.label}</option>
                ))}
              </select>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50">
                  ยังไม่มีพนักงานในระบบ
                </div>
                <a href="/employees" className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 whitespace-nowrap">
                  สร้างเลย
                </a>
              </div>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">เงื่อนไขการชำระเงิน</label>
            <select
              value={form.paymentTerms}
              onChange={e => setForm({ ...form, paymentTerms: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {PAYMENT_TERMS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ข้อมูลลูกค้า */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">ข้อมูลลูกค้า</h2>
          <button type="button" onClick={() => { setCustomerSearch(""); setShowCustomerPicker(true) }}
            className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
            🔍 เลือกจากฐานข้อมูล
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อลูกค้า / บริษัท *</label>
            <input
              value={form.customerName}
              onChange={e => setForm({ ...form, customerName: e.target.value })}
              placeholder="เช่น บริษัท ABC จำกัด"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
            <textarea
              value={form.customerAddress}
              onChange={e => setForm({ ...form, customerAddress: e.target.value })}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
            <input
              value={form.customerPhone}
              onChange={e => setForm({ ...form, customerPhone: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เลขผู้เสียภาษี</label>
            <input
              value={form.customerTaxId}
              onChange={e => setForm({ ...form, customerTaxId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {/* รายการสินค้า */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">รายการสินค้า / บริการ</h2>
          <span className="text-xs text-gray-400">กรอกราคาขาย → คำนวณ GP% อัตโนมัติ | กรอก GP% → คำนวณราคาขาย</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="pb-3 font-semibold text-gray-600 w-8">#</th>
                <th className="pb-3 font-semibold text-gray-600">รายการ</th>
                <th className="pb-3 font-semibold text-gray-600 w-16 text-center">จำนวน</th>
                <th className="pb-3 font-semibold text-gray-600 w-16 text-center">หน่วย</th>
                <th className="pb-3 font-semibold text-gray-600 w-28 text-right">ต้นทุน/หน่วย</th>
                <th className="pb-3 font-semibold text-gray-600 w-28 text-right">ราคาขาย/หน่วย</th>
                <th className="pb-3 font-semibold text-gray-600 w-20 text-center text-green-700">GP%</th>
                <th className="pb-3 font-semibold text-gray-600 w-28 text-right">รวม</th>
                <th className="pb-3 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item, i) => {
                const gp = item.gpPercent || 0
                const gpColor = gp >= 20 ? "text-green-600" : gp > 0 ? "text-yellow-600" : "text-gray-400"
                return (
                  <tr key={i}>
                    <td className="py-2 text-gray-400 text-xs">{i + 1}</td>
                    <td className="py-2 pr-2">
                      <div className="flex gap-1">
                        <input
                          value={item.description}
                          onChange={e => updateItem(i, "description", e.target.value)}
                          placeholder="ระบุรายการ หรือกด 🔍"
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <button
                          type="button"
                          onClick={() => openCatalog(i)}
                          title="เลือกจากคลังสินค้า"
                          className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 hover:border-red-300 transition-colors"
                        >
                          🔍
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-1">
                      <input
                        type="number" min={1}
                        value={item.qty}
                        onChange={e => updateItem(i, "qty", Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-1 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <input
                        value={item.unit}
                        onChange={e => updateItem(i, "unit", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-1 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <input
                        type="number" min={0}
                        value={item.costPrice || 0}
                        onChange={e => updateItem(i, "costPrice", Number(e.target.value))}
                        className="w-full border border-amber-200 bg-amber-50 rounded-lg px-1 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <input
                        type="number" min={0}
                        value={item.unitPrice}
                        onChange={e => updateItem(i, "unitPrice", Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-1 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <div className="relative">
                        <input
                          type="number" min={0} max={99.9} step={0.1}
                          value={gp === 0 ? "" : Number(gp.toFixed(1))}
                          onChange={e => updateItem(i, "gpPercent", Number(e.target.value))}
                          placeholder="0"
                          className={`w-full border border-green-200 bg-green-50 rounded-lg px-1 pr-5 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-400 ${gpColor} font-semibold`}
                        />
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                      </div>
                    </td>
                    <td className="py-2 pl-2 text-right font-medium text-gray-700 whitespace-nowrap">
                      {item.total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 pl-1">
                      {items.length > 1 && (
                        <button onClick={() => removeItem(i)}
                          className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none">×</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <button onClick={addItem} className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium">
          + เพิ่มรายการ
        </button>
      </div>

      {/* สรุปยอด */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="max-w-xs ml-auto space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">รวมเป็นเงิน</span>
            <span className="font-medium">{subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.vatEnabled}
                onChange={e => setForm({ ...form, vatEnabled: e.target.checked })}
                className="rounded text-red-600"
              />
              ภาษีมูลค่าเพิ่ม 7%
            </label>
            <span className="font-medium">{vatAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">ส่วนลด (บาท)</span>
            <input
              type="number" min={0}
              value={form.discount}
              onChange={e => setForm({ ...form, discount: Number(e.target.value) })}
              className="w-28 border border-gray-200 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="border-t border-gray-200 pt-3 flex justify-between">
            <span className="font-bold text-gray-900">รวมทั้งสิ้น</span>
            <span className="font-bold text-xl text-red-600">
              {total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
          <textarea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          />
        </div>
      </div>

      {/* ข้อมูลภายใน */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-amber-600 font-semibold text-sm">🔒 ข้อมูลภายใน</span>
          <span className="text-xs text-amber-500">(ไม่แสดงในใบเสนอราคาที่ส่งลูกค้า)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ต้นทุนรวม (บาท)
              {autoCostAmount > 0 && form.costAmount === 0 && (
                <span className="ml-2 text-xs text-amber-600 font-normal">
                  คำนวณอัตโนมัติ: {autoCostAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
              )}
            </label>
            <input
              type="number" min={0}
              value={form.costAmount || ""}
              placeholder={autoCostAmount > 0 ? String(autoCostAmount.toFixed(2)) : "0"}
              onChange={e => setForm({ ...form, costAmount: Number(e.target.value) })}
              className="w-full border border-amber-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">กำไรสุทธิ (บาท)</label>
            <div className={`w-full rounded-lg px-3 py-2 text-sm font-semibold border ${(total - (form.costAmount || autoCostAmount)) >= 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>
              {(total - (form.costAmount || autoCostAmount)).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อัตรากำไร GP%</label>
            <div className={`w-full rounded-lg px-3 py-2 text-sm font-semibold border ${(total - (form.costAmount || autoCostAmount)) >= 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>
              {total > 0 ? (((total - (form.costAmount || autoCostAmount)) / total) * 100).toFixed(1) + "%" : "0%"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
