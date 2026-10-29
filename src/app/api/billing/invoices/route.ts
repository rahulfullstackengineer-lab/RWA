import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || undefined
    const status = searchParams.get('status') || undefined
    const unitId = searchParams.get('unitId') || undefined
    const invoiceId = searchParams.get('id') || undefined

    let orgId = searchParams.get('orgId') || request.headers.get('x-active-org-id') || user.organizationId
    if (!orgId) {
      const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
      orgId = firstOrg?.id || null
    }

    if (!orgId) {
      return NextResponse.json({ error: 'No society organization selected' }, { status: 400 })
    }

    // STRICT RESIDENT DATA ISOLATION:
    // A resident must ONLY ever see their own flat's invoices, never all society invoices.
    const isResident = user.role === 'RESIDENT'
    let residentUnitId = user.unitId || null

    if (isResident && !residentUnitId && user.phone) {
      const cleanPhone = user.phone.replace(/[^0-9]/g, '').slice(-10)
      const matchedUnit = await prisma.unit.findFirst({
        where: {
          organizationId: orgId,
          OR: [
            { ownerPhone: { contains: cleanPhone } },
            { tenantPhone: { contains: cleanPhone } },
          ],
        },
      })
      if (matchedUnit) {
        residentUnitId = matchedUnit.id
        await prisma.user.update({
          where: { id: user.id },
          data: { unitId: matchedUnit.id },
        }).catch(() => {})
      }
    }

    // If resident has no flat linked in this society, return empty array immediately (NEVER return all flats)
    if (isResident && !residentUnitId) {
      return NextResponse.json({ invoices: [] })
    }

    // For resident, strictly override unitId to residentUnitId regardless of query params
    const filterUnitId = isResident ? residentUnitId : unitId

    // If single invoice requested by ID, enforce unit ownership if resident
    if (invoiceId && isResident) {
      const singleInv = await prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          organizationId: orgId,
          unitId: residentUnitId!,
        },
        include: {
          unit: { include: { block: true } },
          items: { include: { chargeHead: true } },
          payments: { where: { status: 'SUCCESS' } },
        },
      })
      if (!singleInv) {
        return NextResponse.json({ error: 'Invoice not found or access denied' }, { status: 404 })
      }
      return NextResponse.json({ invoice: singleInv, invoices: [singleInv] })
    }

    let statusFilter: any = undefined
    if (status && status !== 'ALL') {
      const upperStatus = status.toUpperCase()
      if (upperStatus === 'OVERDUE') {
        statusFilter = {
          balanceAmount: { gt: 0 },
          OR: [
            { status: 'OVERDUE' },
            { dueDate: { lt: new Date() } }
          ]
        }
      } else if (upperStatus === 'UNPAID' || upperStatus === 'PENDING' || upperStatus === 'DEFAULTERS') {
        statusFilter = {
          balanceAmount: { gt: 0 },
          status: { not: 'PAID' }
        }
      } else if (upperStatus === 'PAID') {
        statusFilter = {
          OR: [
            { status: 'PAID' },
            { balanceAmount: { lte: 0 } }
          ]
        }
      } else {
        statusFilter = { status }
      }
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        ...(invoiceId ? { id: invoiceId } : {}),
        ...(month && month !== 'ALL' ? { billingMonth: month } : {}),
        ...(statusFilter ? statusFilter : {}),
        ...(filterUnitId ? { unitId: filterUnitId } : {}),
      },
      include: {
        unit: {
          include: { block: true },
        },
        items: {
          include: { chargeHead: true },
        },
        payments: {
          where: { status: 'SUCCESS' },
        },
      },
      orderBy: [
        { billingMonth: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    const now = new Date()
    const enrichedInvoices = invoices.map(inv => {
      const isPastDue = inv.dueDate ? new Date(inv.dueDate) < now : false
      const isPending = (inv.balanceAmount || 0) > 0 && inv.status !== 'PAID'
      const isOverdue = isPending && (inv.status === 'OVERDUE' || isPastDue)

      let computedStatus = inv.status
      if (inv.status === 'PAID' || (inv.balanceAmount || 0) <= 0) {
        computedStatus = 'PAID'
      } else if (isOverdue) {
        computedStatus = 'OVERDUE'
      } else if (inv.status === 'PARTIALLY_PAID') {
        computedStatus = 'PARTIALLY_PAID'
      } else {
        computedStatus = 'ISSUED'
      }

      const daysOverdue = isOverdue && inv.dueDate
        ? Math.max(1, Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 0

      return {
        ...inv,
        computedStatus,
        isOverdue,
        daysOverdue,
      }
    })

    return NextResponse.json({ invoices: enrichedInvoices })
  } catch (err: unknown) {
    console.error('Invoices GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

function resolveMonthsList(body: any): string[] {
  if (Array.isArray(body.billingMonths) && body.billingMonths.length > 0) {
    return (Array.from(new Set(body.billingMonths.map((m: any) => String(m).trim()))) as string[]).filter(Boolean).sort()
  }
  if (body.startMonth && body.endMonth) {
    const [startYear, startMonth] = body.startMonth.split('-').map(Number)
    const [endYear, endMonth] = body.endMonth.split('-').map(Number)
    const months: string[] = []
    let curY = startYear
    let curM = startMonth
    while (curY < endYear || (curY === endYear && curM <= endMonth)) {
      months.push(`${curY}-${String(curM).padStart(2, '0')}`)
      curM++
      if (curM > 12) {
        curM = 1
        curY++
      }
    }
    return months
  }
  if (body.billingMonth) {
    return [String(body.billingMonth).trim()]
  }
  return []
}

// Generate batch monthly invoices with customizable amounts, calculation models, multi-month / advance billing support, overwrite & Socket.io notifications
export async function POST(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const {
      dueDays = 15,
      dueDate: inputDueDate,
      model = 'FIXED_FLAT',
      baseAmount = 2500,
      ratePerSqft = 2.5,
      categoryRates = {},
      description = 'Monthly Society Maintenance & Operational Charges',
      lateFee = 0,
      overwriteExisting = false,
    } = body

    const monthsToProcess = resolveMonthsList(body)

    if (monthsToProcess.length === 0) {
      return NextResponse.json(
        { error: 'At least one billing month (YYYY-MM) is required. You can select single or multiple advance months.' },
        { status: 400 }
      )
    }

    let orgId = body.organizationId || request.headers.get('x-active-org-id') || user.organizationId
    if (!orgId) {
      const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
      orgId = firstOrg?.id || null
    }

    if (!orgId) {
      return NextResponse.json({ error: 'No society organization selected' }, { status: 400 })
    }

    // Fetch all units in society
    const units = await prisma.unit.findMany({
      where: { organizationId: orgId },
      include: { block: true },
    })

    if (units.length === 0) {
      return NextResponse.json({ error: 'No units registered in this society yet' }, { status: 400 })
    }

    // Active charge heads if model is CHARGE_HEADS
    const charges = await prisma.chargeHead.findMany({
      where: { organizationId: orgId, isActive: true },
    })

    let totalCreated = 0
    let totalUpdated = 0
    let totalSkipped = 0
    let overallTotalDemand = 0

    const allProcessedInvoices: Array<{
      id: string
      invoiceNumber: string
      unitId: string
      unitNumber: string
      amount: number
      billingMonth: string
      dueDate: Date
    }> = []

    // Process each month in the batch (e.g. October 2026, or January 2027 & February 2027 in advance)
    for (const billingMonth of monthsToProcess) {
      // Calculate due date for this specific month
      let dueDate: Date
      if (monthsToProcess.length === 1 && inputDueDate) {
        dueDate = new Date(inputDueDate)
      } else {
        const [year, monthNum] = billingMonth.split('-').map(Number)
        dueDate = new Date(year, monthNum - 1, Number(dueDays) || 15)
      }

      for (const unit of units) {
        // 1. Calculate Items & Total Amount based on selected model
        let unitTotal = 0
        let itemsData: Array<{
          chargeHeadId?: string | null
          description: string
          amount: number
          gstPercent: number
          gstAmount: number
          totalAmount: number
        }> = []

        if (model === 'CHARGE_HEADS' && charges.length > 0) {
          itemsData = charges.map((charge) => {
            let headAmount = charge.amount
            if (charge.basis === 'PER_SQFT' && unit.areaSqft) {
              headAmount = charge.amount * unit.areaSqft
            }
            const gstAmount = Math.round(((headAmount * charge.gstPercent) / 100) * 100) / 100
            const itemTotal = headAmount + gstAmount
            unitTotal += itemTotal

            return {
              chargeHeadId: charge.id,
              description: `${charge.name} (${billingMonth})`,
              amount: headAmount,
              gstPercent: charge.gstPercent,
              gstAmount,
              totalAmount: itemTotal,
            }
          })
        } else if (model === 'PER_SQFT') {
          const area = unit.areaSqft || 1000
          const rate = Number(ratePerSqft) || 2.5
          unitTotal = Math.round(rate * area)
          itemsData = [
            {
              description: `${description} (${billingMonth} · ${area} sq.ft @ ₹${rate}/sq.ft)`,
              amount: unitTotal,
              gstPercent: 0,
              gstAmount: 0,
              totalAmount: unitTotal,
            },
          ]
        } else if (model === 'CATEGORY' && categoryRates && typeof categoryRates === 'object') {
          let catRate = Number(baseAmount) || 2500
          let matchedCat = 'Standard Flat'
          for (const [k, v] of Object.entries(categoryRates)) {
            if (
              unit.unitNumber.toUpperCase().includes(k.toUpperCase()) ||
              (unit.block?.name && unit.block.name.toUpperCase().includes(k.toUpperCase())) ||
              (unit.notes && unit.notes.toUpperCase().includes(k.toUpperCase()))
            ) {
              catRate = Number(v) || catRate
              matchedCat = k
              break
            }
          }
          unitTotal = catRate
          itemsData = [
            {
              description: `${description} (${billingMonth} · ${matchedCat})`,
              amount: unitTotal,
              gstPercent: 0,
              gstAmount: 0,
              totalAmount: unitTotal,
            },
          ]
        } else {
          // FIXED_FLAT (default)
          unitTotal = Number(baseAmount) || 2500
          itemsData = [
            {
              description: `${description} (${billingMonth})`,
              amount: unitTotal,
              gstPercent: 0,
              gstAmount: 0,
              totalAmount: unitTotal,
            },
          ]
        }

        // Check for existing invoice for this unit and month
        const existing = await prisma.invoice.findFirst({
          where: {
            organizationId: orgId,
            unitId: unit.id,
            billingMonth,
          },
        })

        if (existing) {
          if (overwriteExisting && existing.status !== 'PAID') {
            const newBalance = Math.max(0, unitTotal - existing.paidAmount)
            const newStatus = newBalance === 0 ? 'PAID' : (existing.paidAmount > 0 ? 'PARTIALLY_PAID' : 'ISSUED')

            await prisma.invoiceItem.deleteMany({
              where: { invoiceId: existing.id },
            })

            const updated = await prisma.invoice.update({
              where: { id: existing.id },
              data: {
                totalAmount: unitTotal,
                balanceAmount: newBalance,
                dueDate,
                status: newStatus,
                lateFee: Number(lateFee) || 0,
                items: {
                  create: itemsData,
                },
              },
            })

            totalUpdated++
            overallTotalDemand += unitTotal
            allProcessedInvoices.push({
              id: updated.id,
              invoiceNumber: updated.invoiceNumber,
              unitId: unit.id,
              unitNumber: unit.unitNumber,
              amount: unitTotal,
              billingMonth,
              dueDate,
            })
          } else {
            totalSkipped++
          }
          continue
        }

        // Create new invoice
        const orgPrefix = orgId.slice(-4).toUpperCase()
        const invoiceNumber = `INV-${orgPrefix}-${billingMonth.replace('-', '')}-${unit.unitNumber.replace(/[^A-Za-z0-9]/g, '')}`

        const created = await prisma.invoice.create({
          data: {
            organizationId: orgId,
            unitId: unit.id,
            invoiceNumber,
            billingMonth,
            dueDate,
            status: 'ISSUED',
            totalAmount: unitTotal,
            paidAmount: 0,
            balanceAmount: unitTotal,
            lateFee: Number(lateFee) || 0,
            issuedAt: new Date(),
            items: {
              create: itemsData,
            },
          },
        })

        totalCreated++
        overallTotalDemand += unitTotal
        allProcessedInvoices.push({
          id: created.id,
          invoiceNumber: created.invoiceNumber,
          unitId: unit.id,
          unitNumber: unit.unitNumber,
          amount: unitTotal,
          billingMonth,
          dueDate,
        })
      }
    }

    // 2. Create Database Notifications for all related residents & admin
    const societyUsers = await prisma.user.findMany({
      where: { organizationId: orgId },
      include: { unit: true },
    })

    const notifsToCreate: Array<{
      organizationId: string
      userId: string
      title: string
      message: string
      type: string
      referenceType: string
      referenceId: string | null
    }> = []

    const isMultiMonth = monthsToProcess.length > 1
    const monthsTitle = isMultiMonth
      ? `Advance Bills: ${monthsToProcess.length} Months (${monthsToProcess.join(', ')})`
      : `New Maintenance Bill: ${monthsToProcess[0]}`

    for (const u of societyUsers) {
      if (u.role === 'RESIDENT' || u.unitId) {
        const userInvoices = allProcessedInvoices.filter((inv) => inv.unitId === u.unitId)
        const totalUserBill = userInvoices.reduce((sum, i) => sum + i.amount, 0) || (Number(baseAmount) || 2500) * monthsToProcess.length
        const firstInvId = userInvoices[0]?.id || null

        const message = isMultiMonth
          ? `Advance maintenance bills for ${monthsToProcess.length} months (${monthsToProcess.join(', ')}) totaling ₹${totalUserBill.toLocaleString('en-IN')} have been issued for Flat ${u.unit?.unitNumber || ''}.`
          : `Your maintenance bill for ${monthsToProcess[0]} of ₹${totalUserBill.toLocaleString('en-IN')} has been generated for Flat ${u.unit?.unitNumber || ''}. Due Date: ${userInvoices[0]?.dueDate?.toLocaleDateString('en-IN') || ''}.`

        notifsToCreate.push({
          organizationId: orgId,
          userId: u.id,
          title: `📄 ${monthsTitle}`,
          message,
          type: 'BILL',
          referenceType: 'INVOICE',
          referenceId: firstInvId,
        })
      }
    }

    // Also notify the admin
    notifsToCreate.push({
      organizationId: orgId,
      userId: user.id,
      title: `⚡ Batch Invoices Issued (${monthsToProcess.length} Cycles: ${monthsToProcess.join(', ')})`,
      message: `Batch generation complete: ${totalCreated} created, ${totalUpdated} updated (${totalSkipped} skipped) across ${monthsToProcess.length} month(s). Total Demand: ₹${overallTotalDemand.toLocaleString('en-IN')}. Push notifications dispatched.`,
      type: 'BILL',
      referenceType: 'INVOICE',
      referenceId: allProcessedInvoices[0]?.id || null,
    })

    if (notifsToCreate.length > 0) {
      try {
        await prisma.notification.createMany({
          data: notifsToCreate,
        })
      } catch (notifErr) {
        console.warn('Failed to bulk-create notifications:', notifErr)
      }
    }

    // 3. Emit Real-time Socket.io Notifications
    const io = (global as any).__io
    if (io) {
      // Broadcast to society room
      io.to(`org:${orgId}`).emit('bills-generated', {
        organizationId: orgId,
        billingMonths: monthsToProcess,
        billingMonth: monthsToProcess[0],
        monthCount: monthsToProcess.length,
        totalInvoices: totalCreated + totalUpdated,
        createdCount: totalCreated,
        updatedCount: totalUpdated,
        skippedCount: totalSkipped,
        totalDemand: overallTotalDemand,
        model,
        timestamp: new Date().toISOString(),
      })

      // Send targeted notifications to each user room
      for (const u of societyUsers) {
        const userInvoices = allProcessedInvoices.filter((inv) => inv.unitId === u.unitId)
        const totalUserBill = userInvoices.reduce((sum, i) => sum + i.amount, 0) || (Number(baseAmount) || 2500) * monthsToProcess.length
        io.to(`user:${u.id}`).emit('new-bill-generated', {
          organizationId: orgId,
          unitNumber: u.unit?.unitNumber || userInvoices[0]?.unitNumber || 'Your Flat',
          amount: totalUserBill,
          billingMonths: monthsToProcess,
          billingMonth: monthsToProcess[0],
          monthCount: monthsToProcess.length,
          title: `📄 ${monthsTitle}`,
          message: `Bills for ${monthsToProcess.length} month(s) totaling ₹${totalUserBill.toLocaleString('en-IN')} issued.`,
        })
      }
    }

    // 4. Log Immutable Audit Trail Event
    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'BILL_BATCH_GENERATED',
      entityType: 'InvoiceBatch',
      entityId: `Cycles-${monthsToProcess.join(',')}`,
      details: `Generated ${totalCreated} bills, updated ${totalUpdated} bills for ${monthsToProcess.length} cycle(s) [${monthsToProcess.join(', ')}] totaling ₹${overallTotalDemand.toLocaleString('en-IN')}`,
      severity: 'INFO',
      newValues: {
        billingMonths: monthsToProcess,
        totalCreated,
        totalUpdated,
        totalSkipped,
        overallTotalDemand,
        model,
      },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    })

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${monthsToProcess.length} month(s) [${monthsToProcess.join(', ')}]: ${totalCreated} bills created, ${totalUpdated} updated (Total Demand: ₹${overallTotalDemand.toLocaleString('en-IN')})`,
      billingMonths: monthsToProcess,
      createdCount: totalCreated,
      updatedCount: totalUpdated,
      skippedCount: totalSkipped,
      totalDemand: overallTotalDemand,
    })
  } catch (err: unknown) {
    console.error('Invoice generation error:', err)
    return NextResponse.json({ error: 'Failed to generate invoices' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { id, status, notes, paidAmount, paymentMethod = 'MANUAL_CASH', dueDate } = body

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    const existing = await prisma.invoice.findUnique({
      where: { id },
      include: { unit: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const newStatus = status || existing.status
    const isNowPaid = newStatus === 'PAID'
    const newPaidAmount = paidAmount !== undefined ? parseFloat(paidAmount) : (isNowPaid ? existing.totalAmount : existing.paidAmount)
    const newBalanceAmount = Math.max(0, existing.totalAmount - newPaidAmount)

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: newStatus,
        notes: notes !== undefined ? notes : existing.notes,
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        paidAt: isNowPaid ? new Date() : existing.paidAt,
        ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
      },
      include: {
        unit: { include: { block: true } },
        items: true,
        payments: true,
      },
    })

    // If marked PAID and no success payment exists, create a payment record
    if (isNowPaid) {
      const existingSuccessPayment = await prisma.payment.findFirst({
        where: { invoiceId: id, status: 'SUCCESS' },
      })

      if (!existingSuccessPayment) {
        await prisma.payment.create({
          data: {
            organizationId: existing.organizationId,
            invoiceId: id,
            amount: newPaidAmount,
            method: paymentMethod,
            source: 'OFFLINE_ADMIN',
            status: 'SUCCESS',
            referenceNo: `REC-${Date.now().toString(36).toUpperCase()}`,
            paidAt: new Date(),
            recordedByUserId: user.id,
            notes: notes || 'Settled by Society Admin',
          },
        })
      }
    }

    return NextResponse.json({ success: true, invoice: updated })
  } catch (err: unknown) {
    console.error('Invoice PUT error:', err)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    const existing = await prisma.invoice.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (existing.status === 'PAID') {
      return NextResponse.json({ error: 'Cannot delete a paid invoice. Void or refund it first.' }, { status: 400 })
    }

    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: id },
    })

    await prisma.invoice.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: `Invoice ${existing.invoiceNumber} deleted successfully` })
  } catch (err: unknown) {
    console.error('Invoice DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}

