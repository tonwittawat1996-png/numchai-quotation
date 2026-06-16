"use client"
import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Quotation } from "@/lib/types"

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft:    { label: "แบบร่าง",       color: "bg-gray-100 text-gray-600" },
  pending:  { label: "รออนุมัติ",     color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "อนุมัติแล้ว",   color: "bg-green-100 text-green-700" },
  rejected: { label: "ส่งกลับแก้ไข", color: "bg-red-100 text-red-600" },
  sent:     { label: "ส่งลูกค้าแล้ว", color: "bg-blue-100 text-blue-700" },
}

export default function QuotationDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [q, setQ] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [printMode, setPrintMode] = useState<"internal" | "customer" | null>(null)
  const [approvalNote, setApprovalNote] = useState("")
  const [approving, setApproving] = useState(false)
  const [showRejectBox, setShowRejectBox] = useState(false)

  const role = (session?.user as any)?.role
  const isAdmin = role === "admin"

  async function loadQ() {
    const res = await fetch(`/api/quotations/${id}`)
    const data = await res.json()
    if (data?.error) { setQ(null) } else { setQ({ ...data, items: data.items ?? [] }) }
    setLoading(false)
  }

  useEffect(() => { loadQ() }, [id])

  async function doApprove(action: "approve" | "reject") {
    setApproving(true)
    const res = await fetch(`/api/quotations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, approvalNote }),
    })
    const data = await res.json()
    if (!res.ok) { alert(data.error); setApproving(false); return }
    setApprovalNote("")
    setShowRejectBox(false)
    loadQ()
    setApproving(false)
  }

  async function markSent() {
    await fetch(`/api/quotations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...q, status: "sent", items: q?.items }),
    })
    loadQ()
  }

  function handlePrint(mode: "internal" | "customer") {
    setPrintMode(mode)
    setTimeout(() => { window.print(); setPrintMode(null) }, 100)
  }

  if (loading) return <div className="p-12 text-center text-gray-400">กำลังโหลด...</div>
  if (!q) return <div className="p-12 text-center text-red-400">ไม่พบใบเสนอราคา</div>

  const thaiDate = new Date(q.date).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })
  const profit = q.total - q.costAmount
  const profitPct = q.total > 0 ? ((profit / q.total) * 100).toFixed(1) : "0"
  const st = STATUS_LABEL[q.status] || STATUS_LABEL.draft

  return (
    <>
      {/* Action Bar */}
      <div className="no-print space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <Link href="/quotations" className="text-sm text-gray-500 hover:text-gray-700">← กลับรายการ</Link>
          <div className="flex gap-2 items-center">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${st.color}`}>{st.label}</span>
            {/* พนักงาน: แก้ได้ถ้ายังไม่ approved */}
            {(q.status === "draft" || q.status === "rejected") && (
              <button onClick={() => router.push(`/quotations/${id}/edit`)}
                className="flex items-center gap-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                ✏️ แก้ไข
              </button>
            )}
            {isAdmin && (q.status === "draft" || q.status === "rejected") && (
              <button onClick={() => router.push(`/quotations/${id}/edit`)}
                className="flex items-center gap-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                ✏️ แก้ไข
              </button>
            )}
            {/* ปุ่มพิมพ์ */}
            {(q.status === "approved" || q.status === "sent") && (
              <button onClick={() => handlePrint("customer")}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">
                🖨️ พิมพ์ใบเสนอราคา
              </button>
            )}
            <button onClick={() => handlePrint("internal")}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              🖨️ พิมพ์ใบขออนุมัติ
            </button>
          </div>
        </div>

        {/* Admin: Approval Panel */}
        {isAdmin && q.status === "pending" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="font-semibold text-yellow-800 mb-1">📋 รออนุมัติจากผู้บริหาร</div>
            {q.costAmount > 0 && (
              <div className="flex gap-6 text-sm text-gray-600 mb-3">
                <span>ต้นทุน: <strong>{q.costAmount.toLocaleString("th-TH")}</strong> บ.</span>
                <span>กำไร: <strong className={profit >= 0 ? "text-green-600" : "text-red-600"}>{profit.toLocaleString("th-TH")}</strong> บ.</span>
                <span>อัตรากำไร: <strong className={profit >= 0 ? "text-green-600" : "text-red-600"}>{profitPct}%</strong></span>
              </div>
            )}
            {showRejectBox ? (
              <div className="space-y-2">
                <textarea value={approvalNote} onChange={e => setApprovalNote(e.target.value)}
                  placeholder="ระบุเหตุผลที่ส่งกลับ..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => doApprove("reject")} disabled={approving}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60">
                    ↩️ ยืนยันส่งกลับ
                  </button>
                  <button onClick={() => setShowRejectBox(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => doApprove("approve")} disabled={approving}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60">
                  ✅ อนุมัติ
                </button>
                <button onClick={() => setShowRejectBox(true)}
                  className="px-5 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">
                  ↩️ ส่งกลับแก้ไข
                </button>
              </div>
            )}
          </div>
        )}

        {/* Approved → ส่งลูกค้า */}
        {isAdmin && q.status === "approved" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold text-green-800">✅ อนุมัติโดย {q.approvedBy}</div>
              {q.approvalNote && <div className="text-xs text-green-600 mt-0.5">{q.approvalNote}</div>}
            </div>
            <button onClick={markSent}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              📤 ทำเครื่องหมายส่งลูกค้าแล้ว
            </button>
          </div>
        )}

        {/* Rejected — แสดงเหตุผล */}
        {q.status === "rejected" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="font-semibold text-red-700">↩️ ส่งกลับแก้ไขโดย {q.approvedBy}</div>
            {q.approvalNote && <div className="text-sm text-red-600 mt-1">เหตุผล: {q.approvalNote}</div>}
          </div>
        )}

        {/* Sent */}
        {q.status === "sent" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
            📤 ส่งใบเสนอราคาให้ลูกค้าแล้ว (อนุมัติโดย {q.approvedBy})
          </div>
        )}
      </div>

      {/* ใบเอกสาร */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-8 print:shadow-none print:rounded-none print:border-none print:p-6">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-3xl font-black tracking-tight">
              <span className="text-red-600">NUM</span><span className="text-black">CHAI</span>
            </div>
            <div className="text-[10px] tracking-widest text-gray-400 font-medium">HOME ELECTRONICS</div>
            <div className="mt-2 text-xs text-gray-500 leading-5">
              <div>บริษัท นำชัย โฮม อิเล็คโทรนิคส์ จำกัด</div>
              <div>353/46 ม.9 ต.หนองปรือ อ.บางละมุง จ.ชลบุรี 20150</div>
              <div>โทร 038-716-525 | เลขผู้เสียภาษี 0205546002539</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-800">
              {printMode === "customer" ? "ใบเสนอราคา" : "ใบขออนุมัติขาย"}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {printMode === "customer" ? "Quotation" : "Sales Approval Request"}
            </div>
            <div className="mt-3 text-xs text-gray-600 space-y-1">
              <div className="flex justify-between gap-8">
                <span className="text-gray-400">เลขที่</span>
                <span className="font-semibold font-mono">{q.quotationNo}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-gray-400">วันที่</span>
                <span className="font-medium">{thaiDate}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-1 bg-gradient-to-r from-red-600 to-black rounded mb-6" />

        {/* ข้อมูลลูกค้า */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ข้อมูลลูกค้า</div>
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
            <div className="font-semibold text-gray-900 text-base">
              {q.customerName}
              {q.customerBranch && <span className="ml-2 text-sm font-normal text-gray-500">({q.customerBranch})</span>}
            </div>
            {q.customerAddress && <div className="text-gray-600">{q.customerAddress}</div>}
            <div className="flex gap-6 text-gray-500">
              {q.customerPhone && <span>โทร {q.customerPhone}</span>}
              {q.customerTaxId && <span>เลขผู้เสียภาษี {q.customerTaxId}</span>}
            </div>
          </div>
        </div>

        {/* ตารางรายการ */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="bg-black text-white">
              <th className="text-left px-3 py-2.5 rounded-tl-lg font-medium w-8">#</th>
              <th className="text-left px-3 py-2.5 font-medium">รายการสินค้า / บริการ</th>
              <th className="text-center px-3 py-2.5 font-medium w-16">จำนวน</th>
              <th className="text-center px-3 py-2.5 font-medium w-16">หน่วย</th>
              <th className="text-right px-3 py-2.5 font-medium w-28">ราคา/หน่วย</th>
              <th className="text-right px-3 py-2.5 rounded-tr-lg font-medium w-28">รวม (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {q.items.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                <td className="px-3 py-2.5 text-gray-800">{item.description}</td>
                <td className="px-3 py-2.5 text-center text-gray-700">{item.qty}</td>
                <td className="px-3 py-2.5 text-center text-gray-500">{item.unit}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{Number(item.unitPrice).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-3 py-2.5 text-right font-medium text-gray-800">{Number(item.total).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* สรุปยอด */}
        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">รวมเป็นเงิน</span>
              <span>{Number(q.subtotal).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            {q.vatEnabled && (
              <div className="flex justify-between">
                <span className="text-gray-500">ภาษีมูลค่าเพิ่ม 7%</span>
                <span>{Number(q.vat).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
            {Number(q.discount) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">ส่วนลด</span>
                <span className="text-red-600">-{Number(q.discount).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base">
              <span>รวมทั้งสิ้น</span>
              <span className="text-red-600 text-lg">{Number(q.total).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
            </div>
          </div>
        </div>

        {/* ต้นทุน/กำไร (แสดงเฉพาะใบขออนุมัติ) */}
        {printMode !== "customer" && q.costAmount > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
            <div className="font-semibold text-amber-800 mb-2">🔒 ข้อมูลภายใน — ไม่แสดงในใบลูกค้า</div>
            <div className="flex gap-8">
              <div>
                <span className="text-gray-500">ต้นทุนรวม: </span>
                <strong>{q.costAmount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</strong>
              </div>
              <div>
                <span className="text-gray-500">กำไรสุทธิ: </span>
                <strong className={profit >= 0 ? "text-green-700" : "text-red-600"}>
                  {profit.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท ({profitPct}%)
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* เงื่อนไข + หมายเหตุ */}
        {(q.paymentTerms || q.notes) && (
          <div className="text-xs text-gray-500 mb-8 space-y-1">
            {q.paymentTerms && <div><span className="font-medium text-gray-700">เงื่อนไขการชำระเงิน:</span> {q.paymentTerms}</div>}
            {q.notes && <div><span className="font-medium text-gray-700">หมายเหตุ:</span> {q.notes}</div>}
          </div>
        )}

        {/* ลายเซ็น */}
        <div className="grid grid-cols-2 gap-8 mt-8 pt-6 border-t border-gray-100">
          <div className="text-center">
            <div className="h-14 border-b border-dashed border-gray-300 mb-2" />
            <div className="text-sm font-medium text-gray-700">ลูกค้า / ผู้รับใบเสนอราคา</div>
            <div className="text-xs text-gray-400 mt-1">วันที่ ............................................</div>
          </div>
          <div className="text-center">
            <div className="h-14 border-b border-dashed border-gray-300 mb-2" />
            <div className="text-sm font-medium text-gray-700">บริษัท นำชัย โฮม อิเล็คโทรนิคส์ จำกัด</div>
            <div className="text-xs text-gray-400 mt-1">ผู้เสนอราคา: {q.createdBy}</div>
            {printMode !== "customer" && q.approvedBy && (
              <div className="text-xs text-green-600 mt-0.5">อนุมัติโดย: {q.approvedBy}</div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          nav { display: none !important; }
          body { background: white !important; }
          main { padding: 0 !important; max-width: 100% !important; }
        }
      `}</style>
    </>
  )
}
