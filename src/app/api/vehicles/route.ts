import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { emitLiveSocketEvent } from '@/lib/socket-server'

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim().toLowerCase() || ''
    const typeFilter = searchParams.get('type') || ''
    const slotFilter = searchParams.get('slotStatus') || '' // 'allocated', 'unallocated'

    let orgId = searchParams.get('orgId') || request.headers.get('x-active-org-id') || user.organizationId
    if (!orgId) {
      const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
      orgId = firstOrg?.id || null
    }

    if (!orgId) {
      return NextResponse.json({ error: 'No society organization selected' }, { status: 400 })
    }

    const unitId = searchParams.get('unitId')?.trim() || undefined
    const unitNumber = searchParams.get('unitNumber')?.trim() || undefined

    // Fetch all vehicles belonging to units in this organization
    const vehicles = await prisma.vehicle.findMany({
      where: {
        unit: {
          organizationId: orgId,
          ...(unitNumber ? { unitNumber } : {}),
        },
        ...(unitId ? { unitId } : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(slotFilter === 'allocated' ? { parkingSlot: { not: null } } : {}),
        ...(slotFilter === 'unallocated' ? { OR: [{ parkingSlot: null }, { parkingSlot: '' }] } : {}),
      },
      include: {
        unit: {
          include: {
            block: true,
          },
        },
      },
      orderBy: [
        { parkingSlot: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    // Filter by search if provided
    const filtered = search
      ? vehicles.filter((v) => {
          const reg = (v.registrationNo || '').toLowerCase()
          const make = (v.make || '').toLowerCase()
          const model = (v.model || '').toLowerCase()
          const color = (v.color || '').toLowerCase()
          const slot = (v.parkingSlot || '').toLowerCase()
          const flat = (v.unit?.unitNumber || '').toLowerCase()
          const owner = (v.unit?.ownerName || '').toLowerCase()
          const tenant = (v.unit?.tenantName || '').toLowerCase()
          return (
            reg.includes(search) ||
            make.includes(search) ||
            model.includes(search) ||
            color.includes(search) ||
            slot.includes(search) ||
            flat.includes(search) ||
            owner.includes(search) ||
            tenant.includes(search)
          )
        })
      : vehicles

    // Aggregate statistics
    const total = vehicles.length
    const cars = vehicles.filter((v) => (v.type || '').toUpperCase() === 'CAR').length
    const bikes = vehicles.filter((v) => ['BIKE', 'TWO_WHEELER', 'SCOOTER'].includes((v.type || '').toUpperCase())).length
    const evs = vehicles.filter((v) => (v.type || '').toUpperCase() === 'EV').length
    const slotsAllocated = vehicles.filter((v) => v.parkingSlot && v.parkingSlot.trim() !== '').length
    const unallocated = total - slotsAllocated

    return NextResponse.json({
      success: true,
      vehicles: filtered,
      stats: {
        total,
        cars,
        bikes,
        evs,
        slotsAllocated,
        unallocated,
      },
    })
  } catch (err: any) {
    console.error('Error fetching vehicles:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { unitId, unitNumber, type, registrationNo, make, model, color, parkingSlot } = body

    if (!registrationNo || !registrationNo.trim()) {
      return NextResponse.json({ error: 'Vehicle Registration Number is required' }, { status: 400 })
    }

    let targetUnitId = unitId

    // If unitId is not provided, look up by unitNumber
    if (!targetUnitId && unitNumber) {
      let orgId = body.organizationId || request.headers.get('x-active-org-id') || user.organizationId
      if (!orgId) {
        const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: 'desc' } })
        orgId = firstOrg?.id || null
      }

      if (orgId) {
        const unit = await prisma.unit.findFirst({
          where: {
            organizationId: orgId,
            unitNumber: unitNumber.trim(),
          },
        })
        if (unit) {
          targetUnitId = unit.id
        }
      }
    }

    if (!targetUnitId) {
      return NextResponse.json({ error: 'Please select a valid Flat / Unit for this vehicle' }, { status: 400 })
    }

    const targetUnit = await prisma.unit.findUnique({
      where: { id: targetUnitId },
    })

    if (!targetUnit) {
      return NextResponse.json({ error: 'Selected Flat / Unit does not exist' }, { status: 404 })
    }

    // Clean and normalize inputs
    const cleanReg = registrationNo.trim().toUpperCase()
    const cleanSlot = parkingSlot && parkingSlot.trim() ? parkingSlot.trim().toUpperCase() : null
    const cleanType = (type || 'CAR').trim().toUpperCase()

    // Check if registration number already registered in this society
    const existing = await prisma.vehicle.findFirst({
      where: {
        registrationNo: cleanReg,
        unit: {
          organizationId: targetUnit.organizationId,
        },
      },
      include: {
        unit: true,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Vehicle ${cleanReg} is already registered to Flat ${existing.unit.unitNumber}` },
        { status: 400 }
      )
    }

    // If slot is specified, check if another vehicle is already assigned to this slot
    if (cleanSlot) {
      const slotOccupied = await prisma.vehicle.findFirst({
        where: {
          parkingSlot: cleanSlot,
          unit: {
            organizationId: targetUnit.organizationId,
          },
        },
        include: {
          unit: true,
        },
      })
      if (slotOccupied) {
        return NextResponse.json(
          { error: `Parking Slot ${cleanSlot} is already assigned to vehicle ${slotOccupied.registrationNo} (Flat ${slotOccupied.unit.unitNumber})` },
          { status: 400 }
        )
      }
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        unitId: targetUnitId,
        type: cleanType,
        registrationNo: cleanReg,
        make: make?.trim() || null,
        model: model?.trim() || null,
        color: color?.trim() || null,
        parkingSlot: cleanSlot,
      },
      include: {
        unit: {
          include: {
            block: true,
          },
        },
      },
    })

    emitLiveSocketEvent('vehicle_registered', {
      vehicleId: vehicle.id,
      registrationNo: vehicle.registrationNo,
      parkingSlot: vehicle.parkingSlot,
      flat: vehicle.unit.unitNumber,
    })

    return NextResponse.json({
      success: true,
      vehicle,
      message: 'Vehicle & parking slot registered successfully',
    })
  } catch (err: any) {
    console.error('Error creating vehicle:', err)
    return NextResponse.json({ error: err.message || 'Failed to register vehicle' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, unitId, type, registrationNo, make, model, color, parkingSlot } = body

    if (!id) {
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 })
    }

    const existing = await prisma.vehicle.findUnique({
      where: { id },
      include: { unit: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    const cleanReg = registrationNo ? registrationNo.trim().toUpperCase() : existing.registrationNo
    const cleanSlot = parkingSlot !== undefined ? (parkingSlot && parkingSlot.trim() ? parkingSlot.trim().toUpperCase() : null) : existing.parkingSlot
    const cleanType = type ? type.trim().toUpperCase() : existing.type

    // If slot changed, check collision
    if (cleanSlot && cleanSlot !== existing.parkingSlot) {
      const slotOccupied = await prisma.vehicle.findFirst({
        where: {
          id: { not: id },
          parkingSlot: cleanSlot,
          unit: {
            organizationId: existing.unit.organizationId,
          },
        },
        include: {
          unit: true,
        },
      })
      if (slotOccupied) {
        return NextResponse.json(
          { error: `Parking Slot ${cleanSlot} is already assigned to ${slotOccupied.registrationNo} (Flat ${slotOccupied.unit.unitNumber})` },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.vehicle.update({
      where: { id },
      data: {
        ...(unitId ? { unitId } : {}),
        type: cleanType,
        registrationNo: cleanReg,
        make: make !== undefined ? (make?.trim() || null) : existing.make,
        model: model !== undefined ? (model?.trim() || null) : existing.model,
        color: color !== undefined ? (color?.trim() || null) : existing.color,
        parkingSlot: cleanSlot,
      },
      include: {
        unit: {
          include: {
            block: true,
          },
        },
      },
    })

    emitLiveSocketEvent('vehicle_updated', {
      vehicleId: updated.id,
      registrationNo: updated.registrationNo,
      parkingSlot: updated.parkingSlot,
      flat: updated.unit.unitNumber,
    })

    return NextResponse.json({
      success: true,
      vehicle: updated,
      message: 'Vehicle updated successfully',
    })
  } catch (err: any) {
    console.error('Error updating vehicle:', err)
    return NextResponse.json({ error: err.message || 'Failed to update vehicle' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 })
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: { unit: true },
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    await prisma.vehicle.delete({
      where: { id },
    })

    emitLiveSocketEvent('vehicle_deleted', {
      vehicleId: id,
      registrationNo: vehicle.registrationNo,
      flat: vehicle.unit?.unitNumber,
    })

    return NextResponse.json({
      success: true,
      message: `Vehicle ${vehicle.registrationNo} removed successfully`,
    })
  } catch (err: any) {
    console.error('Error deleting vehicle:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete vehicle' }, { status: 500 })
  }
}
