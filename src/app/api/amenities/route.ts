import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { emitLiveSocketEvent } from '@/lib/socket-server'
import { logAudit } from '@/lib/audit'
import fs from 'fs'
import path from 'path'

const AMENITIES_DATA_PATH = path.join(process.cwd(), 'amenities_store.json')

export interface AmenityRecord {
  id: string
  name: string
  cat: string
  icon: string
  cap: string
  fee: string
  feeNum: number
  deposit: string
  depositNum: number
  status: 'ACTIVE' | 'MAINTENANCE'
  bookings: number
  timings: string
  color: string
  rules?: string
  createdAt: string
  updatedAt?: string
}

export interface AmenityBookingRecord {
  id: string
  unit: string
  name: string
  phone: string
  amenity: string
  amenityId?: string
  date: string
  dateDisplay: string
  slot: string
  purpose: string
  fee: string
  feeNum: number
  deposit: string
  depositNum: number
  status: 'CONFIRMED' | 'PENDING' | 'REJECTED' | 'CANCELLED'
  createdAt: string
  approvedBy?: string
  approvedAt?: string
  notes?: string
}

export interface AmenityStoreData {
  amenities: AmenityRecord[]
  bookings: AmenityBookingRecord[]
}

function getDefaultAmenities(): AmenityRecord[] {
  return [
    {
      id: 'AMN-1',
      icon: '🏛️',
      name: 'Community Hall',
      cat: 'Clubhouse',
      cap: '150 persons',
      fee: '₹2,500 / event slot',
      feeNum: 2500,
      deposit: '₹2,000 security deposit',
      depositNum: 2000,
      status: 'ACTIVE',
      bookings: 6,
      timings: '10:00 AM - 10:00 PM',
      color: '#8b5cf6',
      rules: 'Max 1 booking per month per flat. Music must stop by 10:00 PM. Catering waste disposal is host responsibility.',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'AMN-2',
      icon: '🏊',
      name: 'Swimming Pool',
      cat: 'Sports',
      cap: '30 persons',
      fee: 'Free for residents',
      feeNum: 0,
      deposit: 'No deposit',
      depositNum: 0,
      status: 'ACTIVE',
      bookings: 14,
      timings: '06:00 AM - 09:00 PM',
      color: '#06b6d4',
      rules: 'Shower before entering pool. Nylon swimwear mandatory. Children under 10 must be accompanied by an adult.',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'AMN-3',
      icon: '🏸',
      name: 'Badminton Court',
      cat: 'Sports',
      cap: '4 players',
      fee: '₹150 / hr (floodlights)',
      feeNum: 150,
      deposit: 'No deposit',
      depositNum: 0,
      status: 'ACTIVE',
      bookings: 19,
      timings: '06:00 AM - 10:00 PM',
      color: '#3b82f6',
      rules: 'Non-marking shoes mandatory on synthetic turf. Slot reservation valid for up to 60 minutes continuously per flat.',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'AMN-4',
      icon: '🏢',
      name: 'Clubhouse Meeting Room',
      cat: 'Clubhouse',
      cap: '20 persons',
      fee: '₹500 / 3 hrs',
      feeNum: 500,
      deposit: '₹500 deposit',
      depositNum: 500,
      status: 'ACTIVE',
      bookings: 4,
      timings: '09:00 AM - 08:00 PM',
      color: '#f59e0b',
      rules: 'Conference TV, audio and presentation board provided. Only executive committee or resident meetings allowed.',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'AMN-5',
      icon: '🌿',
      name: 'Party Lawn',
      cat: 'Outdoors',
      cap: '250 persons',
      fee: '₹5,000 / day',
      feeNum: 5000,
      deposit: '₹5,000 deposit',
      depositNum: 5000,
      status: 'ACTIVE',
      bookings: 2,
      timings: '02:00 PM - 11:00 PM',
      color: '#10b981',
      rules: 'Private functions permitted. Setup starts at 12:00 PM. Full deposit returned following clean inspection next morning.',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'AMN-6',
      icon: '🏋️',
      name: 'Fitness Gym',
      cat: 'Wellness',
      cap: '15 persons',
      fee: 'Free for residents',
      feeNum: 0,
      deposit: 'Biometric pass',
      depositNum: 0,
      status: 'MAINTENANCE',
      bookings: 0,
      timings: 'Temporarily Closed for AC repair',
      color: '#64748b',
      rules: 'Biometric access pass required. Wipe down equipment after usage. Towel mandatory.',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ]
}

function getDefaultBookings(): AmenityBookingRecord[] {
  return [
    {
      id: 'BK-101',
      unit: 'A-1',
      name: 'Rajesh Kumar',
      phone: '98000 11223',
      amenity: 'Badminton Court',
      date: '2026-10-11',
      dateDisplay: 'Sun, 11 Oct 2026',
      slot: '07:00 PM – 08:00 PM',
      purpose: 'Friendly Match',
      fee: '₹150',
      feeNum: 150,
      deposit: '₹0',
      depositNum: 0,
      status: 'CONFIRMED',
      createdAt: '2026-10-08T10:00:00.000Z',
    },
    {
      id: 'BK-102',
      unit: 'A-3',
      name: 'Vijay Mehta',
      phone: '98765 43210',
      amenity: 'Community Hall',
      date: '2026-10-12',
      dateDisplay: 'Mon, 12 Oct 2026',
      slot: '04:00 PM – 10:00 PM',
      purpose: "Daughter's 10th Birthday",
      fee: '₹2,500',
      feeNum: 2500,
      deposit: '₹2,000',
      depositNum: 2000,
      status: 'PENDING',
      createdAt: '2026-10-09T14:30:00.000Z',
    },
    {
      id: 'BK-103',
      unit: 'C-7',
      name: 'Col. Ranjit Singh',
      phone: '98100 99887',
      amenity: 'Clubhouse Meeting Room',
      date: '2026-10-16',
      dateDisplay: 'Fri, 16 Oct 2026',
      slot: '10:00 AM – 01:00 PM',
      purpose: 'Sub-committee Meeting',
      fee: '₹500',
      feeNum: 500,
      deposit: '₹500',
      depositNum: 500,
      status: 'CONFIRMED',
      createdAt: '2026-10-05T11:00:00.000Z',
    },
    {
      id: 'BK-104',
      unit: 'B-14',
      name: 'Kavita Gupta',
      phone: '98111 22334',
      amenity: 'Party Lawn',
      date: '2026-10-20',
      dateDisplay: 'Tue, 20 Oct 2026',
      slot: '02:00 PM – 10:00 PM',
      purpose: 'Anniversary Dinner',
      fee: '₹5,000',
      feeNum: 5000,
      deposit: '₹5,000',
      depositNum: 5000,
      status: 'CONFIRMED',
      createdAt: '2026-10-02T16:00:00.000Z',
    },
    {
      id: 'BK-105',
      unit: 'D-4',
      name: 'Sameer Verma',
      phone: '98450 67890',
      amenity: 'Community Hall',
      date: '2026-10-26',
      dateDisplay: 'Mon, 26 Oct 2026',
      slot: '11:00 AM – 04:00 PM',
      purpose: 'Family Gathering',
      fee: '₹2,500',
      feeNum: 2500,
      deposit: '₹2,000',
      depositNum: 2000,
      status: 'PENDING',
      createdAt: '2026-10-10T12:00:00.000Z',
    },
    {
      id: 'BK-106',
      unit: 'B-4',
      name: 'Anita Roy',
      phone: '98222 33445',
      amenity: 'Badminton Court',
      date: '2026-10-28',
      dateDisplay: 'Wed, 28 Oct 2026',
      slot: '06:00 PM – 07:00 PM',
      purpose: 'Tournament Practice',
      fee: '₹150',
      feeNum: 150,
      deposit: '₹0',
      depositNum: 0,
      status: 'CONFIRMED',
      createdAt: '2026-10-11T09:15:00.000Z',
    },
  ]
}

function getStoredData(orgId: string): AmenityStoreData {
  try {
    if (fs.existsSync(AMENITIES_DATA_PATH)) {
      const allData = JSON.parse(fs.readFileSync(AMENITIES_DATA_PATH, 'utf-8'))
      if (allData && allData[orgId]) {
        const orgData = allData[orgId]
        return {
          amenities: Array.isArray(orgData.amenities) ? orgData.amenities : [],
          bookings: Array.isArray(orgData.bookings) ? orgData.bookings : [],
        }
      }
    }
  } catch (e) {
    console.error('Error reading amenities store:', e)
  }

  return {
    amenities: [],
    bookings: [],
  }
}

function saveStoredData(orgId: string, data: AmenityStoreData) {
  try {
    let allData: Record<string, AmenityStoreData> = {}
    if (fs.existsSync(AMENITIES_DATA_PATH)) {
      try {
        allData = JSON.parse(fs.readFileSync(AMENITIES_DATA_PATH, 'utf-8'))
      } catch (e) {}
    }
    allData[orgId] = data
    fs.writeFileSync(AMENITIES_DATA_PATH, JSON.stringify(allData, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error saving amenities store:', e)
  }
}

function calculateAmenityMetrics(amenities: AmenityRecord[], bookings: AmenityBookingRecord[]) {
  const activeAmenities = amenities.filter(a => a.status === 'ACTIVE').length
  const pendingApprovals = bookings.filter(b => b.status === 'PENDING').length
  const bookingsThisMonth = bookings.length

  const confirmedFees = bookings
    .filter(b => b.status === 'CONFIRMED')
    .reduce((sum, b) => sum + (Number(b.feeNum) || 0), 0)
  
  const revenueGenerated = confirmedFees

  return {
    activeAmenities,
    bookingsThisMonth,
    revenueGenerated,
    pendingApprovals,
  }
}

function formatDateDisplay(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  } catch {
    return dateStr
  }
}

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const orgId = user.organizationId || 'default-org'
    const data = getStoredData(orgId)
    const metrics = calculateAmenityMetrics(data.amenities, data.bookings)

    return NextResponse.json({
      success: true,
      amenities: data.amenities,
      bookings: data.bookings,
      metrics,
    })
  } catch (err: unknown) {
    console.error('Amenities GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch amenities' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const orgId = user.organizationId || 'default-org'
    const data = getStoredData(orgId)
    const body = await request.json()
    const { action } = body

    // 1. APPROVE BOOKING
    if (action === 'approve_booking') {
      const { bookingId } = body
      const booking = data.bookings.find(b => b.id === bookingId)
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      const prevStatus = booking.status
      booking.status = 'CONFIRMED'
      booking.approvedBy = user.name || 'Admin'
      booking.approvedAt = new Date().toISOString()

      saveStoredData(orgId, data)

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'APPROVE_AMENITY_BOOKING',
        entityType: 'AMENITY_BOOKING',
        entityId: bookingId,
        details: `Approved booking ${bookingId} for "${booking.amenity}" reserved by ${booking.name} (${booking.unit}) on ${booking.date}`,
        oldValues: { status: prevStatus },
        newValues: { status: 'CONFIRMED', approvedBy: user.name },
      })

      emitLiveSocketEvent('amenity-booking-updated', {
        action: 'approved',
        booking,
      }, { orgId })

      const metrics = calculateAmenityMetrics(data.amenities, data.bookings)
      return NextResponse.json({ success: true, booking, metrics })
    }

    // 2. REJECT BOOKING
    if (action === 'reject_booking') {
      const { bookingId, reason = 'Slot not available or rules conflict' } = body
      const booking = data.bookings.find(b => b.id === bookingId)
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      const prevStatus = booking.status
      booking.status = 'REJECTED'
      booking.notes = reason

      saveStoredData(orgId, data)

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'REJECT_AMENITY_BOOKING',
        entityType: 'AMENITY_BOOKING',
        entityId: bookingId,
        details: `Rejected booking ${bookingId} for "${booking.amenity}" (${booking.name}, Unit ${booking.unit}). Reason: ${reason}`,
        oldValues: { status: prevStatus },
        newValues: { status: 'REJECTED', reason },
      })

      emitLiveSocketEvent('amenity-booking-updated', {
        action: 'rejected',
        booking,
      }, { orgId })

      const metrics = calculateAmenityMetrics(data.amenities, data.bookings)
      return NextResponse.json({ success: true, booking, metrics })
    }

    // 3. CREATE AMENITY
    if (action === 'create_amenity') {
      const {
        name,
        cat = 'Clubhouse',
        icon = '🏛️',
        cap = '50 persons',
        feeNum = 0,
        depositNum = 0,
        timings = '08:00 AM - 10:00 PM',
        rules = '',
        status = 'ACTIVE',
        color = '#3b82f6',
      } = body

      if (!name) {
        return NextResponse.json({ error: 'Amenity name is required' }, { status: 400 })
      }

      const newAmenity: AmenityRecord = {
        id: `AMN-${Date.now().toString(36).toUpperCase()}`,
        name: name.trim(),
        cat,
        icon,
        cap: cap.toString().includes('person') || cap.toString().includes('player') ? cap : `${cap} persons`,
        fee: Number(feeNum) > 0 ? `₹${Number(feeNum).toLocaleString('en-IN')} / slot` : 'Free for residents',
        feeNum: Number(feeNum) || 0,
        deposit: Number(depositNum) > 0 ? `₹${Number(depositNum).toLocaleString('en-IN')} deposit` : 'No deposit',
        depositNum: Number(depositNum) || 0,
        status: status === 'MAINTENANCE' ? 'MAINTENANCE' : 'ACTIVE',
        bookings: 0,
        timings,
        color,
        rules: rules.trim(),
        createdAt: new Date().toISOString(),
      }

      data.amenities.push(newAmenity)
      saveStoredData(orgId, data)

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'CREATE_AMENITY',
        entityType: 'AMENITY',
        entityId: newAmenity.id,
        details: `Created new amenity "${newAmenity.name}" (Category: ${newAmenity.cat}, Capacity: ${newAmenity.cap}, Fee: ${newAmenity.fee})`,
        newValues: newAmenity,
      })

      emitLiveSocketEvent('amenity-created', { amenity: newAmenity }, { orgId })

      const metrics = calculateAmenityMetrics(data.amenities, data.bookings)
      return NextResponse.json({ success: true, amenity: newAmenity, metrics })
    }

    // 4. UPDATE AMENITY RULES
    if (action === 'update_rules') {
      const { amenityId, name, cat, icon, cap, timings, status, feeNum, depositNum, rules } = body
      const amenity = data.amenities.find(a => a.id === amenityId || a.name === amenityId)
      if (!amenity) {
        return NextResponse.json({ error: 'Amenity not found' }, { status: 404 })
      }

      const oldValues = { ...amenity }
      if (name) amenity.name = name.trim()
      if (cat) amenity.cat = cat
      if (icon) amenity.icon = icon
      if (cap) amenity.cap = cap.toString().includes('person') || cap.toString().includes('player') ? cap : `${cap} persons`
      if (timings) amenity.timings = timings.trim()
      if (status) amenity.status = status
      if (rules !== undefined) amenity.rules = rules.trim()

      if (feeNum !== undefined) {
        amenity.feeNum = Number(feeNum) || 0
        amenity.fee = amenity.feeNum > 0 ? `₹${amenity.feeNum.toLocaleString('en-IN')} / slot` : 'Free for residents'
      }

      if (depositNum !== undefined) {
        amenity.depositNum = Number(depositNum) || 0
        amenity.deposit = amenity.depositNum > 0 ? `₹${amenity.depositNum.toLocaleString('en-IN')} deposit` : 'No deposit'
      }

      amenity.updatedAt = new Date().toISOString()
      saveStoredData(orgId, data)

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'UPDATE_AMENITY_RULES',
        entityType: 'AMENITY',
        entityId: amenity.id,
        details: `Updated rules/tariffs for amenity "${amenity.name}" (Status: ${amenity.status}, Fee: ${amenity.fee})`,
        oldValues,
        newValues: amenity,
      })

      emitLiveSocketEvent('amenity-updated', { amenity }, { orgId })

      const metrics = calculateAmenityMetrics(data.amenities, data.bookings)
      return NextResponse.json({ success: true, amenity, metrics })
    }

    // 5. BOOK SLOT (either explicit action 'book_slot' or fallback booking)
    const {
      amenityName,
      amenityId,
      unit = user.unitId || 'A-1',
      residentName = user.name || 'Resident',
      phone = user.phone || '98765 00000',
      date,
      timeSlot,
      slot = timeSlot || '10:00 AM – 02:00 PM',
      purpose = 'Personal Event',
      fee = 0,
      deposit = 0,
      autoApprove = false,
    } = body

    const targetAmenity = data.amenities.find(a => 
      (amenityId && a.id === amenityId) || 
      (amenityName && a.name.toLowerCase() === amenityName.toLowerCase()) ||
      (amenityName && a.name.toLowerCase().includes(amenityName.toLowerCase()))
    ) || data.amenities[0]

    const bookingDate = date ? date.split('T')[0] : new Date().toISOString().split('T')[0]
    const finalFee = fee !== undefined ? Number(fee) : targetAmenity.feeNum
    const finalDeposit = deposit !== undefined ? Number(deposit) : targetAmenity.depositNum

    // Conflict detection: prevent double-booking if same amenity and slot on date is CONFIRMED or PENDING
    const cleanSlot = slot.trim().toLowerCase()
    const hasConflict = data.bookings.some(b => 
      b.amenity === targetAmenity.name &&
      b.date === bookingDate &&
      (b.status === 'CONFIRMED' || b.status === 'PENDING') &&
      (b.slot.toLowerCase() === cleanSlot || cleanSlot.includes(b.slot.toLowerCase()) || b.slot.toLowerCase().includes(cleanSlot))
    )

    if (hasConflict) {
      return NextResponse.json({ 
        error: `Slot "${slot}" on ${bookingDate} for ${targetAmenity.name} is already booked or reserved.` 
      }, { status: 409 })
    }

    // Free amenities or explicit autoApprove are confirmed right away; paid hall/party reservations default to PENDING review
    const initialStatus = autoApprove || finalFee === 0 ? 'CONFIRMED' : 'PENDING'

    const newBooking: AmenityBookingRecord = {
      id: `BK-${Math.floor(100 + Math.random() * 900)}`,
      unit: unit.trim() || 'A-1',
      name: residentName.trim() || user.name || 'Resident',
      phone: phone.trim() || '98765 00000',
      amenity: targetAmenity.name,
      amenityId: targetAmenity.id,
      date: bookingDate,
      dateDisplay: formatDateDisplay(bookingDate),
      slot: slot.trim(),
      purpose: purpose.trim() || 'Facility Reservation',
      fee: finalFee > 0 ? `₹${finalFee.toLocaleString('en-IN')}` : '₹0',
      feeNum: finalFee,
      deposit: finalDeposit > 0 ? `₹${finalDeposit.toLocaleString('en-IN')}` : '₹0',
      depositNum: finalDeposit,
      status: initialStatus,
      createdAt: new Date().toISOString(),
    }

    data.bookings.unshift(newBooking)
    targetAmenity.bookings = (targetAmenity.bookings || 0) + 1
    saveStoredData(orgId, data)

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'BOOK_AMENITY_SLOT',
      entityType: 'AMENITY_BOOKING',
      entityId: newBooking.id,
      details: `Booked slot "${newBooking.slot}" on ${newBooking.date} for "${newBooking.amenity}" by ${newBooking.name} (${newBooking.unit}). Status: ${newBooking.status}`,
      newValues: newBooking,
    })

    emitLiveSocketEvent('new-amenity-booking', {
      id: newBooking.id,
      amenityName: newBooking.amenity,
      bookedByName: newBooking.name,
      unit: newBooking.unit,
      date: newBooking.date,
      timeSlot: newBooking.slot,
      purpose: newBooking.purpose,
      status: newBooking.status,
    }, { orgId })

    const metrics = calculateAmenityMetrics(data.amenities, data.bookings)
    return NextResponse.json({ success: true, booking: newBooking, amenity: targetAmenity, metrics })

  } catch (err: unknown) {
    console.error('Amenities POST error:', err)
    return NextResponse.json({ error: 'Failed to process amenity action' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const orgId = user.organizationId || 'default-org'
    const data = getStoredData(orgId)
    const url = new URL(request.url)
    const bookingId = url.searchParams.get('bookingId')
    const amenityId = url.searchParams.get('amenityId')

    if (bookingId) {
      const idx = data.bookings.findIndex(b => b.id === bookingId)
      if (idx === -1) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      
      const removed = data.bookings.splice(idx, 1)[0]
      saveStoredData(orgId, data)

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'CANCEL_AMENITY_BOOKING',
        entityType: 'AMENITY_BOOKING',
        entityId: bookingId,
        details: `Cancelled booking ${bookingId} for "${removed.amenity}" (${removed.name}, ${removed.unit}) on ${removed.date}`,
        oldValues: removed,
      })

      const metrics = calculateAmenityMetrics(data.amenities, data.bookings)
      return NextResponse.json({ success: true, message: 'Booking cancelled', metrics })
    }

    if (amenityId) {
      const idx = data.amenities.findIndex(a => a.id === amenityId)
      if (idx === -1) return NextResponse.json({ error: 'Amenity not found' }, { status: 404 })
      
      const removed = data.amenities.splice(idx, 1)[0]
      saveStoredData(orgId, data)

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'DELETE_AMENITY',
        entityType: 'AMENITY',
        entityId: amenityId,
        details: `Removed amenity "${removed.name}" from society amenities`,
        oldValues: removed,
      })

      const metrics = calculateAmenityMetrics(data.amenities, data.bookings)
      return NextResponse.json({ success: true, message: 'Amenity removed', metrics })
    }

    return NextResponse.json({ error: 'Missing bookingId or amenityId' }, { status: 400 })
  } catch (err: unknown) {
    console.error('Amenities DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete amenity item' }, { status: 500 })
  }
}
