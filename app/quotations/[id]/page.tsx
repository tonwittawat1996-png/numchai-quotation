"use client"
import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Quotation } from "@/lib/types"

export default function QuotationDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [q, setQ] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/quotations/${id}`)
      .then(r => r.json())
      .then(data => {
        // ถ้า API คืน error object ให้ set null
        if (data?.error) { setQ(null) }
        else { setQ({ ...data, items: data.items ?? [] }) }
        setLoading(false)
      })
      .catch(() => { setQ(null); setLoading(false) })
  }, [id])

  function handlePrint() {
    window.print()
  }

  if (loading) return <div className="p-12 text-center text-gray-400">กำลังโหลด...</div>
  if (!q) return <div className="p-12 text-center text-red-400">ไม่พบใบเสนอราคา</div>

  const thaiDate = new Date(q.date).toLocaleDateString("th-TH", {
    year: "numeric", month: "long", day: "numeric",
  })

  return (
    <>
      {/* Action Bar (ซ่อนตอน print) */}
      <div className="no-print flex items-center justify-between mb-6">
        <Link href="/quotations" className="text-sm text-gray-500 hover:text-gray-700">
          ← กลับรายการ
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/quotations/${id}/edit`)}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            ✏️ แก้ไข
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            🖨️ พิมพ์ / บันทึก PDF
          </button>
        </div>
      </div>

      {/* ใบเสนอราคา (ส่วนที่จะ Print) */}
      <div ref={printRef} className="bg-white shadow-sm rounded-xl border border-gray-100 p-8 print:shadow-none print:rounded-none print:border-none print:p-6">

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
            <div className="text-2xl font-bold text-gray-800">ใบเสนอราคา</div>
            <div className="text-sm text-gray-500 mt-1">Quotation</div>
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

        {/* Divider */}
        <div className="h-1 bg-gradient-to-r from-red-600 to-black rounded mb-6" />

        {/* ข้อมูลลูกค้า */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ข้อมูลลูกค้า</div>
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
            <div className="font-semibold text-gray-900 text-base">{q.customerName}</div>
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
                <td className="px-3 py-2.5 text-right text-gray-700">
                  {Number(item.unitPrice).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2.5 text-right font-medium text-gray-800">
                  {Number(item.total).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* สรุปยอด */}
        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">รวมเป็นเงิน</span>
              <span>{Number(q.subtotal).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
            </div>
            {q.vatEnabled && (
              <div className="flex justify-between">
                <span className="text-gray-500">ภาษีมูลค่าเพิ่ม 7%</span>
                <span>{Number(q.vat).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {Number(q.discount) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">ส่วนลด</span>
                <span className="text-red-600">-{Number(q.discount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base">
              <span>รวมทั้งสิ้น</span>
              <span className="text-red-600 text-lg">
                {Number(q.total).toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท
              </span>
            </div>
          </div>
        </div>

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
          </div>
        </div>
      </div>

      {/* Print CSS */}
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
