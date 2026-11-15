const { chromium } = require('playwright')
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const base = 'http://localhost:3000'
const stamp = Date.now().toString().slice(-8)
const adminPhone = '71' + stamp
const residentPhone = '72' + stamp
const staffPhone = '73' + stamp
const pin = '4821'
const society = `Full Test Society ${stamp}`
const adminName = 'Full Test Admin'
const residentName = 'Full Test Resident'
const staffName = 'Full Test Guard'

const results = []
function record(name, ok, detail) {
  results.push({ name, ok, detail: detail || '' })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

const ADMIN_SCREENS = [
  'admin-dashboard', 'admin-audit', 'admin-structure', 'admin-members', 'admin-vehicles',
  'admin-charges', 'admin-invoices', 'admin-payments', 'admin-dues', 'admin-receivables',
  'admin-ledger', 'admin-expenses', 'admin-reports', 'admin-notices', 'admin-broadcasts',
  'admin-polls', 'admin-complaints', 'admin-meetings', 'admin-committee', 'admin-documents',
  'admin-compliance', 'admin-vendors', 'admin-staff', 'admin-duty', 'admin-assets',
  'admin-amenities', 'admin-entry-passes', 'admin-emergency', 'admin-settings',
  'admin-subscription', 'admin-notifications', 'admin-profile',
]

const RESIDENT_SCREENS = [
  'resident-dashboard', 'resident-bills', 'resident-payments', 'resident-ledger',
  'resident-notices', 'resident-polls', 'resident-complaints', 'resident-meetings',
  'resident-documents', 'resident-amenities', 'resident-notifications', 'resident-profile',
]

function attachErrors(page, bucket) {
  page.on('pageerror', (err) => bucket.push(err.message))
}

async function openScreens(page, screens, role, errors) {
  for (const screen of screens) {
    const serverErrors = []
    const onResponse = (res) => {
      const url = res.url()
      if (url.includes('/api/') && res.status() >= 500) serverErrors.push(`${res.status()} ${url.split('?')[0]}`)
    }
    const errorMark = errors.length
    page.on('response', onResponse)
    await page.evaluate((name) => window.Router.go(name), screen)
    await page.waitForTimeout(1200)
    page.off('response', onResponse)
    const text = await page.locator('#app').innerText().catch(() => '')
    const broken = /being finalized/i.test(text) || text.trim().length < 20
    const fake = /342 residents|Greenwood Heights|Ramesh Kumar|Ram Singh|Mukesh Amazon|₹1,00,000/i.test(text)
    const thrown = errors.slice(errorMark)
    const ok = !broken && !fake && serverErrors.length === 0 && thrown.length === 0
    const detail = [
      broken ? 'screen did not render' : '',
      fake ? 'fake data on screen' : '',
      serverErrors[0] || '',
      thrown[0] || '',
    ].filter(Boolean).join('; ')
    record(`${role} / ${screen}`, ok, detail)
  }
}

async function api(page, url, options) {
  return page.evaluate(async ({ url, options }) => {
    const res = await window.apiFetch(url, options || {})
    let data = {}
    try { data = await res.json() } catch (e) {}
    return { status: res.status, data }
  }, { url, options })
}

async function signIn(page, phone) {
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForSelector('#loginPhoneInput', { timeout: 30000 })
  await page.fill('#loginPhoneInput', phone)
  await page.fill('#loginPinInput', pin)
  await page.click('#loginPinSubmitBtn')
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' })
  const adminErrors = []
  const admin = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  attachErrors(admin, adminErrors)
  admin.on('dialog', (dialog) => dialog.accept())

  try {
    await admin.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await admin.waitForSelector('#loginPhoneInput', { timeout: 30000 })
    await admin.getByText('Onboard your society here').click()
    await admin.waitForSelector('#wizSocName', { timeout: 15000 })
    await admin.fill('#wizSocName', society)
    await admin.fill('#wizAdminName', adminName)
    await admin.fill('#wizAdminPhone', adminPhone)
    await admin.fill('#wizAdminPin', pin)
    await admin.fill('#wizAdminConfirmPin', pin)
    for (let step = 1; step <= 4; step++) {
      await admin.locator('button', { hasText: 'Continue to Step' }).first().click()
      await admin.waitForTimeout(300)
    }
    await admin.waitForSelector('#launchFooterBtn', { timeout: 10000 })
    await admin.click('#launchFooterBtn')
    await admin.waitForSelector('#dashGreeting', { timeout: 20000 })
    await admin.waitForTimeout(1500)
    const launched = await admin.locator('#app').innerText()
    record('Admin launches a society', launched.includes(society) || launched.includes(adminName))

    await openScreens(admin, ADMIN_SCREENS, 'Admin', adminErrors)

    const units = await api(admin, '/api/units')
    const unitList = units.data.units || units.data || []
    const flat = Array.isArray(unitList) ? unitList[0] : null
    record('Admin can list flats', units.status === 200 && !!flat, flat ? flat.unitNumber : `status ${units.status}`)

    const member = await api(admin, '/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: residentName,
        phone: residentPhone,
        role: 'RESIDENT',
        unitNumber: flat && flat.unitNumber,
        occupancyType: 'Owner',
        pin,
      }),
    })
    record('Admin adds a resident', member.status === 200 || member.status === 201, member.data.error || member.data.member?.phone || String(member.status))

    const staff = await api(admin, '/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: staffName,
        role: 'Security Guard',
        department: 'Security',
        phone: staffPhone,
        salary: 18000,
        pin,
      }),
    })
    record('Admin adds a guard', staff.status === 200 || staff.status === 201, staff.data.error || String(staff.status))

    const notice = await api(admin, '/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Water shutdown test', content: 'Water will be off from 10 to 12.', type: 'GENERAL', status: 'PUBLISHED' }),
    })
    record('Admin publishes a notice', notice.status === 200 || notice.status === 201, notice.data.error || String(notice.status))

    const expense = await api(admin, '/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Pump repair', amount: 1500, category: 'Maintenance', description: 'Full test voucher' }),
    })
    record('Admin records an expense', expense.status === 200 || expense.status === 201, expense.data.error || String(expense.status))

    const residentErrors = []
    const resident = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    attachErrors(resident, residentErrors)
    await signIn(resident, residentPhone)
    await resident.waitForFunction(() => location.hash.includes('resident-'), { timeout: 20000 })
    record('Resident signs in to the resident portal', true, resident.url())
    await openScreens(resident, RESIDENT_SCREENS, 'Resident', residentErrors)

    const complaint = await api(resident, '/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Lift not working', description: 'Lift stopped on the second floor.', category: 'MAINTENANCE' }),
    })
    record('Resident raises a complaint', complaint.status === 200 || complaint.status === 201, complaint.data.error || String(complaint.status))

    const pass = await api(resident, '/api/entry-passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorName: 'Test Guest', visitorPhone: '9000000000', purpose: 'Delivery' }),
    })
    const passCode = pass.data.pass?.passCode || pass.data.entryPass?.passCode || pass.data.passCode
    record('Resident issues a visitor pass', (pass.status === 200 || pass.status === 201) && !!passCode, pass.data.error || passCode || String(pass.status))

    const blockedExpense = await api(resident, '/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Resident should not post this', amount: 99 }),
    })
    record('Resident cannot record a society expense', blockedExpense.status === 403, String(blockedExpense.status))

    const notices = await api(resident, '/api/notices')
    const noticeRows = notices.data.notices || []
    record('Resident can read the published notice', noticeRows.some((n) => n.title === 'Water shutdown test'), `${noticeRows.length} notices`)

    const staffErrors = []
    const guard = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    attachErrors(guard, staffErrors)
    await signIn(guard, staffPhone)
    await guard.waitForFunction(() => location.hash.includes('staff-'), { timeout: 20000 })
    record('Guard signs in to the staff portal', true, guard.url())
    await openScreens(guard, ['staff-dashboard'], 'Guard', staffErrors)

    const verify = await api(guard, '/api/staff/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'quick_verify', passCodeOrPin: passCode }),
    })
    record('Guard verifies the visitor pass', verify.status === 200, verify.data.error || String(verify.status))

    await admin.evaluate(() => window.Router.go('admin-complaints'))
    await admin.waitForTimeout(1500)
    const complaintText = await admin.locator('#app').innerText()
    record('Admin sees the resident complaint', complaintText.includes('Lift not working'))

    await admin.evaluate(() => window.Router.go('admin-entry-passes'))
    await admin.waitForTimeout(1500)
    const passText = await admin.locator('#app').innerText()
    record('Admin sees the visitor pass', passText.includes('Test Guest') || passText.includes(passCode || 'NO-CODE'))
  } catch (err) {
    record('Complete application walkthrough', false, err.message)
  } finally {
    await browser.close()
  }

  const prisma = new PrismaClient()
  try {
    const orgs = await prisma.organization.findMany({ where: { name: { startsWith: 'Full Test Society' } } })
    for (const org of orgs) {
      const where = { organizationId: org.id }
      await prisma.otpCode.deleteMany({ where: { user: where } }).catch(() => {})
      await prisma.session.deleteMany({ where: { user: where } }).catch(() => {})
      await prisma.notification.deleteMany({ where }).catch(() => {})
      await prisma.complaintComment.deleteMany({ where: { complaint: where } }).catch(() => {})
      await prisma.complaint.deleteMany({ where }).catch(() => {})
      await prisma.entryPass.deleteMany({ where }).catch(() => {})
      await prisma.expense.deleteMany({ where }).catch(() => {})
      await prisma.notice.deleteMany({ where }).catch(() => {})
      await prisma.auditLog.deleteMany({ where }).catch(() => {})
      await prisma.chargeHead.deleteMany({ where }).catch(() => {})
      await prisma.staffDuty.deleteMany({ where }).catch(() => {})
      await prisma.payment.deleteMany({ where }).catch(() => {})
      await prisma.invoiceItem.deleteMany({ where: { invoice: where } }).catch(() => {})
      await prisma.invoice.deleteMany({ where }).catch(() => {})
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
  } catch (err) {
    console.log('cleanup warning:', err.message)
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
