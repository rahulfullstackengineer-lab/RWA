import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { emitLiveSocketEvent } from '@/lib/socket-server'
import { logAudit } from '@/lib/audit'
import fs from 'fs'
import path from 'path'

const COMMITTEE_DATA_PATH = path.join(process.cwd(), 'committee_store.json')

export interface EmergencyContactInput {
  name: string
  role: string
  category?: 'COMMITTEE' | 'SECURITY' | 'MAINTENANCE' | 'MEDICAL' | 'POLICE_FIRE' | 'SERVICES'
  phone: string
  altPhone?: string
  email?: string
  unit?: string
  availableHours?: string
  isPriority?: boolean
  order?: number
}

// Helper to seed initial emergency contacts using committee members and essential services
async function seedDefaultEmergencyContacts(orgId: string) {
  try {
    // 1. Gather Committee Members from Database and committee_store.json
    const committeeUsers = await prisma.user.findMany({
      where: {
        organizationId: orgId,
        role: { in: ['RWA_ADMIN', 'ADMIN', 'SECRETARY', 'TREASURER', 'PRESIDENT', 'COMMITTEE_MEMBER'] },
      },
      include: { unit: true },
    })

    // Also check committee_store.json for any configured members
    let storedCommitteeMembers: any[] = []
    try {
      if (fs.existsSync(COMMITTEE_DATA_PATH)) {
        const cData = JSON.parse(fs.readFileSync(COMMITTEE_DATA_PATH, 'utf-8'))
        if (cData && cData[orgId] && Array.isArray(cData[orgId].members)) {
          storedCommitteeMembers = cData[orgId].members
        }
      }
    } catch (e) {}

    const seedItems: any[] = []

    // Add Committee Members from users or stored list
    if (committeeUsers.length > 0) {
      for (const u of committeeUsers) {
        let roleTitle = 'Committee Member'
        if (u.role === 'RWA_ADMIN') roleTitle = 'President (RWA Admin)'
        else if (u.role === 'SECRETARY') roleTitle = 'General Secretary'
        else if (u.role === 'TREASURER') roleTitle = 'Treasurer'
        else if (u.role === 'PRESIDENT') roleTitle = 'President'

        seedItems.push({
          organizationId: orgId,
          name: u.name,
          role: roleTitle,
          category: 'COMMITTEE',
          phone: u.phone,
          altPhone: '',
          email: u.email || '',
          unit: u.unit ? `Flat ${u.unit.unitNumber}` : 'Society Campus',
          availableHours: '24x7 Emergency',
          isPriority: true,
          order: 1,
        })
      }
    } else if (storedCommitteeMembers.length > 0) {
      for (const m of storedCommitteeMembers.slice(0, 4)) {
        seedItems.push({
          organizationId: orgId,
          name: m.name,
          role: m.role || 'Committee Member',
          category: 'COMMITTEE',
          phone: m.phone || '9876543210',
          altPhone: '',
          email: m.email || '',
          unit: m.unit ? `Flat ${m.unit}` : 'Society Campus',
          availableHours: '24x7 Emergency',
          isPriority: true,
          order: 1,
        })
      }
    } else {
      // Fallback default committee contact
      const anyAdmin = await prisma.user.findFirst({
        where: { organizationId: orgId },
        include: { unit: true },
      })
      seedItems.push({
        organizationId: orgId,
        name: anyAdmin ? anyAdmin.name : 'Managing Committee Desk',
        role: 'RWA President / Secretary',
        category: 'COMMITTEE',
        phone: anyAdmin ? anyAdmin.phone : '9876543210',
        altPhone: 'Ext 100',
        email: anyAdmin?.email || 'committee@rwa.org',
        unit: anyAdmin?.unit ? `Flat ${anyAdmin.unit.unitNumber}` : 'RWA Office',
        availableHours: '24x7 Emergency',
        isPriority: true,
        order: 1,
      })
    }

    // 2. Add Standard Gate & Campus Security
    seedItems.push({
      organizationId: orgId,
      name: 'Main Security Gate 1 Desk',
      role: 'Head Security Guard (Gate 1)',
      category: 'SECURITY',
      phone: '1234567890',
      altPhone: 'Ext 101',
      email: '',
      unit: 'Main Campus Gate',
      availableHours: '24x7 (3 Shifts)',
      isPriority: true,
      order: 2,
    })

    seedItems.push({
      organizationId: orgId,
      name: 'North Gate Security Post',
      role: 'Gate 2 Security Guard',
      category: 'SECURITY',
      phone: '1234567891',
      altPhone: 'Ext 102',
      email: '',
      unit: 'Gate 2 Entrance',
      availableHours: '24x7 (3 Shifts)',
      isPriority: false,
      order: 3,
    })

    // 3. Add Maintenance & Technicians
    seedItems.push({
      organizationId: orgId,
      name: 'Society Duty Electrician',
      role: 'Chief Electrical Technician',
      category: 'MAINTENANCE',
      phone: '9876543211',
      altPhone: 'Ext 104',
      email: '',
      unit: 'Basement Substation',
      availableHours: '08:00 AM - 10:00 PM · On-Call Night',
      isPriority: false,
      order: 4,
    })

    seedItems.push({
      organizationId: orgId,
      name: 'Society Duty Plumber',
      role: 'Water Works & Sanitation',
      category: 'MAINTENANCE',
      phone: '9876543212',
      altPhone: 'Ext 105',
      email: '',
      unit: 'Pump House',
      availableHours: '08:00 AM - 10:00 PM · On-Call Night',
      isPriority: false,
      order: 5,
    })

    seedItems.push({
      organizationId: orgId,
      name: 'Campus Elevator Helpline',
      role: 'OTIS / Schindler Lift Emergency SOS',
      category: 'MAINTENANCE',
      phone: '18001021234',
      altPhone: 'Ext 106',
      email: '',
      unit: 'Tower Lifts Emergency Intercom',
      availableHours: '24x7 Breakdown Response',
      isPriority: true,
      order: 6,
    })

    // 4. Add Emergency & Medical Services
    seedItems.push({
      organizationId: orgId,
      name: 'National Medical Ambulance Helpline',
      role: 'Emergency Trauma & Ambulance Dispatch',
      category: 'MEDICAL',
      phone: '108',
      altPhone: '112',
      email: '',
      unit: 'Government / District Hospital',
      availableHours: '24x7 Instant Dispatch',
      isPriority: true,
      order: 7,
    })

    seedItems.push({
      organizationId: orgId,
      name: 'Police Control Room (PCR)',
      role: 'Sector / City Police Dispatch',
      category: 'POLICE_FIRE',
      phone: '112',
      altPhone: '100',
      email: '',
      unit: 'Local Police Station',
      availableHours: '24x7 Toll-Free',
      isPriority: true,
      order: 8,
    })

    seedItems.push({
      organizationId: orgId,
      name: 'Fire & Rescue Emergency Command',
      role: 'Fire Brigade Station',
      category: 'POLICE_FIRE',
      phone: '101',
      altPhone: '112',
      email: '',
      unit: 'City Fire Station',
      availableHours: '24x7 Toll-Free',
      isPriority: true,
      order: 9,
    })

    // Batch insert into Prisma
    for (const item of seedItems) {
      await prisma.emergencyContact.create({
        data: item,
      })
    }
  } catch (err) {
    console.error('Error seeding default emergency contacts:', err)
  }
}

// GET /api/emergency/contacts — Accessible to all logged-in Residents and Admins
export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    const orgId = user.organizationId!
    let contacts = await prisma.emergencyContact.findMany({
      where: { organizationId: orgId },
      orderBy: [
        { isPriority: 'desc' },
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    // If no contacts exist yet for this society, seed default committee + emergency contacts
    if (contacts.length === 0) {
      await seedDefaultEmergencyContacts(orgId)
      contacts = await prisma.emergencyContact.findMany({
        where: { organizationId: orgId },
        orderBy: [
          { isPriority: 'desc' },
          { order: 'asc' },
          { createdAt: 'asc' },
        ],
      })
    }

    const metrics = {
      total: contacts.length,
      committee: contacts.filter(c => c.category === 'COMMITTEE').length,
      security: contacts.filter(c => c.category === 'SECURITY').length,
      maintenance: contacts.filter(c => c.category === 'MAINTENANCE').length,
      medical: contacts.filter(c => c.category === 'MEDICAL').length,
      policeFire: contacts.filter(c => c.category === 'POLICE_FIRE').length,
    }

    return NextResponse.json({
      success: true,
      contacts,
      metrics,
    })
  } catch (err: unknown) {
    console.error('Emergency contacts GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch emergency contacts' }, { status: 500 })
  }
}

// POST /api/emergency/contacts — Admin adds a new emergency contact or resets
export async function POST(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Forbidden: Admin access required' }, { status: 403 })
    }

    const orgId = user.organizationId!
    const body = await request.json()

    // Support action: RESET_DEFAULTS to re-sync committee members
    if (body.action === 'RESET_DEFAULTS') {
      await prisma.emergencyContact.deleteMany({
        where: { organizationId: orgId },
      })
      await seedDefaultEmergencyContacts(orgId)
      const fresh = await prisma.emergencyContact.findMany({
        where: { organizationId: orgId },
        orderBy: [{ isPriority: 'desc' }, { order: 'asc' }, { createdAt: 'asc' }],
      })
      emitLiveSocketEvent('emergency:contacts-updated', { orgId })
      return NextResponse.json({ success: true, contacts: fresh, message: 'Emergency contacts reset to defaults' })
    }

    const {
      name,
      role,
      category = 'COMMITTEE',
      phone,
      altPhone = '',
      email = '',
      unit = '',
      availableHours = '24x7',
      isPriority = false,
      order = 0,
    } = body

    if (!name || !role || !phone) {
      return NextResponse.json({ error: 'Name, Role/Designation, and Phone number are required.' }, { status: 400 })
    }

    const newContact = await prisma.emergencyContact.create({
      data: {
        organizationId: orgId,
        name: name.trim(),
        role: role.trim(),
        category: category || 'COMMITTEE',
        phone: phone.trim(),
        altPhone: altPhone ? altPhone.trim() : null,
        email: email ? email.trim() : null,
        unit: unit ? unit.trim() : null,
        availableHours: availableHours ? availableHours.trim() : '24x7',
        isPriority: Boolean(isPriority),
        order: Number(order) || 0,
      },
    })

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'CREATE_EMERGENCY_CONTACT',
      entityType: 'EmergencyContact',
      entityId: newContact.id,
      newValues: JSON.stringify(newContact),
    })

    emitLiveSocketEvent('emergency:contacts-updated', { orgId, contactId: newContact.id })

    return NextResponse.json({
      success: true,
      contact: newContact,
      message: 'Emergency contact added successfully and is now live for all residents.',
    })
  } catch (err: unknown) {
    console.error('Emergency contacts POST error:', err)
    return NextResponse.json({ error: 'Failed to create emergency contact' }, { status: 500 })
  }
}

// PUT /api/emergency/contacts — Admin edits an existing emergency contact
export async function PUT(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Forbidden: Admin access required' }, { status: 403 })
    }

    const orgId = user.organizationId!
    const body = await request.json()
    const { id, name, role, category, phone, altPhone, email, unit, availableHours, isPriority, order } = body

    if (!id) {
      return NextResponse.json({ error: 'Emergency contact ID is required.' }, { status: 400 })
    }

    const existing = await prisma.emergencyContact.findFirst({
      where: { id, organizationId: orgId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Emergency contact not found.' }, { status: 404 })
    }

    const updated = await prisma.emergencyContact.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        role: role !== undefined ? role.trim() : existing.role,
        category: category !== undefined ? category : existing.category,
        phone: phone !== undefined ? phone.trim() : existing.phone,
        altPhone: altPhone !== undefined ? (altPhone ? altPhone.trim() : null) : existing.altPhone,
        email: email !== undefined ? (email ? email.trim() : null) : existing.email,
        unit: unit !== undefined ? (unit ? unit.trim() : null) : existing.unit,
        availableHours: availableHours !== undefined ? availableHours.trim() : existing.availableHours,
        isPriority: isPriority !== undefined ? Boolean(isPriority) : existing.isPriority,
        order: order !== undefined ? Number(order) : existing.order,
      },
    })

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'UPDATE_EMERGENCY_CONTACT',
      entityType: 'EmergencyContact',
      entityId: updated.id,
      oldValues: JSON.stringify(existing),
      newValues: JSON.stringify(updated),
    })

    emitLiveSocketEvent('emergency:contacts-updated', { orgId, contactId: updated.id })

    return NextResponse.json({
      success: true,
      contact: updated,
      message: 'Emergency contact updated successfully.',
    })
  } catch (err: unknown) {
    console.error('Emergency contacts PUT error:', err)
    return NextResponse.json({ error: 'Failed to update emergency contact' }, { status: 500 })
  }
}

// DELETE /api/emergency/contacts — Admin deletes an emergency contact
export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Forbidden: Admin access required' }, { status: 403 })
    }

    const orgId = user.organizationId!
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 })
    }

    const existing = await prisma.emergencyContact.findFirst({
      where: { id, organizationId: orgId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Emergency contact not found.' }, { status: 404 })
    }

    await prisma.emergencyContact.delete({
      where: { id },
    })

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'DELETE_EMERGENCY_CONTACT',
      entityType: 'EmergencyContact',
      entityId: id,
      oldValues: JSON.stringify(existing),
    })

    emitLiveSocketEvent('emergency:contacts-updated', { orgId, contactId: id })

    return NextResponse.json({
      success: true,
      message: 'Emergency contact deleted successfully.',
    })
  } catch (err: unknown) {
    console.error('Emergency contacts DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete emergency contact' }, { status: 500 })
  }
}
