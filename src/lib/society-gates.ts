import fs from 'fs'
import path from 'path'

const STAFF_DATA_PATH = path.join(process.cwd(), 'staff_store.json')

function readAll(): Record<string, any> {
  try {
    if (!fs.existsSync(STAFF_DATA_PATH)) return {}
    const parsed = JSON.parse(fs.readFileSync(STAFF_DATA_PATH, 'utf-8'))
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(all: Record<string, any>) {
  fs.writeFileSync(STAFF_DATA_PATH, JSON.stringify(all, null, 2), 'utf-8')
}

export function cleanGateNames(names: unknown): string[] {
  const clean: string[] = []
  const seen = new Set<string>()
  const list = Array.isArray(names) ? names : []
  list.forEach((item) => {
    const name = String(item || '').trim().slice(0, 40)
    const key = name.toLowerCase()
    if (!name || seen.has(key)) return
    seen.add(key)
    clean.push(name)
  })
  return clean
}

export function listSocietyGates(orgId: string): string[] {
  const entry = readAll()[orgId]
  if (!entry || typeof entry !== 'object') return []
  return cleanGateNames(entry.gates)
}

export function saveSocietyGates(orgId: string, names: unknown): string[] {
  const all = readAll()
  const current = all[orgId]
  const entry = current && typeof current === 'object' && !Array.isArray(current)
    ? current
    : { staff: [], payments: [] }
  entry.gates = cleanGateNames(names)
  all[orgId] = entry
  writeAll(all)
  return entry.gates
}

export function rememberSocietyGate(orgId: string, name: unknown): string[] {
  const next = String(name || '').trim()
  if (!next || next === 'Not assigned') return listSocietyGates(orgId)
  const gates = listSocietyGates(orgId)
  if (gates.some((gate) => gate.toLowerCase() === next.toLowerCase())) return gates
  return saveSocietyGates(orgId, gates.concat(next))
}
