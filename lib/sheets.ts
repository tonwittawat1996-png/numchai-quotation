import { google } from "googleapis"

function getAuth() {
  const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!
  const key = JSON.parse(Buffer.from(keyBase64, "base64").toString("utf-8"))
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID!

export async function appendRow(sheetName: string, values: any[]) {
  const auth = getAuth()
  const sheets = google.sheets({ version: "v4", auth })
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [values] },
  })
}

export async function getRows(sheetName: string): Promise<any[][]> {
  const auth = getAuth()
  const sheets = google.sheets({ version: "v4", auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A2:Z`,
  })
  return res.data.values || []
}

export async function updateRow(sheetName: string, rowIndex: number, values: any[]) {
  const auth = getAuth()
  const sheets = google.sheets({ version: "v4", auth })
  // rowIndex is 0-based data row, +2 for header row and 1-based
  const row = rowIndex + 2
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A${row}`,
    valueInputOption: "RAW",
    requestBody: { values: [values] },
  })
}

export async function deleteRows(sheetName: string, rowIndices: number[]) {
  if (rowIndices.length === 0) return
  const auth = getAuth()
  const sheets = google.sheets({ version: "v4", auth })
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
  const sheet = meta.data.sheets?.find(s => s.properties?.title === sheetName)
  if (!sheet) throw new Error(`Sheet ${sheetName} not found`)
  const sheetId = sheet.properties?.sheetId!
  // ลบจากล่างขึ้นบน เพื่อไม่ให้ index เลื่อน
  const sorted = [...rowIndices].sort((a, b) => b - a)
  const requests = sorted.map(idx => ({
    deleteDimension: {
      range: { sheetId, dimension: "ROWS", startIndex: idx + 1, endIndex: idx + 2 },
    },
  }))
  await sheets.spreadsheets.batchUpdate({ spreadsheetId: SHEET_ID, requestBody: { requests } })
}

export async function getNextQuotationNumber(): Promise<string> {
  const rows = await getRows("Quotations")
  const year = new Date().getFullYear() + 543 // พ.ศ.
  const count = rows.filter(r => r[0]?.startsWith(`QT-${year}`)).length
  const seq = String(count + 1).padStart(4, "0")
  return `QT-${year}-${seq}`
}
