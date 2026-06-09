# NUMCHAI ระบบใบเสนอราคา

ระบบออกใบเสนอราคาลิฟต์ บริษัท นำชัย โฮม อิเล็คโทรนิคส์ จำกัด

---

## วิธี Setup (ทำครั้งเดียว)

### 1. สร้าง Google OAuth Credentials

1. ไปที่ [console.cloud.google.com](https://console.cloud.google.com)
2. สร้าง Project ใหม่ ตั้งชื่อ "numchai-quotation"
3. ไป **APIs & Services > Enable APIs** เปิดใช้งาน:
   - Google Sheets API
   - Google Drive API
4. ไป **APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs เพิ่ม: `http://localhost:3000/api/auth/callback/google`
5. Copy **Client ID** และ **Client Secret**

### 2. สร้าง Service Account (สำหรับเขียน Google Sheets)

1. ไป **APIs & Services > Credentials > Create Credentials > Service Account**
2. ตั้งชื่อ "numchai-sheets"
3. คลิก Service Account ที่สร้าง > **Keys > Add Key > JSON**
4. ดาวน์โหลดไฟล์ .json
5. แปลงเป็น Base64:
   ```
   # Windows PowerShell:
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\key.json"))
   ```
6. Copy ผลลัพธ์ไปใส่ `GOOGLE_SERVICE_ACCOUNT_KEY` ใน .env.local

### 3. สร้าง Google Sheet

1. ไปที่ [sheets.google.com](https://sheets.google.com) สร้าง Spreadsheet ใหม่
2. สร้าง Sheet ชื่อ **Quotations** และ **QuotationItems**
3. ใน Sheet **Quotations** ให้ใส่หัวคอลัมน์ row 1:
   ```
   QuotationNo | Date | CustomerName | CustomerPhone | Total | Status | CreatedBy | ID | CustomerAddress | CustomerTaxId | Discount | VAT | Subtotal | VATEnabled | PaymentTerms | Notes | CreatedByEmail
   ```
4. ใน Sheet **QuotationItems** ใส่หัวคอลัมน์ row 1:
   ```
   QuotationID | Description | Qty | Unit | UnitPrice | Total
   ```
5. Copy **Spreadsheet ID** จาก URL (ส่วนที่อยู่ระหว่าง `/d/` และ `/edit`)
6. **Share** Spreadsheet กับ email ของ Service Account (ต้องให้สิทธิ์ Editor)

### 4. ตั้งค่า .env.local

```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
NEXTAUTH_SECRET=ใส่ตัวอักษรสุ่มที่ปลอดภัย
NEXTAUTH_URL=http://localhost:3000
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
GOOGLE_SERVICE_ACCOUNT_KEY=eyJ0eXBlIjoic2Vyd...
```

### 5. รันโปรเจกต์

```bash
npm install
npm run dev
```

เปิดเบราว์เซอร์ไปที่ http://localhost:3000

---

## โครงสร้างไฟล์

```
app/
  login/          → หน้า Login Google
  quotations/     → รายการใบเสนอราคา
  quotations/new/ → สร้างใบเสนอราคา
  quotations/[id] → ดูรายละเอียด + Print PDF
  api/quotations/ → API endpoints
lib/
  sheets.ts       → Google Sheets helper
  types.ts        → TypeScript types
components/
  Navbar.tsx      → Navigation bar
```

## Deploy บน Vercel (ฟรี)

1. Push code ขึ้น GitHub
2. ไป [vercel.com](https://vercel.com) > Import Project
3. ใส่ Environment Variables เดียวกับ .env.local
4. เพิ่ม `https://your-app.vercel.app/api/auth/callback/google` ใน Google OAuth Redirect URIs
5. Deploy!
