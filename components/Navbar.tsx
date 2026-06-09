"use client"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const { data: session } = useSession()
  const path = usePathname()

  return (
    <nav className="bg-black text-white px-6 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-6">
        <Link href="/quotations" className="text-xl font-black tracking-tight">
          <span className="text-red-500">NUM</span>CHAI
        </Link>
        <div className="hidden sm:flex gap-1">
          <Link
            href="/quotations"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              path.startsWith("/quotations") ? "bg-red-600 text-white" : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
          >
            ใบเสนอราคา
          </Link>
          <Link
            href="/quotations/new"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              path === "/quotations/new" ? "bg-red-600 text-white" : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
          >
            + สร้างใหม่
          </Link>
          <Link
            href="/items"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              path.startsWith("/items") ? "bg-red-600 text-white" : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
          >
            คลังสินค้า
          </Link>
          <Link
            href="/customers"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              path.startsWith("/customers") ? "bg-red-600 text-white" : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
          >
            ลูกค้า
          </Link>
          <Link
            href="/employees"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              path.startsWith("/employees") ? "bg-red-600 text-white" : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
          >
            พนักงาน
          </Link>
        </div>
      </div>

      {session?.user && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300 hidden sm:block">{session.user.name}</span>
          {session.user.image && (
            <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            ออกจากระบบ
          </button>
        </div>
      )}
    </nav>
  )
}
