import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { stringify } from 'csv-stringify/sync'

const DATA_DIR = path.join(process.cwd(), 'data')

export function readCsv(filename) {
  const filePath = path.join(DATA_DIR, filename)
  if (!fs.existsSync(filePath)) return []
  const content = fs.readFileSync(filePath, 'utf-8')
  return parse(content, { columns: true, skip_empty_lines: true, bom: true })
}

export function writeCsv(filename, records) {
  const filePath = path.join(DATA_DIR, filename)
  if (records.length === 0) {
    fs.writeFileSync(filePath, '', 'utf-8')
    return
  }
  const output = stringify(records, { header: true, columns: Object.keys(records[0]) })
  fs.writeFileSync(filePath, output, 'utf-8')
}

export function getNextId(records) {
  if (!records || records.length === 0) return '1'
  const max = Math.max(...records.map(r => parseInt(r.id) || 0))
  return String(max + 1)
}
