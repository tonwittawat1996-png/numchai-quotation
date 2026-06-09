"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [name, setName] = useState("")
  const [employeeCode, setEmployeeCode] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    if (mode === "register") {
      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, username, password, employeeCode }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error); setLoading(false); return }
        setSuccess(`สมัครสำเร็จ! ยินดีต้อนรับ ${data.name} — กรุณา Login`)
        setMode("login")
        setName("")
        setEmployeeCode("")
      } catch {
        setError("เกิดข้อผิดพลาด กรุณาลองใหม่")
      }
      setLoading(false)
      return
    }

    // Login with credentials
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง")
      setLoading(false)
    } else {
      router.push("/quotations")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl font-black tracking-tight">
            <span className="text-red-600">NUM</span><span className="text-black">CHAI</span>
          </div>
          <div className="text-xs tracking-widest text-gray-400 font-medium mt-1">HOME ELECTRONICS</div>
          <div className="text-sm text-gray-500 mt-2">ระบบใบเสนอราคา</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); setSuccess("") }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "login" ? "bg-white shadow text-gray-900" : "text-gray-500"
              }`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); setSuccess("") }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "register" ? "bg-white shadow text-gray-900" : "text-gray-500"
              }`}
            >
              สมัครสมาชิก
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-100 text-green-700 text-sm rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อ-นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี"
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รหัสพนักงาน <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
                  </label>
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={e => setEmployeeCode(e.target.value)}
                    placeholder="เช่น EMP-001"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อผู้ใช้งาน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="เช่น Wittawat"
                required
                autoComplete="username"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {mode === "register" && (
                <p className="text-xs text-gray-400 mt-1">ใช้สำหรับ Login เท่านั้น ตั้งเป็นชื่อเล่นก็ได้</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่าน <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === "register" ? "อย่างน้อย 4 ตัวอักษร" : "••••••••"}
                required
                minLength={mode === "register" ? 4 : 1}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {loading
                ? "กำลังดำเนินการ..."
                : mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">หรือ</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/quotations" })}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            เข้าสู่ระบบด้วย Google
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          บริษัท นำชัย โฮม อิเล็คโทรนิคส์ จำกัด
        </p>
      </div>
    </div>
  )
}
