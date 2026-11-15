const base = 'http://127.0.0.1:3000'
const stamp = Date.now().toString().slice(-6)
const adminPhone = '91' + String(7000000000 + Number(stamp.slice(0, 4))).slice(0, 8)
const residentPhone = '9200' + stamp.slice(0, 6)
const staffPhone = '9300' + stamp.slice(0, 6)

function ten(phone) {
  return String(phone).replace(/\D/g, '').slice(-10)
}

const results = []
function record(name, ok, detail) {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = null
  try { data = JSON.parse(text) } catch { data = { error: text.slice(0, 180) } }
  return { status: res.status, data }
}

async function main() {
  const adminPin = '4821'
  const residentPin = '7391'
  const staffPin = '6150'

  const registered = await api('/api/auth/register-society', {
    method: 'POST',
    body: {
      admin: { name: 'Workflow Admin', phone: ten(adminPhone), pin: adminPin, email: `wf-admin-${stamp}@example.com` },
      society: { name: `Workflow Test ${stamp}`, address: 'Sector 22', city: 'Chandigarh', pincode: '160022' },
      structure: { blocks: [{ name: 'Tower A', floors: 1, unitsPerFloor: 2 }] },
      members: { importedRows: [{ name: 'Workflow Resident', phone: ten(residentPhone), unitNumber: 'A-101', type: 'OWNER', email: `wf-res-${stamp}@example.com` }] },
    },
  })
  const adminToken = registered.data?.token
  const orgId = registered.data?.organization?.id
  record('Register society', registered.status === 200 && !!adminToken && (registered.data?.stats?.unitsCreated || 0) >= 1, `status ${registered.status} units ${registered.data?.stats?.unitsCreated} ${registered.data?.error || ''}`)

  const dup = await api('/api/auth/register-society', {
    method: 'POST',
    body: {
      admin: { name: 'Other', phone: ten(adminPhone), pin: '1111' },
      society: { name: 'Duplicate Society' },
    },
  })
  record('Same phone cannot register twice', dup.status === 409, `status ${dup.status}`)

  const me = await api('/api/auth/me', { token: adminToken })
  record('Admin session', me.status === 200 && me.data?.user?.role === 'RWA_ADMIN' && me.data?.user?.organizationId === orgId, `role ${me.data?.user?.role}`)

  const units = await api('/api/units', { token: adminToken })
  const unitList = units.data?.units || units.data || []
  const flat = Array.isArray(unitList) ? unitList.find(u => u.unitNumber === 'A-101') : null
  record('Units created for the society', units.status === 200 && !!flat && flat.occupancyStatus !== undefined, `status ${units.status} count ${Array.isArray(unitList) ? unitList.length : 0}`)

  const members = await api('/api/members', { token: adminToken })
  const memberRows = members.data?.members || []
  const leakedHash = memberRows.some(m => m.passwordHash)
  record('Member list hides password hashes', members.status === 200 && !leakedHash, `status ${members.status} members ${memberRows.length}`)

  const dash = await api('/api/dashboard/stats', { token: adminToken })
  record('Admin dashboard stats', dash.status === 200, `status ${dash.status} ${dash.data?.error || ''}`)

  const expense = await api('/api/expenses', {
    method: 'POST',
    token: adminToken,
    body: { title: 'Workflow water bill', amount: 1500, category: 'Utilities', vendorName: 'Municipal' },
  })
  record('Admin can record an expense', expense.status === 200 && expense.data?.expense?.organizationId === orgId, `status ${expense.status} ${expense.data?.error || ''}`)

  const notice = await api('/api/notices', {
    method: 'POST',
    token: adminToken,
    body: { title: 'Workflow notice', content: 'Water supply from 10 to 12.', type: 'GENERAL' },
  })
  record('Admin can publish a notice', notice.status === 200 && !!notice.data?.notice?.id, `status ${notice.status} ${notice.data?.error || ''}`)

  const staff = await api('/api/staff', {
    method: 'POST',
    token: adminToken,
    body: { name: 'Workflow Guard', role: 'Security Guard', department: 'Security', phone: ten(staffPhone), salary: 12000 },
  })
  record('Admin can add staff', staff.status === 200, `status ${staff.status} ${staff.data?.error || ''}`)

  const pinReset = await api('/api/auth/login', {
    method: 'POST',
    body: { phone: ten(adminPhone), pin: '9999', action: 'reset_pin' },
  })
  record('PIN reset without proof is rejected', pinReset.status === 403, `status ${pinReset.status}`)

  const loginOk = await api('/api/auth/login', {
    method: 'POST',
    body: { phone: ten(adminPhone), pin: adminPin },
  })
  record('Admin PIN login', loginOk.status === 200 && !!loginOk.data?.token, `status ${loginOk.status} ${loginOk.data?.error || ''}`)

  const setup = await api('/api/auth/login', {
    method: 'POST',
    body: { phone: ten(residentPhone), pin: residentPin, confirmPin: residentPin, action: 'setup_pin' },
  })
  const residentToken = setup.data?.token
  record('Resident first PIN setup', setup.status === 200 && setup.data?.user?.role === 'RESIDENT' && setup.data?.user?.unitId, `status ${setup.status} role ${setup.data?.user?.role} ${setup.data?.error || ''}`)

  const residentExpense = await api('/api/expenses', {
    method: 'POST',
    token: residentToken,
    body: { title: 'Resident should not post this', amount: 10 },
  })
  record('Resident cannot record an expense', residentExpense.status === 403, `status ${residentExpense.status}`)

  const complaint = await api('/api/complaints', {
    method: 'POST',
    token: residentToken,
    body: { title: 'Lift stuck', description: 'Lift 1 is not moving.' },
  })
  record('Resident can raise a complaint', complaint.status === 200 && !!complaint.data?.complaint?.id, `status ${complaint.status} ${complaint.data?.error || ''}`)

  const pass = await api('/api/entry-passes', {
    method: 'POST',
    token: residentToken,
    body: { visitorName: 'Workflow Guest', visitorPhone: '9400000001', purpose: 'Visit' },
  })
  record('Resident can issue a visitor pass for their flat', pass.status === 200 && !!pass.data?.pass?.id, `status ${pass.status} ${pass.data?.error || ''}`)

  const notices = await api('/api/notices', { token: residentToken })
  const seesNotice = (notices.data?.notices || []).some(n => n.title === 'Workflow notice')
  record('Resident sees the society notice', notices.status === 200 && seesNotice, `status ${notices.status} count ${(notices.data?.notices || []).length}`)

  const residentSettings = await api('/api/settings', { token: residentToken })
  const acct = residentSettings.data?.settings?.payment?.accountNumber || ''
  const fakeOrg = residentSettings.data?.organization?.name === 'Greenwood Heights RWA'
  record('Resident settings hide the bank account and do not invent a society', residentSettings.status === 200 && !acct && !fakeOrg, `status ${residentSettings.status} org ${residentSettings.data?.organization?.name || 'none'}`)

  const staffSetup = await api('/api/auth/login', {
    method: 'POST',
    body: { phone: ten(staffPhone), pin: staffPin, confirmPin: staffPin, action: 'setup_pin' },
  })
  const staffToken = staffSetup.data?.token
  record('Staff first PIN setup', staffSetup.status === 200 && staffSetup.data?.user?.role === 'STAFF', `status ${staffSetup.status} role ${staffSetup.data?.user?.role} ${staffSetup.data?.error || ''}`)

  const verify = await api('/api/staff/portal', {
    method: 'POST',
    token: staffToken,
    body: { action: 'quick_verify', passCodeOrPin: pass.data?.pass?.passCode },
  })
  record('Guard can verify a pass in this society', verify.status === 200, `status ${verify.status} ${verify.data?.error || ''}`)

  const anonDelete = await api('/api/entry-passes?id=' + (pass.data?.pass?.id || 'none'), { method: 'DELETE' })
  record('Anonymous pass delete is rejected', anonDelete.status === 401 || anonDelete.status === 403, `status ${anonDelete.status}`)

  const home = await fetch(base + '/')
  record('App home page loads', home.status === 200, `status ${home.status}`)

  console.log('\n' + results.filter(r => r.ok).length + '/' + results.length + ' passed')
  if (results.some(r => !r.ok)) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
