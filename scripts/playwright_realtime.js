const { chromium } = require('playwright')
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const base = 'http://localhost:3000'
const stamp = Date.now().toString().slice(-8)
const adminPhone = '74' + stamp
const residentPhone = '75' + stamp
const staffPhone = '76' + stamp
const pin = '4821'
const society = `Realtime Society ${stamp}`

const results = []
function record(name, ok, detail) {
  results.push({ name, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

async function signIn(page, phone) {
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForSelector('#loginPhoneInput', { timeout: 30000 })
  await page.fill('#loginPhoneInput', phone)
  await page.fill('#loginPinInput', pin)
  await page.click('#loginPinSubmitBtn')
  await page.waitForFunction(() => location.hash && !location.hash.includes('auth-login'), { timeout: 20000 })
}

async function waitForLog(logs, text, timeout = 15000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (logs.some((line) => line.includes(text))) return true
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  return false
}

async function api(page, url, options) {
  return page.evaluate(async ({ url, options }) => {
    const res = await window.apiFetch(url, options || {})
    let data = {}
    try { data = await res.json() } catch (e) {}
    return { status: res.status, data }
  }, { url, options })
}

async function sees(page, text, timeout = 8000) {
  try {
    await page.waitForFunction((needle) => document.body.innerText.includes(needle), text, { timeout })
    return true
  } catch (e) {
    return false
  }
}

async function main() {
  const registered = await fetch(base + '/api/auth/register-society', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      admin: { name: 'Realtime Admin', phone: adminPhone, pin },
      society: { name: society },
      structure: { blocks: [{ name: 'Block A', floors: 1, unitsPerFloor: 1, unitPrefix: 'A-' }] },
    }),
  }).then((res) => res.json())
  if (!registered.success && !registered.token) {
    record('Create society for the live test', false, registered.error || 'no session')
    process.exit(1)
  }
  record('Create society for the live test', true)

  const browser = await chromium.launch({ headless: true, channel: 'chrome' })
  const adminLogs = []
  const residentLogs = []
  const staffLogs = []
  const admin = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const resident = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const guard = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  admin.on('console', (msg) => adminLogs.push(msg.text()))
  resident.on('console', (msg) => residentLogs.push(msg.text()))
  guard.on('console', (msg) => staffLogs.push(msg.text()))

  try {
    await signIn(admin, adminPhone)
    const units = await api(admin, '/api/units')
    const flat = (units.data.units || units.data || [])[0]
    const member = await api(admin, '/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Realtime Resident', phone: residentPhone, role: 'RESIDENT', unitNumber: flat.unitNumber, occupancyType: 'Owner', pin }),
    })
    const staff = await api(admin, '/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Realtime Guard', role: 'Security Guard', phone: staffPhone, salary: 18000, pin }),
    })
    record('Admin creates the resident and the guard', (member.status === 200 || member.status === 201) && (staff.status === 200 || staff.status === 201), member.data.error || staff.data.error || '')

    await signIn(resident, residentPhone)
    await signIn(guard, staffPhone)
    record('Resident portal is open', resident.url().includes('resident-'), resident.url())
    record('Staff portal is open', guard.url().includes('staff-'), guard.url())

    const sockets = await Promise.all([
      waitForLog(adminLogs, 'Socket connected'),
      waitForLog(residentLogs, 'Socket connected'),
      waitForLog(staffLogs, 'Socket connected'),
      waitForLog(adminLogs, 'joining rooms'),
      waitForLog(residentLogs, 'joining rooms'),
      waitForLog(staffLogs, 'joining rooms'),
    ])
    record('Admin, resident, and guard sockets join their rooms', sockets.every(Boolean), sockets.map((ok) => (ok ? 'up' : 'down')).join(' '))

    const notice = await api(admin, '/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Live water notice', content: 'Water off at 6 pm.', status: 'PUBLISHED' }),
    })
    const residentSawNotice = await sees(resident, 'Live water notice')
    const guardSawNotice = await sees(guard, 'Live water notice')
    const adminNotices = await api(resident, '/api/notifications')
    record('Notice is saved for the resident', (adminNotices.data.notifications || []).some((n) => String(n.title).includes('Live water notice')) || (adminNotices.data.items || []).some((n) => String(n.title).includes('Live water notice')), `status ${notice.status}`)
    record('Resident receives the notice live', residentSawNotice)
    record('Guard receives the notice live', guardSawNotice)

    const complaint = await api(resident, '/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Live lift complaint', description: 'Lift is stuck.', category: 'MAINTENANCE' }),
    })
    const adminSawComplaint = await sees(admin, 'Live lift complaint')
    const guardSawComplaint = await sees(guard, 'Live lift complaint')
    const residentSawOwnComplaintToast = await sees(resident, 'New Ticket', 1500)
    record('Complaint is created', complaint.status === 200 || complaint.status === 201, complaint.data.error || '')
    record('Admin receives the complaint live', adminSawComplaint)
    record('Guard receives the complaint live', guardSawComplaint)
    record('The resident who raised it is not toasted again', !residentSawOwnComplaintToast)

    const pass = await api(resident, '/api/entry-passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorName: 'Live Courier', visitorPhone: '9000001111', purpose: 'Delivery' }),
    })
    const guardSawPass = await sees(guard, 'Live Courier')
    const adminSawPass = await sees(admin, 'Live Courier')
    record('Visitor pass is created', pass.status === 200 || pass.status === 201, pass.data.error || pass.data.pass?.passCode || '')
    record('Guard receives the visitor pass live', guardSawPass)
    record('Admin receives the visitor pass live', adminSawPass)

    const verify = await api(guard, '/api/staff/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'quick_verify', passCodeOrPin: pass.data.pass && pass.data.pass.passCode }),
    })
    const residentSawArrival = await sees(resident, 'Visitor Arrived')
    record('Guard check-in is accepted', verify.status === 200, verify.data.error || '')
    record('Resident is told live when the visitor arrives', residentSawArrival)
  } catch (err) {
    record('Realtime walkthrough', false, err.message)
  } finally {
    await browser.close()
  }

  const prisma = new PrismaClient()
  try {
    const orgs = await prisma.organization.findMany({ where: { name: { startsWith: 'Realtime Society' } } })
    for (const org of orgs) {
      const where = { organizationId: org.id }
      await prisma.session.deleteMany({ where: { user: where } }).catch(() => {})
      await prisma.notification.deleteMany({ where }).catch(() => {})
      await prisma.complaint.deleteMany({ where }).catch(() => {})
      await prisma.entryPass.deleteMany({ where }).catch(() => {})
      await prisma.notice.deleteMany({ where }).catch(() => {})
      await prisma.auditLog.deleteMany({ where }).catch(() => {})
      await prisma.chargeHead.deleteMany({ where }).catch(() => {})
      await prisma.staffDuty.deleteMany({ where }).catch(() => {})
      await prisma.user.deleteMany({ where }).catch(() => {})
      await prisma.unit.deleteMany({ where }).catch(() => {})
      await prisma.block.deleteMany({ where }).catch(() => {})
      await prisma.organization.delete({ where: { id: org.id } }).catch(() => {})
      for (const file of ['staff_store.json', 'settings_store.json']) {
        const filePath = path.join(process.cwd(), file)
        if (!fs.existsSync(filePath)) continue
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8') || '{}')
        delete data[org.id]
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
      }
    }
    console.log('test societies removed:', orgs.length)
  } finally {
    await prisma.$disconnect()
  }

  const passed = results.filter((r) => r.ok).length
  console.log(`\n${passed}/${results.length} passed`)
  if (results.some((r) => !r.ok)) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
