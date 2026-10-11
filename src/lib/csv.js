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
  // Union of keys across all records, not just the first one — otherwise a
  // field present only on some rows (e.g. a column added after older rows
  // were written) silently gets dropped for every row, old and new alike.
  const columns = [...new Set(records.flatMap((r) => Object.keys(r)))]
  const output = stringify(records, { header: true, columns })
  fs.writeFileSync(filePath, output, 'utf-8')
}

export function getNextId(records) {
  if (!records || records.length === 0) return '1'
  const max = Math.max(...records.map(r => parseInt(r.id) || 0))
  return String(max + 1)
}
