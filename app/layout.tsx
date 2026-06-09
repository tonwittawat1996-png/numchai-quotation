import type { Metadata } from "next"
import { Sarabun } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
})

export const metadata: Metadata = {
  title: "NUMCHAI - ระบบใบเสนอราคา",
  description: "ระบบออกใบเสนอราคาลิฟต์ นำชัย โฮม อิเล็คโทรนิคส์",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} font-sans antialiased bg-gray-50`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
