"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

interface QuotationRow {
  quotationNo: string
  date: string
  customerName: string
  customerPhone: string
  total: string
  status: string
  createdBy: string
  id: string
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600" },
  sent: { label: "ส่งแล้ว", color: "bg-blue-100 text-blue-700" },
  won: { label: "ชนะ", color: "bg-green-100 text-green-700" },
  lost: { label: "แพ้", color: "bg-red-100 text-red-600" },
}

export default function QuotationsPage() {
  const [rows, setRows] = useState<QuotationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/quotations")
      .then(r => r.json())
      .then(data => { setRows(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = rows.filter(r =>
    r.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    r.quotationNo?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">ใบเสนอราคา</h1>
        <Link
          href="/quotations/new"
          className="inline-flex items-center gap-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          + สร้างใบเสนอราคา
        </Link>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="ค้นหาลูกค้า หรือเลขที่ใบเสนอราคา..."
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white shadow-sm"
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">ยังไม่มีใบเสนอราคา</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">เลขที่</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">วันที่</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">ลูกค้า</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">มูลค่า (บาท)</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">สถานะ</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">ผู้สร้าง</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(r => {
                const s = STATUS_LABEL[r.status] || STATUS_LABEL.draft
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.quotationNo}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.date ? new Date(r.date).toLocaleDateString("th-TH") : "-"}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.customerName}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">
                      {Number(r.total).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{r.createdBy}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/quotations/${r.id}`}
                        className="text-red-600 hover:text-red-700 font-medium text-xs"
                      >
                        ดู →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
