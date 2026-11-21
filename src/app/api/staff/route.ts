import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, hashPassword } from '@/lib/auth'
import { notifyUsers } from '@/lib/socket-server'
import { findUserByPhone, normalizePhone, societyMembershipBlock } from '@/lib/phone'
import { listSocietyGates, rememberSocietyGate, saveSocietyGates } from '@/lib/society-gates'
import { logAudit } from '@/lib/audit'
import fs from 'fs'
import path from 'path'

const STAFF_DATA_PATH = path.join(process.cwd(), 'staff_store.json')

export interface StaffRecord {
  id: string
  name: string
  role: string
  department: string
  phone: string
  salary: number
  salaryType: 'MONTHLY' | 'DAILY'
  joiningDate: string
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE'
  shift: 'DAY' | 'NIGHT' | 'ROTATIONAL' | 'GENERAL'
  pin?: string

  lastPaidMonth: string
  lastPaidDate?: string
  upiId?: string
  accountNumber?: string
  ifscCode?: string
  aadhaarNumber?: string
  emergencyContact?: string
  portalAccess?: string[]
  startTime?: string
  endTime?: string
  supervisorName?: string
  supervisorPhone?: string
  reliefName?: string
  reliefPhone?: string
  locationPost?: string
  createdAt: string
  updatedAt?: string
}

const PORTAL_SECTION_IDS = ['gate', 'visitors', 'cleaning', 'garden', 'jobs', 'office', 'shift', 'salary', 'intercom']

function departmentCategory(department?: string) {
  const value = (department || '').toUpperCase()
  if (value.includes('SEC')) return 'SECURITY'
  if (value.includes('HOUSE')) return 'HOUSEKEEPING'
  if (value.includes('GARDEN')) return 'GARDENING'
  if (value.includes('ADMIN') || value.includes('OFFICE')) return 'OFFICE'
  return 'MAINTENANCE'
}

function defaultPortalAccess(department?: string) {
  const category = departmentCategory(department)
  if (category === 'SECURITY') return ['gate', 'visitors', 'shift', 'intercom']
  if (category === 'HOUSEKEEPING') return ['cleaning', 'jobs', 'shift', 'intercom']
  if (category === 'GARDENING') return ['garden', 'jobs', 'shift', 'intercom']
  if (category === 'OFFICE') return ['office', 'jobs', 'shift', 'intercom']
  return ['jobs', 'shift', 'intercom']
}

function cleanPortalAccess(value: unknown, department?: string) {
  const allowed = new Set(PORTAL_SECTION_IDS)
  const picked = Array.isArray(value)
    ? value.map((item) => String(item)).filter((item) => allowed.has(item))
    : []
  return picked.length ? Array.from(new Set(picked)) : defaultPortalAccess(department)
}

function notesWithAccess(existingNotes: string | null | undefined, portalAccess: string[], handover?: { supervisorName?: string; supervisorPhone?: string; reliefName?: string; reliefPhone?: string }) {
  let base: Record<string, unknown> = {}
  try {
    if (existingNotes && existingNotes.trim().startsWith('{')) base = JSON.parse(existingNotes)
    else if (existingNotes) base = { note: existingNotes }
  } catch {
    base = existingNotes ? { note: existingNotes } : {}
  }
  base.portalAccess = portalAccess
  if (handover) {
    base.supervisorName = handover.supervisorName || ''
    base.supervisorPhone = handover.supervisorPhone || ''
    base.reliefName = handover.reliefName || ''
    base.reliefPhone = handover.reliefPhone || ''
  }
  return JSON.stringify(base)
}

export interface StaffSalaryPayment {
  id: string
  staffId: string
  staffName: string
  role: string
  month: string
  amount: number
  paymentMethod: 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE'
  transactionRef?: string
  paidAt: string
  paidBy: string
  notes?: string
}

interface OrgStaffStore {
  staff: StaffRecord[]
  payments: StaffSalaryPayment[]
}

function shiftLabel(shift?: string) {
  if (shift === 'NIGHT') return 'Night Shift'
  if (shift === 'ROTATIONAL') return 'Rotational'
  if (shift === 'GENERAL') return 'General Shift'
  return 'Day Shift'
}

const INVENTED_DUTY_POSTS = new Set([
  'Gate 1 Entrance Desk',
  'Gate 1 - Main Entrance',
  'Gate 1 - Main Entrance Desk',
])

function dutyFieldsFromStaff(staff: { name: string; role: string; department: string; phone: string; salary?: number; shift?: string; status?: string; locationPost?: string }, existing?: { locationPost?: string | null; startTime?: string | null; endTime?: string | null; salaryDate?: string | null; lastPaidDate?: string | null; attendancePresent?: number | null; attendanceTotal?: number | null }) {
  const inventedPost = !existing?.locationPost
    || INVENTED_DUTY_POSTS.has(existing.locationPost)
    || existing.locationPost === `${staff.department} Station`
  const requestedPost = staff.locationPost !== undefined ? String(staff.locationPost).trim() : undefined
  const locationPost = requestedPost !== undefined
    ? (requestedPost || 'Not assigned')
    : (inventedPost ? 'Not assigned' : existing!.locationPost!)
  const defaultHours = !existing?.startTime || !existing?.endTime
  const defaultPayDate = !existing?.salaryDate || existing.salaryDate === '5th of every month'
  const defaultAttendance = !existing || (existing.attendancePresent === 26 && existing.attendanceTotal === 28)
  return {
    staffName: staff.name.trim(),
    role: staff.role.trim(),
    phone: staff.phone,
    locationPost,
    shiftName: shiftLabel(staff.shift),
    startTime: defaultHours ? '' : (existing?.startTime || ''),
    endTime: defaultHours ? '' : (existing?.endTime || ''),
    salaryAmount: Number(staff.salary) || 0,
    salaryDate: defaultPayDate ? '' : (existing?.salaryDate || ''),
    ...(existing?.lastPaidDate ? {} : { paymentStatus: '' }),
    attendancePresent: defaultAttendance ? 0 : (existing?.attendancePresent || 0),
    attendanceTotal: defaultAttendance ? 0 : (existing?.attendanceTotal || 0),
    status: staff.status === 'ACTIVE' ? 'ON_DUTY' : 'OFF_DUTY',
  }
}

const SAMPLE_STAFF_IDS = new Set(['STF-001', 'STF-002', 'STF-003', 'STF-004', 'STF-005'])
const SAMPLE_STAFF_NAMES = new Set(['Ramesh Kumar', 'Suresh Singh', 'Meena Bai', 'Rajiv Mali', 'Prem Lal'])

function stripSampleStaff(data: OrgStaffStore): OrgStaffStore {
  const staff = data.staff.filter((s) => !SAMPLE_STAFF_IDS.has(s.id) && !SAMPLE_STAFF_NAMES.has(s.name))
  const keptIds = new Set(staff.map((s) => s.id))
  const payments = data.payments.filter((p) => keptIds.has(p.staffId) && p.id !== 'PAY-STF-001')
  return { staff, payments }
}

function getStoredStaffData(orgId: string): OrgStaffStore {
  try {
    if (fs.existsSync(STAFF_DATA_PATH)) {
      const allData = JSON.parse(fs.readFileSync(STAFF_DATA_PATH, 'utf-8'))
      if (allData && allData[orgId]) {
        const orgEntry = allData[orgId]
        const stored = stripSampleStaff({
          staff: Array.isArray(orgEntry.staff) ? orgEntry.staff : [],
          payments: Array.isArray(orgEntry.payments) ? orgEntry.payments : [],
        })
        if (stored.staff.length !== (orgEntry.staff || []).length || stored.payments.length !== (orgEntry.payments || []).length) {
          saveStoredStaffData(orgId, stored)
        }
        return stored
      }
    }
  } catch (e) {
    console.error('Error reading staff store:', e)
  }

  return { staff: [], payments: [] }
}

export function payrollMonthLabel(when = new Date()) {
  return when.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function phoneTail(value?: string | null) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length >= 10 ? digits.slice(-10) : ''
}

export function applyPayrollFromExpense(orgId: string, match: { phone?: string | null; name?: string | null }, payment: { amount: number; when: Date; paidBy: string; expenseId: string }) {
  const data = getStoredStaffData(orgId)
  const tail = phoneTail(match.phone)
  const wanted = String(match.name || '').trim().toLowerCase()
  const staffMember = data.staff.find((row) => tail && phoneTail(row.phone) === tail)
    || data.staff.find((row) => wanted && row.name.trim().toLowerCase() === wanted)
  if (!staffMember) return null
  const month = payrollMonthLabel(payment.when)
  const already = data.payments.some((row) => row.transactionRef === payment.expenseId || (row.notes || '').includes(payment.expenseId))
  if (!already) {
    data.payments.unshift({
      id: `PAY-STF-${Math.floor(100 + Math.random() * 900)}`,
      staffId: staffMember.id,
      staffName: staffMember.name,
      role: staffMember.role,
      month,
      amount: payment.amount,
      paymentMethod: 'CASH',
      transactionRef: payment.expenseId,
      paidAt: payment.when.toISOString(),
      paidBy: payment.paidBy,
      notes: `Recorded from expense ${payment.expenseId}`,
    })
  }
  staffMember.updatedAt = new Date().toISOString()
  saveStoredStaffData(orgId, data)
  return { staffId: staffMember.id, name: staffMember.name, month }
}

function isExpenseOnlyPayment(notes?: string | null) {
  return String(notes || '').startsWith('Recorded from expense')
}

export function staffCreditsFor(orgId: string, phone?: string | null, name?: string | null) {
  const data = getStoredStaffData(orgId)
  const tail = phoneTail(phone)
  const wanted = String(name || '').trim().toLowerCase()
  const member = data.staff.find((row) => tail && phoneTail(row.phone) === tail)
    || data.staff.find((row) => wanted && row.name.trim().toLowerCase() === wanted)
  if (!member) return []
  return data.payments
    .filter((row) => row.staffId === member.id && !isExpenseOnlyPayment(row.notes))
    .map((row) => {
      const when = new Date(row.paidAt)
      const paidLabel = Number.isNaN(when.getTime())
        ? row.paidAt
        : when.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      return {
        id: row.id,
        amount: row.amount,
        month: row.month,
        method: row.paymentMethod,
        reference: row.transactionRef,
        paidAt: row.paidAt,
        paidLabel,
        notes: row.notes || '',
      }
    })
}

export async function clearSalaryMarkedPaidByExpense(orgId: string) {
  const data = getStoredStaffData(orgId)
  let changed = false
  for (const member of data.staff) {
    const own = data.payments.filter((row) => row.staffId === member.id)
    const real = own.filter((row) => !isExpenseOnlyPayment(row.notes))
    const fake = own.filter((row) => isExpenseOnlyPayment(row.notes))
    if (!fake.length) continue
    data.payments = data.payments.filter((row) => !(row.staffId === member.id && isExpenseOnlyPayment(row.notes)))
    changed = true
    if (!real.length) {
      member.lastPaidMonth = ''
      member.lastPaidDate = ''
    } else {
      member.lastPaidMonth = real[0].month
      member.lastPaidDate = real[0].paidAt
    }
  }
  if (changed) saveStoredStaffData(orgId, data)

  const duties = await prisma.staffDuty.findMany({ where: { organizationId: orgId } })
  for (const duty of duties) {
    const tail = phoneTail(duty.phone)
    const member = data.staff.find((row) => (tail && phoneTail(row.phone) === tail) || row.name.trim().toLowerCase() === duty.staffName.trim().toLowerCase())
    if (!member) continue
    const real = data.payments.filter((row) => row.staffId === member.id && !isExpenseOnlyPayment(row.notes))
    if (real.length) continue
    if (!duty.lastPaidDate && duty.paymentStatus !== 'PAID') continue
    const paidLabel = duty.lastPaidDate || ''
    await prisma.staffDuty.update({
      where: { id: duty.id },
      data: {
        paymentStatus: '',
        lastPaidDate: '',
        salaryDate: duty.salaryDate === paidLabel ? '' : duty.salaryDate,
      },
    })
  }
}

export async function ensureStaffAccount(orgId: string, input: { name: string; phone: string; department?: string; salary?: number; role?: string }) {
  const name = String(input.name || '').trim()
  const phone = String(input.phone || '').trim()
  const cleanPhone = normalizePhone(phone)
  if (!name) return { error: 'Enter the person\'s name' }
  if (!cleanPhone) return { error: 'Enter a valid 10-digit phone number' }
  const membership = await societyMembershipBlock(cleanPhone, orgId)
  if (membership.error) return { error: membership.error }
  const existingUser = membership.existing
  if (existingUser && existingUser.role !== 'STAFF' && existingUser.organizationId === orgId) {
    return { error: 'This phone is already a resident in this society. Use a different number for the staff login.' }
  }

  const department = input.department || 'Security'
  const role = input.role || 'Staff'
  const salary = Number(input.salary) || 0
  const data = getStoredStaffData(orgId)
  const tail = phoneTail(cleanPhone)
  let stored = data.staff.find((row) => phoneTail(row.phone) === tail)
  const createdStore = !stored
  let duty = await prisma.staffDuty.findFirst({
    where: {
      organizationId: orgId,
      OR: [{ phone }, { phone: cleanPhone }, { phone: tail }],
    },
  })

  if (stored && duty) {
    return { dutyId: duty.id, name: stored.name || duty.staffName, phone: duty.phone, created: false }
  }

  if (!stored) {
    stored = {
      id: `STF-${Math.floor(100 + Math.random() * 900)}`,
      name,
      role,
      department,
      phone,
      salary,
      salaryType: 'MONTHLY',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      shift: 'GENERAL',
      pin: '1234',
      lastPaidMonth: '',
      upiId: '',
      accountNumber: '',
      ifscCode: '',
      aadhaarNumber: '',
      emergencyContact: '',
      portalAccess: defaultPortalAccess(department),
      createdAt: new Date().toISOString(),
    }
    data.staff.unshift(stored)
    saveStoredStaffData(orgId, data)
  }

  const salaryForDuty = Number(input.salary) || Number(duty?.salaryAmount) || Number(stored.salary) || 0
  const dutyFields = dutyFieldsFromStaff({ name, role, department, phone, salary: salaryForDuty, shift: 'GENERAL', status: 'ACTIVE' }, duty || undefined)
  const dutyNotes = notesWithAccess(duty?.notes, stored.portalAccess || defaultPortalAccess(department))
  if (duty) {
    duty = await prisma.staffDuty.update({
      where: { id: duty.id },
      data: { ...dutyFields, category: departmentCategory(department), notes: dutyNotes },
    })
  } else {
    duty = await prisma.staffDuty.create({
      data: {
        organizationId: orgId,
        ...dutyFields,
        category: departmentCategory(department),
        notes: dutyNotes,
      },
    })
  }

  const passwordHash = existingUser?.passwordHash ? undefined : await hashPassword('1234')
  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name,
        role: 'STAFF',
        status: 'ACTIVE',
        ...(existingUser.organizationId ? {} : { organizationId: orgId }),
        ...(passwordHash ? { passwordHash } : {}),
      },
    })
  } else {
    await prisma.user.create({
      data: {
        phone: cleanPhone,
        name,
        role: 'STAFF',
        status: 'ACTIVE',
        passwordHash: passwordHash || await hashPassword('1234'),
        organizationId: orgId,
      },
    })
  }

  return { dutyId: duty.id, name: duty.staffName, phone: duty.phone, created: createdStore }
}

export function undoPayrollFromExpense(orgId: string, expenseId: string) {
  const data = getStoredStaffData(orgId)
  const payment = data.payments.find((row) => row.transactionRef === expenseId || (row.notes || '').includes(expenseId))
  if (!payment) return
  data.payments = data.payments.filter((row) => row.id !== payment.id)
  const staffMember = data.staff.find((row) => row.id === payment.staffId)
  if (staffMember && staffMember.lastPaidMonth === payment.month) {
    const earlier = data.payments.find((row) => row.staffId === staffMember.id)
    staffMember.lastPaidMonth = earlier?.month || ''
    staffMember.lastPaidDate = earlier?.paidAt || ''
  }
  saveStoredStaffData(orgId, data)
}

function saveStoredStaffData(orgId: string, data: OrgStaffStore) {
  try {
    let allData: any = {}
    if (fs.existsSync(STAFF_DATA_PATH)) {
      try {
        allData = JSON.parse(fs.readFileSync(STAFF_DATA_PATH, 'utf-8'))
      } catch (e) {}
    }
    const previous = allData[orgId] && typeof allData[orgId] === 'object' ? allData[orgId] : {}
    allData[orgId] = {
      ...previous,
      staff: data.staff,
      payments: data.payments,
    }
    fs.writeFileSync(STAFF_DATA_PATH, JSON.stringify(allData, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error saving staff store:', e)
  }
}

function calculateStaffMetrics(staff: StaffRecord[], currentMonth: string = 'Oct 2026') {
  const activeStaff = staff.filter(s => s.status === 'ACTIVE')
  const totalPayrollLiability = activeStaff.reduce((sum, s) => sum + (Number(s.salary) || 0), 0)
  const paidStaff = activeStaff.filter(s => s.lastPaidMonth === currentMonth)
  const paidAmount = paidStaff.reduce((sum, s) => sum + (Number(s.salary) || 0), 0)
  const pendingStaff = activeStaff.filter(s => s.lastPaidMonth !== currentMonth)
  const pendingAmount = pendingStaff.reduce((sum, s) => sum + (Number(s.salary) || 0), 0)

  return {
    totalStaff: staff.length,
    activeStaff: activeStaff.length,
    monthlyPayroll: totalPayrollLiability,
    paidThisMonthCount: paidStaff.length,
    paidThisMonthAmount: paidAmount,
    pendingDisbursementCount: pendingStaff.length,
    pendingDisbursementAmount: pendingAmount,
    currentMonth,
  }
}

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    if (!user.organizationId) return NextResponse.json({ staff: [], payments: [], metrics: {} })
    const orgId = user.organizationId
    const data = getStoredStaffData(orgId)
    await clearSalaryMarkedPaidByExpense(orgId)
    const fresh = getStoredStaffData(orgId)
    const metrics = calculateStaffMetrics(fresh.staff, payrollMonthLabel())
    const duties = await prisma.staffDuty.findMany({
      where: { organizationId: orgId },
      select: { phone: true, staffName: true, locationPost: true },
    })
    const phoneTail = (value: string | null | undefined) => String(value || '').replace(/\D/g, '').slice(-10)
    const staff = fresh.staff.map(({ pin, aadhaarNumber, accountNumber, ...rest }) => {
      const duty = duties.find((row) => {
        const samePhone = phoneTail(row.phone) && phoneTail(row.phone) === phoneTail(rest.phone)
        const sameName = row.staffName.trim().toLowerCase() === String(rest.name || '').trim().toLowerCase()
        return samePhone || sameName
      })
      const dutyPost = duty?.locationPost && duty.locationPost !== 'Not assigned' ? duty.locationPost : ''
      const savedPost = rest.locationPost && rest.locationPost !== 'Not assigned' ? rest.locationPost : ''
      return { ...rest, locationPost: dutyPost || savedPost }
    })
    const gates = listSocietyGates(orgId)

    return NextResponse.json({
      staff,
      payments: fresh.payments,
      metrics,
      gates,
    })
  } catch (err: unknown) {
    console.error('Error in GET /api/staff:', err)
    return NextResponse.json({ error: 'Failed to fetch staff data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const orgId = user.organizationId!
    const body = await request.json()
    const { action = 'create_staff' } = body

    const data = getStoredStaffData(orgId)

    if (action === 'save_gate') {
      const name = String(body.name || '').trim()
      if (!name) return NextResponse.json({ error: 'Enter a gate name' }, { status: 400 })
      const gates = rememberSocietyGate(orgId, name)
      return NextResponse.json({ success: true, gates })
    }

    if (action === 'remove_gate') {
      const name = String(body.name || '').trim().toLowerCase()
      const gates = saveSocietyGates(orgId, listSocietyGates(orgId).filter((gate) => gate.toLowerCase() !== name))
      return NextResponse.json({ success: true, gates })
    }

    if (action === 'disburse_salary') {
      const {
        staffId,
        month = 'Oct 2026',
        amount,
        paymentMethod = 'UPI',
        transactionRef = '',
        notes = '',
      } = body

      if (!staffId) {
        return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
      }

      const staffMember = data.staff.find(s => s.id === staffId)
      if (!staffMember) {
        return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
      }

      const payAmount = Number(amount) || staffMember.salary
      const newPaymentId = `PAY-STF-${Math.floor(100 + Math.random() * 900)}`

      const paymentRecord: StaffSalaryPayment = {
        id: newPaymentId,
        staffId: staffMember.id,
        staffName: staffMember.name,
        role: staffMember.role,
        month,
        amount: payAmount,
        paymentMethod,
        transactionRef: transactionRef.trim() || `TXN-${Date.now().toString().slice(-6)}`,
        paidAt: new Date().toISOString(),
        paidBy: user.name || 'Society Admin',
        notes: notes.trim(),
      }

      staffMember.lastPaidMonth = month
      staffMember.lastPaidDate = paymentRecord.paidAt
      staffMember.updatedAt = new Date().toISOString()

      data.payments.unshift(paymentRecord)
      saveStoredStaffData(orgId, data)

      const salaryExpense = await prisma.expense.create({
        data: {
          organizationId: orgId,
          title: `Salary for ${month}: ${staffMember.name}`,
          amount: payAmount,
          totalAmount: payAmount,
          category: 'Staff Salary',
          vendorName: staffMember.name,
          description: notes.trim() || `Salary disbursed for ${month}`,
          billDate: new Date(),
          paidDate: new Date(),
          paidBy: user.name || 'Admin',
          status: 'PAID',
          notes: JSON.stringify({
            staffName: staffMember.name,
            staffPhone: staffMember.phone,
            salaryPayment: true,
            credited: true,
            payrollPaymentId: paymentRecord.id,
          }),
          createdBy: user.name || 'Admin',
        },
      })
      paymentRecord.notes = `${paymentRecord.notes || ''} Expense ${salaryExpense.id}`.trim()
      saveStoredStaffData(orgId, data)

      const tail = phoneTail(staffMember.phone)
      const dutyRows = await prisma.staffDuty.findMany({ where: { organizationId: orgId } })
      const duty = dutyRows.find((row) => phoneTail(row.phone) === tail)
        || dutyRows.find((row) => row.staffName.trim().toLowerCase() === staffMember.name.trim().toLowerCase())
      if (duty) {
        const paidOn = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        await prisma.staffDuty.update({
          where: { id: duty.id },
          data: {
            salaryAmount: payAmount > 0 ? payAmount : duty.salaryAmount,
            paymentStatus: 'PAID',
            lastPaidDate: paidOn,
            salaryDate: paidOn,
          },
        })
      }

      const paidStaff = await findUserByPhone(staffMember.phone)
      const amountLabel = `₹${payAmount.toLocaleString('en-IN')}`
      const creditMessage = `${amountLabel} for ${month} has been sent to your account via ${paymentMethod}. Reference ${paymentRecord.transactionRef}.`
      if (paidStaff) {
        await notifyUsers({
          orgId,
          userIds: [paidStaff.id],
          title: 'Salary credited to you',
          message: creditMessage,
          type: 'STAFF_SALARY',
          event: 'staff-salary-paid',
          referenceType: 'STAFF',
          referenceId: staffMember.id,
          data: { payment: paymentRecord, staffName: staffMember.name, staffPhone: staffMember.phone, amount: payAmount },
        })
      }
      await notifyUsers({
        orgId,
        roles: ['admin'],
        title: `Salary sent to ${staffMember.name}`,
        message: `${amountLabel} for ${month} was credited via ${paymentMethod}. Reference ${paymentRecord.transactionRef}.`,
        type: 'STAFF_SALARY',
        event: 'staff-salary-paid',
        referenceType: 'STAFF',
        referenceId: staffMember.id,
        data: { payment: paymentRecord, staffName: staffMember.name, staffPhone: staffMember.phone, amount: payAmount },
      })

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'STAFF_SALARY_PAID',
        entityType: 'StaffSalary',
        entityId: paymentRecord.id,
        details: `Salary ₹${payAmount.toLocaleString('en-IN')} for ${month} disbursed to ${staffMember.name} (${staffMember.role}) via ${paymentMethod} by ${user.name}`,
        severity: 'INFO',
        newValues: paymentRecord,
        ipAddress: request.headers.get('x-forwarded-for') || null,
        userAgent: request.headers.get('user-agent') || null,
      })

      return NextResponse.json({ success: true, payment: paymentRecord, staff: staffMember })
    }

    // Default: create_staff
    const {
      name,
      role,
      department = 'General',
      phone,
      salary,
      salaryType = 'MONTHLY',
      joiningDate = '2026-10-01',
      shift = 'DAY',
      pin = '',
      portalAccess,
      upiId = '',
      accountNumber = '',
      ifscCode = '',
      aadhaarNumber = '',
      emergencyContact = '',
      locationPost = '',
    } = body

    if (!name || !role || !phone || salary === undefined) {
      return NextResponse.json({ error: 'Name, role, phone number, and salary amount are required' }, { status: 400 })
    }

    const newStaffId = `STF-${Math.floor(100 + Math.random() * 900)}`
    const staffPin = String(pin || '').trim()
    const cleanPhone = normalizePhone(phone)
    const tenDigit = cleanPhone || ''
    if (!cleanPhone) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number' }, { status: 400 })
    }
    const membership = await societyMembershipBlock(cleanPhone, orgId)
    if (membership.error) {
      return NextResponse.json({ error: membership.error }, { status: 409 })
    }
    if (membership.existing && membership.existing.role !== 'STAFF' && membership.existing.organizationId === orgId) {
      return NextResponse.json(
        { error: 'This phone is already a resident in this society. Use a different number for the staff login.' },
        { status: 409 }
      )
    }

    const newStaff: StaffRecord = {
      id: newStaffId,
      name: name.trim(),
      role: role.trim(),
      department: department.trim() || 'General',
      phone: phone.trim(),
      salary: Number(salary) || 0,
      salaryType: salaryType || 'MONTHLY',
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      shift: shift || 'DAY',
      pin: staffPin,
      lastPaidMonth: '',
      upiId: upiId.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      aadhaarNumber: aadhaarNumber.trim(),
      emergencyContact: emergencyContact.trim(),
      portalAccess: cleanPortalAccess(portalAccess, department),
      locationPost: String(locationPost || '').trim(),
      createdAt: new Date().toISOString(),
    }

    data.staff.unshift(newStaff)
    saveStoredStaffData(orgId, data)
    if (newStaff.locationPost && newStaff.locationPost !== 'Not assigned') {
      rememberSocietyGate(orgId, newStaff.locationPost)
    }

    // Sync to Prisma: StaffDuty & User (for guard/staff login)
    try {
      const cat = departmentCategory(department)
      const existingDuty = await prisma.staffDuty.findFirst({
        where: {
          organizationId: orgId,
          OR: [{ phone: phone.trim() }, { phone: cleanPhone }, { phone: tenDigit }],
        },
      })

      const dutyFields = dutyFieldsFromStaff({ name, role, department, phone: phone.trim(), salary: Number(salary) || 0, shift, status: 'ACTIVE', locationPost: newStaff.locationPost || '' }, existingDuty || undefined)
      const dutyNotes = notesWithAccess(existingDuty?.notes, newStaff.portalAccess || defaultPortalAccess(department))
      const gateName = newStaff.locationPost && newStaff.locationPost !== 'Not assigned' ? newStaff.locationPost : null
      if (existingDuty) {
        await prisma.staffDuty.update({
          where: { id: existingDuty.id },
          data: { ...dutyFields, blockName: gateName, category: cat, notes: dutyNotes },
        })
      } else {
        await prisma.staffDuty.create({
          data: {
            organizationId: orgId,
            ...dutyFields,
            blockName: gateName,
            category: cat,
            notes: dutyNotes,
          },
        })
      }

      // Upsert User with STAFF role and bcrypt PIN
      const passwordHash = staffPin ? await hashPassword(staffPin) : null
      const existingUser = await findUserByPhone(cleanPhone)

      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: name.trim(),
            role: 'STAFF',
            status: 'ACTIVE',
            ...(passwordHash ? { passwordHash } : {}),
            ...(existingUser.organizationId ? {} : { organizationId: orgId }),
          },
        })
      } else {
        await prisma.user.create({
          data: {
            phone: tenDigit || cleanPhone || phone.trim(),
            name: name.trim(),
            role: 'STAFF',
            status: 'ACTIVE',
            passwordHash,
            organizationId: orgId,
          },
        })
      }
    } catch (syncErr) {
      console.error('Error syncing staff to Prisma:', syncErr)
    }

    const addedStaff = await findUserByPhone(newStaff.phone)
    await notifyUsers({
      orgId,
      roles: ['admin'],
      userIds: addedStaff ? [addedStaff.id] : [],
      excludeUserId: user.id,
      title: `Staff added: ${newStaff.name}`,
      message: `${newStaff.name} joined as ${newStaff.role}.`,
      type: 'STAFF',
      event: 'staff-added',
      referenceType: 'STAFF',
      referenceId: newStaff.id,
      data: { staff: newStaff },
    })

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'STAFF_CREATED',
      entityType: 'Staff',
      entityId: newStaff.id,
        details: `New staff member "${newStaff.name}" (${newStaff.role}, ₹${newStaff.salary}/mo) onboarded by ${user.name}`,
      severity: 'INFO',
      newValues: newStaff,
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    })

    return NextResponse.json({ success: true, staff: newStaff })
  } catch (err: unknown) {
    console.error('Error in POST /api/staff:', err)
    return NextResponse.json({ error: 'Failed to process staff operation' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const orgId = user.organizationId!
    const body = await request.json()
    const { id, name, role, department, phone, salary, status, shift, pin, upiId, accountNumber, ifscCode, aadhaarNumber, emergencyContact, portalAccess, startTime, endTime, supervisorName, supervisorPhone, reliefName, reliefPhone, locationPost } = body

    if (!id) return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })

    const data = getStoredStaffData(orgId)
    const staffMember = data.staff.find(s => s.id === id)
    if (!staffMember) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })

    const oldValues = { ...staffMember }
    const oldPhone = staffMember.phone
    if (name !== undefined) staffMember.name = name.trim()
    if (role !== undefined) staffMember.role = role.trim()
    if (department !== undefined) staffMember.department = department.trim()
    if (phone !== undefined) staffMember.phone = phone.trim()
    if (salary !== undefined) staffMember.salary = Number(salary)
    if (status !== undefined) staffMember.status = status
    if (shift !== undefined) staffMember.shift = shift
    if (pin !== undefined && pin.trim().length >= 4) staffMember.pin = pin.trim()
    if (upiId !== undefined) staffMember.upiId = upiId.trim()
    if (accountNumber !== undefined) staffMember.accountNumber = accountNumber.trim()
    if (ifscCode !== undefined) staffMember.ifscCode = ifscCode.trim().toUpperCase()
    if (aadhaarNumber !== undefined) staffMember.aadhaarNumber = aadhaarNumber.trim()
    if (emergencyContact !== undefined) staffMember.emergencyContact = emergencyContact.trim()
    if (portalAccess !== undefined) staffMember.portalAccess = cleanPortalAccess(portalAccess, staffMember.department)
    if (startTime !== undefined) staffMember.startTime = String(startTime).trim()
    if (endTime !== undefined) staffMember.endTime = String(endTime).trim()
    if (supervisorName !== undefined) staffMember.supervisorName = String(supervisorName).trim()
    if (supervisorPhone !== undefined) staffMember.supervisorPhone = String(supervisorPhone).trim()
    if (reliefName !== undefined) staffMember.reliefName = String(reliefName).trim()
    if (reliefPhone !== undefined) staffMember.reliefPhone = String(reliefPhone).trim()
    if (locationPost !== undefined) staffMember.locationPost = String(locationPost || '').trim()
    staffMember.updatedAt = new Date().toISOString()

    saveStoredStaffData(orgId, data)

    // Sync to Prisma (User & StaffDuty)
    try {
      const targetPhone = staffMember.phone || oldPhone
      const cleanTarget = targetPhone.replace(/\D/g, '')
      const tenDigitTarget = cleanTarget.slice(-10)

      const cat = departmentCategory(staffMember.department)

      // Update StaffDuty
      const existingDuty = await prisma.staffDuty.findFirst({
        where: {
          organizationId: orgId,
          OR: [
            { phone: targetPhone },
            { phone: oldPhone },
            { phone: cleanTarget },
            { phone: tenDigitTarget },
            { staffName: staffMember.name },
            { staffName: oldValues.name },
          ],
        },
      })

      if (locationPost !== undefined && staffMember.locationPost && staffMember.locationPost !== 'Not assigned') rememberSocietyGate(orgId, staffMember.locationPost)
      const { locationPost: storedPost, ...staffWithoutPost } = staffMember
      const dutyFields = dutyFieldsFromStaff({
        ...staffWithoutPost,
        ...(locationPost !== undefined ? { locationPost: storedPost || '' } : {}),
      }, existingDuty || undefined)
      const access = staffMember.portalAccess && staffMember.portalAccess.length
        ? staffMember.portalAccess
        : defaultPortalAccess(staffMember.department)
      const handover = (startTime !== undefined || supervisorName !== undefined || reliefName !== undefined) ? {
        supervisorName: staffMember.supervisorName || '',
        supervisorPhone: staffMember.supervisorPhone || '',
        reliefName: staffMember.reliefName || '',
        reliefPhone: staffMember.reliefPhone || '',
      } : undefined
      const dutyNotes = notesWithAccess(existingDuty?.notes, access, handover)
      const clock = {
        ...(staffMember.startTime !== undefined ? { startTime: staffMember.startTime } : {}),
        ...(staffMember.endTime !== undefined ? { endTime: staffMember.endTime } : {}),
      }
      if (existingDuty) {
        await prisma.staffDuty.update({
          where: { id: existingDuty.id },
          data: { ...dutyFields, ...clock, phone: targetPhone, category: cat, notes: dutyNotes, ...(locationPost !== undefined ? { blockName: staffMember.locationPost || null } : {}) },
        })
      } else {
        await prisma.staffDuty.create({
          data: {
            organizationId: orgId,
            ...dutyFields,
            ...clock,
            phone: targetPhone,
            blockName: staffMember.locationPost || null,
            category: cat,
            notes: dutyNotes,
          },
        })
      }

      // Update User Auth
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: targetPhone },
            { phone: oldPhone },
            { phone: cleanTarget },
            { phone: tenDigitTarget },
          ],
        },
      })

      const newHash = pin && pin.trim().length >= 4 ? await hashPassword(pin.trim()) : undefined
      const phoneBlock = await societyMembershipBlock(tenDigitTarget || targetPhone, orgId)
      if (phoneBlock.error) {
        return NextResponse.json({ error: phoneBlock.error }, { status: 409 })
      }

      if (existingUser && existingUser.organizationId && existingUser.organizationId !== orgId) {
        return NextResponse.json({ error: phoneBlock.error || 'This phone already belongs to another society' }, { status: 409 })
      }

      if (existingUser) {
        const updateData: any = {
          name: staffMember.name,
          phone: tenDigitTarget || cleanTarget || targetPhone,
          role: 'STAFF',
          status: staffMember.status === 'INACTIVE' ? 'SUSPENDED' : 'ACTIVE',
        }
        if (newHash) updateData.passwordHash = newHash
        await prisma.user.update({
          where: { id: existingUser.id },
          data: updateData,
        })
      } else {
        const fallbackHash = await hashPassword(pin?.trim() || staffMember.pin || '1234')
        await prisma.user.create({
          data: {
            phone: tenDigitTarget || cleanTarget || targetPhone,
            name: staffMember.name,
            role: 'STAFF',
            status: staffMember.status === 'INACTIVE' ? 'SUSPENDED' : 'ACTIVE',
            passwordHash: fallbackHash,
            organizationId: orgId,
          },
        })
      }
    } catch (syncErr) {
      console.error('Error updating Prisma on staff patch:', syncErr)
    }

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'STAFF_UPDATED',
      entityType: 'Staff',
      entityId: staffMember.id,
      details: `Staff member "${staffMember.name}" details updated by ${user.name}${pin ? ' (Login PIN updated)' : ''}`,
      severity: 'INFO',
      oldValues,
      newValues: staffMember,
    })

    return NextResponse.json({ success: true, staff: staffMember })
  } catch (err: unknown) {
    console.error('Error in PATCH /api/staff:', err)
    return NextResponse.json({ error: 'Failed to update staff record' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const orgId = user.organizationId!
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })

    const data = getStoredStaffData(orgId)
    const idx = data.staff.findIndex(s => s.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })

    const removed = data.staff.splice(idx, 1)[0]
    saveStoredStaffData(orgId, data)

    // Sync deletion to Prisma
    try {
      const cleanP = (removed.phone || '').replace(/\D/g, '')
      const tenD = cleanP.slice(-10)

      await prisma.staffDuty.deleteMany({
        where: {
          organizationId: orgId,
          OR: [{ phone: removed.phone }, { phone: cleanP }, { phone: tenD }],
        },
      })

      await prisma.user.updateMany({
        where: {
          organizationId: orgId,
          OR: [{ phone: removed.phone }, { phone: cleanP }, { phone: tenD }],
        },
        data: { status: 'SUSPENDED' },
      })
    } catch (syncErr) {
      console.error('Error syncing staff deletion to Prisma:', syncErr)
    }

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'STAFF_DELETED',
      entityType: 'Staff',
      entityId: removed.id,
      details: `Staff member "${removed.name}" (${removed.role}) deleted by ${user.name}`,
      severity: 'WARNING',
      oldValues: removed,
    })

    return NextResponse.json({ success: true, message: 'Staff deleted' })
  } catch (err: unknown) {
    console.error('Error in DELETE /api/staff:', err)
    return NextResponse.json({ error: 'Failed to delete staff record' }, { status: 500 })
  }
}

