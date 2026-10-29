import { NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { emitLiveSocketEvent } from '@/lib/socket-server'
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
  lastPaidMonth: string
  lastPaidDate?: string
  upiId?: string
  accountNumber?: string
  ifscCode?: string
  aadhaarNumber?: string
  emergencyContact?: string
  createdAt: string
  updatedAt?: string
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

function getDefaultStaff(): StaffRecord[] {
  return [
    {
      id: 'STF-001',
      name: 'Ramesh Kumar',
      role: 'Security Guard (Day)',
      department: 'Security',
      phone: '+91 94001 12345',
      salary: 12000,
      salaryType: 'MONTHLY',
      joiningDate: '2020-01-10',
      status: 'ACTIVE',
      shift: 'DAY',
      lastPaidMonth: 'Sep 2026',
      upiId: 'ramesh.guard@upi',
      aadhaarNumber: 'XXXX-XXXX-4589',
      createdAt: '2020-01-10T00:00:00.000Z',
    },
    {
      id: 'STF-002',
      name: 'Suresh Singh',
      role: 'Security Guard (Night)',
      department: 'Security',
      phone: '+91 94002 23456',
      salary: 12000,
      salaryType: 'MONTHLY',
      joiningDate: '2021-03-01',
      status: 'ACTIVE',
      shift: 'NIGHT',
      lastPaidMonth: 'Sep 2026',
      upiId: 'suresh.singh@upi',
      aadhaarNumber: 'XXXX-XXXX-8921',
      createdAt: '2021-03-01T00:00:00.000Z',
    },
    {
      id: 'STF-003',
      name: 'Meena Bai',
      role: 'Sweeper / Housekeeping',
      department: 'Housekeeping',
      phone: '+91 94003 34567',
      salary: 8500,
      salaryType: 'MONTHLY',
      joiningDate: '2019-06-15',
      status: 'ACTIVE',
      shift: 'GENERAL',
      lastPaidMonth: 'Sep 2026',
      upiId: 'meenabai@okhdfcbank',
      aadhaarNumber: 'XXXX-XXXX-3412',
      createdAt: '2019-06-15T00:00:00.000Z',
    },
    {
      id: 'STF-004',
      name: 'Rajiv Mali',
      role: 'Gardener & Groundskeeper',
      department: 'Gardening',
      phone: '+91 94004 45678',
      salary: 7000,
      salaryType: 'MONTHLY',
      joiningDate: '2022-02-10',
      status: 'ACTIVE',
      shift: 'DAY',
      lastPaidMonth: 'Sep 2026',
      upiId: 'rajiv.mali@upi',
      aadhaarNumber: 'XXXX-XXXX-1934',
      createdAt: '2022-02-10T00:00:00.000Z',
    },
    {
      id: 'STF-005',
      name: 'Prem Lal',
      role: 'Watchman / Gate Supervisor',
      department: 'Security',
      phone: '+91 94005 56789',
      salary: 10000,
      salaryType: 'MONTHLY',
      joiningDate: '2018-08-01',
      status: 'ACTIVE',
      shift: 'ROTATIONAL',
      lastPaidMonth: 'Oct 2026',
      lastPaidDate: '2026-10-05T10:30:00.000Z',
      upiId: 'premlal@ybl',
      aadhaarNumber: 'XXXX-XXXX-9022',
      createdAt: '2018-08-01T00:00:00.000Z',
    },
  ]
}

function getDefaultPayments(): StaffSalaryPayment[] {
  return [
    {
      id: 'PAY-STF-001',
      staffId: 'STF-005',
      staffName: 'Prem Lal',
      role: 'Watchman / Gate Supervisor',
      month: 'Oct 2026',
      amount: 10000,
      paymentMethod: 'UPI',
      transactionRef: 'UPI-RWA-10052026',
      paidAt: '2026-10-05T10:30:00.000Z',
      paidBy: 'Administrator',
      notes: 'October 2026 regular monthly salary disbursement',
    },
  ]
}

function getStoredStaffData(orgId: string): OrgStaffStore {
  try {
    if (fs.existsSync(STAFF_DATA_PATH)) {
      const allData = JSON.parse(fs.readFileSync(STAFF_DATA_PATH, 'utf-8'))
      if (allData && allData[orgId]) {
        const orgEntry = allData[orgId]
        return {
          staff: Array.isArray(orgEntry.staff) ? orgEntry.staff : [],
          payments: Array.isArray(orgEntry.payments) ? orgEntry.payments : [],
        }
      }
    }
  } catch (e) {
    console.error('Error reading staff store:', e)
  }

  return {
    staff: [],
    payments: [],
  }
}

function saveStoredStaffData(orgId: string, data: OrgStaffStore) {
  try {
    let allData: any = {}
    if (fs.existsSync(STAFF_DATA_PATH)) {
      try {
        allData = JSON.parse(fs.readFileSync(STAFF_DATA_PATH, 'utf-8'))
      } catch (e) {}
    }
    allData[orgId] = data
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
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const orgId = user.organizationId!
    const data = getStoredStaffData(orgId)
    const metrics = calculateStaffMetrics(data.staff, 'Oct 2026')

    return NextResponse.json({
      staff: data.staff,
      payments: data.payments,
      metrics,
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

      emitLiveSocketEvent('staff-salary-paid', { payment: paymentRecord, staff: staffMember }, { orgId })

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
      upiId = '',
      accountNumber = '',
      ifscCode = '',
      aadhaarNumber = '',
      emergencyContact = '',
    } = body

    if (!name || !role || !phone || salary === undefined) {
      return NextResponse.json({ error: 'Name, role, phone number, and salary amount are required' }, { status: 400 })
    }

    const newStaffId = `STF-${Math.floor(100 + Math.random() * 900)}`

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
      lastPaidMonth: 'Sep 2026',
      upiId: upiId.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      aadhaarNumber: aadhaarNumber.trim(),
      emergencyContact: emergencyContact.trim(),
      createdAt: new Date().toISOString(),
    }

    data.staff.unshift(newStaff)
    saveStoredStaffData(orgId, data)

    emitLiveSocketEvent('staff-added', { staff: newStaff }, { orgId })

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
    const { id, name, role, department, phone, salary, status, shift, upiId, accountNumber, ifscCode, aadhaarNumber, emergencyContact } = body

    if (!id) return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })

    const data = getStoredStaffData(orgId)
    const staffMember = data.staff.find(s => s.id === id)
    if (!staffMember) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })

    const oldValues = { ...staffMember }
    if (name !== undefined) staffMember.name = name.trim()
    if (role !== undefined) staffMember.role = role.trim()
    if (department !== undefined) staffMember.department = department.trim()
    if (phone !== undefined) staffMember.phone = phone.trim()
    if (salary !== undefined) staffMember.salary = Number(salary)
    if (status !== undefined) staffMember.status = status
    if (shift !== undefined) staffMember.shift = shift
    if (upiId !== undefined) staffMember.upiId = upiId.trim()
    if (accountNumber !== undefined) staffMember.accountNumber = accountNumber.trim()
    if (ifscCode !== undefined) staffMember.ifscCode = ifscCode.trim().toUpperCase()
    if (aadhaarNumber !== undefined) staffMember.aadhaarNumber = aadhaarNumber.trim()
    if (emergencyContact !== undefined) staffMember.emergencyContact = emergencyContact.trim()
    staffMember.updatedAt = new Date().toISOString()

    saveStoredStaffData(orgId, data)

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'STAFF_UPDATED',
      entityType: 'Staff',
      entityId: staffMember.id,
      details: `Staff member "${staffMember.name}" details updated by ${user.name}`,
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
