import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { notifyUsers } from '@/lib/socket-server'
import { logAudit } from '@/lib/audit'
import { applyPayrollFromExpense, ensureStaffAccount, undoPayrollFromExpense } from '@/app/api/staff/route'

type StaffExpenseLink = {
  staffDutyId?: string
  staffName?: string
  staffPhone?: string
  salaryPayment?: boolean
  credited?: boolean
  paidLabel?: string
  previousSalary?: number
  previousStatus?: string
  previousLastPaid?: string | null
  previousSalaryDate?: string | null
}

function readStaffLink(notes?: string | null): StaffExpenseLink | null {
  if (!notes || !notes.trim().startsWith('{')) return null
  try {
    const parsed = JSON.parse(notes)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function expenseWhen(raw?: string | null) {
  if (!raw) return new Date()
  const parsed = new Date(String(raw).length === 10 ? `${raw}T12:00:00` : String(raw))
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function paidLabel(when: Date) {
  return when.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function phoneTail(value?: string | null) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length >= 10 ? digits.slice(-10) : ''
}

async function creditStaffSalary(orgId: string, link: StaffExpenseLink, amount: number, when: Date) {
  if (!link.staffDutyId || !link.salaryPayment) return null
  const duty = await prisma.staffDuty.findFirst({
    where: { id: link.staffDutyId, organizationId: orgId },
  })
  if (!duty) return null
  const label = paidLabel(when)
  const nextNotes: StaffExpenseLink = {
    ...link,
    staffName: duty.staffName,
    staffPhone: duty.phone,
    credited: true,
    paidLabel: label,
    previousSalary: link.previousSalary ?? duty.salaryAmount,
    previousStatus: link.previousStatus ?? duty.paymentStatus,
    previousLastPaid: link.previousLastPaid ?? duty.lastPaidDate,
    previousSalaryDate: link.previousSalaryDate ?? duty.salaryDate,
  }
  await prisma.staffDuty.update({
    where: { id: duty.id },
    data: {
      salaryAmount: amount > 0 ? amount : duty.salaryAmount,
      paymentStatus: 'PAID',
      lastPaidDate: label,
      salaryDate: label,
    },
  })
  const tail = phoneTail(duty.phone)
  if (tail) {
    const people = await prisma.user.findMany({
      where: { organizationId: orgId },
      select: { id: true, phone: true },
    })
    const staffUser = people.find((person) => phoneTail(person.phone) === tail)
    if (staffUser) {
      await notifyUsers({
        orgId,
        userIds: [staffUser.id],
        title: 'Salary credited',
        message: `₹${amount.toLocaleString('en-IN')} has been recorded as salary for ${duty.staffName} on ${label}.`,
        type: 'SALARY',
        event: 'staff-salary-credited',
        referenceType: 'STAFF_DUTY',
        referenceId: duty.id,
      }).catch(() => {})
    }
  }
  return { duty, notes: JSON.stringify(nextNotes), paidLabel: label }
}

async function restoreStaffSalary(orgId: string, link: StaffExpenseLink | null) {
  if (!link?.staffDutyId || !link.credited) return
  const duty = await prisma.staffDuty.findFirst({
    where: { id: link.staffDutyId, organizationId: orgId },
  })
  if (!duty || duty.lastPaidDate !== link.paidLabel) return
  await prisma.staffDuty.update({
    where: { id: duty.id },
    data: {
      salaryAmount: typeof link.previousSalary === 'number' ? link.previousSalary : duty.salaryAmount,
      paymentStatus: link.previousStatus || '',
      lastPaidDate: link.previousLastPaid || '',
      salaryDate: link.previousSalaryDate || '',
    },
  })
}

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const orgId = user.organizationId
    if (!orgId) {
      return NextResponse.json({ expenses: [] })
    }

    const status = searchParams.get('status') || undefined
    const recurring = searchParams.get('recurring')
    const isRecurringFilter = recurring === 'true' ? true : (recurring === 'false' ? false : undefined)

    const expenses = await prisma.expense.findMany({
      where: {
        organizationId: orgId,
        ...(status ? { status } : {}),
        ...(isRecurringFilter !== undefined ? { isRecurring: isRecurringFilter } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ expenses })
  } catch (err: unknown) {
    console.error('Expenses GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const {
      title,
      amount,
      category = 'Maintenance',
      vendorName = 'General Vendor',
      description,
      isRecurring = false,
      recurringDay = 1,
      recurringMonth = null,
      staffDutyId,
      salaryPayment = false,
      date,
      expenseDate,
      newPerson,
    } = body

    if (!title || !amount) {
      return NextResponse.json({ error: 'Title and amount are required' }, { status: 400 })
    }

    const orgId = user.organizationId!
    const numAmount = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0
    const when = expenseWhen(date || expenseDate)
    const paySalary = Boolean(salaryPayment)
    let linkedDutyId = staffDutyId ? String(staffDutyId) : ''
    let accountCreated = false
    if (!linkedDutyId && newPerson && (newPerson.name || newPerson.phone)) {
      const ensured = await ensureStaffAccount(orgId, {
        name: newPerson.name,
        phone: newPerson.phone,
        department: newPerson.department || (category === 'Sanitation' ? 'Housekeeping' : (category === 'Horticulture' ? 'Gardening' : (category === 'Maintenance' || category === 'Electrical' ? 'Maintenance' : 'Security'))),
        salary: paySalary ? numAmount : 0,
        role: newPerson.role || 'Staff',
      })
      if (ensured.error || !ensured.dutyId) {
        return NextResponse.json({ error: ensured.error || 'Could not create this account' }, { status: 400 })
      }
      linkedDutyId = ensured.dutyId
      accountCreated = Boolean(ensured.created)
    }
    let linkedDuty: { id: string; staffName: string; phone: string; salaryAmount: number; paymentStatus: string; lastPaidDate: string | null; salaryDate: string | null } | null = null
    if (linkedDutyId) {
      linkedDuty = await prisma.staffDuty.findFirst({
        where: { id: linkedDutyId, organizationId: orgId },
      })
      if (!linkedDuty) {
        return NextResponse.json({ error: 'Choose a staff member from this society' }, { status: 400 })
      }
    }
    if (paySalary && !linkedDuty) {
      return NextResponse.json({ error: 'Choose the staff member this salary is for' }, { status: 400 })
    }

    const link: StaffExpenseLink | null = linkedDuty ? {
      staffDutyId: linkedDuty.id,
      staffName: linkedDuty.staffName,
      staffPhone: linkedDuty.phone,
      salaryPayment: paySalary,
      previousSalary: linkedDuty.salaryAmount,
      previousStatus: linkedDuty.paymentStatus,
      previousLastPaid: linkedDuty.lastPaidDate,
      previousSalaryDate: linkedDuty.salaryDate,
    } : null

    let credit: { notes: string; paidLabel: string } | null = null
    if (link && paySalary) {
      credit = await creditStaffSalary(orgId, link, numAmount, when)
    }

    const expense = await prisma.expense.create({
      data: {
        organizationId: orgId,
        title: title.trim(),
        amount: numAmount,
        totalAmount: numAmount,
        category,
        vendorName: (vendorName || linkedDuty?.staffName || 'General Vendor').trim(),
        description: description?.trim() || null,
        billDate: when,
        paidDate: paySalary ? when : null,
        paidBy: paySalary ? (user.name || 'Admin') : null,
        status: paySalary ? 'PAID' : 'PENDING_APPROVAL',
        notes: credit?.notes || (link ? JSON.stringify(link) : null),
        createdBy: user.name,
        isRecurring: Boolean(isRecurring),
        recurringDay: Number(recurringDay) || 1,
        recurringMonth: recurringMonth || null,
      },
    })

    if (paySalary && linkedDuty) {
      applyPayrollFromExpense(orgId, { phone: linkedDuty.phone, name: linkedDuty.staffName }, {
        amount: numAmount,
        when,
        paidBy: user.name || 'Admin',
        expenseId: expense.id,
      })
    }

    await notifyUsers({
      orgId,
      roles: ['admin'],
      excludeUserId: user.id,
      title: `Expense recorded: ${expense.title}`,
      message: `₹${Number(expense.totalAmount).toLocaleString('en-IN')} under ${expense.category}`,
      type: 'EXPENSE',
      event: 'new-expense-recorded',
      referenceType: 'EXPENSE',
      referenceId: expense.id,
      data: {
        id: expense.id,
        title: expense.title,
        amount: expense.totalAmount,
        category: expense.category,
        vendorName: expense.vendorName,
        status: expense.status,
      },
    })

    // Log Immutable Audit Trail Event
    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'EXPENSE_RECORDED',
      entityType: 'Expense',
      entityId: expense.id,
      details: `Expense voucher recorded for ₹${expense.totalAmount.toLocaleString('en-IN')}: "${expense.title}" (${expense.category}) to ${expense.vendorName}`,
      severity: 'INFO',
      newValues: {
        expenseId: expense.id,
        amount: expense.totalAmount,
        category: expense.category,
        vendorName: expense.vendorName,
        title: expense.title,
      },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    })

    return NextResponse.json({
      success: true,
      expense,
      staffCredited: credit ? { name: linkedDuty?.staffName, paidLabel: credit.paidLabel } : null,
      accountCreated,
      accountName: linkedDuty?.staffName || null,
    })
  } catch (err: unknown) {
    console.error('Expenses POST error:', err)
    return NextResponse.json({ error: 'Failed to record expense' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Expense ID and status are required' }, { status: 400 })
    }

    const existingExpense = await prisma.expense.findFirst({
      where: { id, organizationId: user.organizationId || '__none__' },
    })
    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const link = readStaffLink(existingExpense.notes)
    const payrollOrgId = user.organizationId || existingExpense.organizationId
    if (status === 'REJECTED') {
      await restoreStaffSalary(payrollOrgId, link)
      undoPayrollFromExpense(payrollOrgId, existingExpense.id)
    }

    let notesUpdate: string | undefined
    let paidOn: Date | undefined
    if (status === 'PAID' && link?.salaryPayment && link.staffDutyId) {
      paidOn = existingExpense.billDate || new Date()
      const credit = await creditStaffSalary(
        user.organizationId || existingExpense.organizationId,
        link,
        Number(existingExpense.totalAmount || existingExpense.amount || 0),
        paidOn,
      )
      if (credit) notesUpdate = credit.notes
      applyPayrollFromExpense(payrollOrgId, { phone: link.staffPhone, name: link.staffName }, {
        amount: Number(existingExpense.totalAmount || existingExpense.amount || 0),
        when: paidOn,
        paidBy: user.name || 'Admin',
        expenseId: existingExpense.id,
      })
    }

    const updated = await prisma.expense.update({
      where: { id: existingExpense.id },
      data: {
        status,
        approvedBy: status === 'APPROVED' || status === 'PAID' ? (user.name || 'Admin') : (status === 'REJECTED' ? null : undefined),
        paidDate: status === 'PAID' ? (paidOn || new Date()) : undefined,
        paidBy: status === 'PAID' ? (user.name || 'Admin') : undefined,
        notes: notesUpdate || (body.reason ? String(body.reason) : undefined),
      },
    })

    const targetOrgId = user.organizationId || updated.organizationId
    if (targetOrgId) {
      await notifyUsers({
        orgId: targetOrgId,
        roles: ['admin'],
        excludeUserId: user.id,
        title: `Expense ${updated.status}: ${updated.title}`,
        message: `₹${Number(updated.totalAmount).toLocaleString('en-IN')} is now ${updated.status}.`,
        type: 'EXPENSE',
        event: 'expense-status-updated',
        referenceType: 'EXPENSE',
        referenceId: updated.id,
        data: { id: updated.id, title: updated.title, status: updated.status, amount: updated.totalAmount },
      })
    }

    // Audit log
    await logAudit({
      organizationId: updated.organizationId,
      userId: user.id,
      action: status === 'APPROVED' ? 'EXPENSE_APPROVED' : (status === 'REJECTED' ? 'EXPENSE_REJECTED' : 'EXPENSE_UPDATED'),
      entityType: 'Expense',
      entityId: updated.id,
      details: `Expense voucher "${updated.title}" marked as ${status} by ${user.name || 'Admin'}`,
      severity: 'INFO',
      newValues: { status: updated.status, approvedBy: updated.approvedBy },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    }).catch(() => {})

    return NextResponse.json({ success: true, expense: updated })
  } catch (err: unknown) {
    console.error('Expenses PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update expense: ' + (err instanceof Error ? err.message : String(err)) }, { status: 500 })
  }
}

