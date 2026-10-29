import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data in order of relations
  await prisma.auditLog.deleteMany()
  await prisma.amenityBooking.deleteMany()
  await prisma.amenity.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.complaintComment.deleteMany()
  await prisma.complaint.deleteMany()
  await prisma.notice.deleteMany()
  await prisma.meeting.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.invoiceItem.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.chargeHead.deleteMany()
  await prisma.fundHead.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.session.deleteMany()
  await prisma.otpCode.deleteMany()
  await prisma.user.deleteMany()
  await prisma.unit.deleteMany()
  await prisma.block.deleteMany()
  await prisma.organization.deleteMany()

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Greenfield Heights RWA',
      registrationNo: 'CH-RWA-2018-092',
      address: 'Plot 42, Sector 48-C',
      city: 'Chandigarh',
      pincode: '160047',
      phone: '+91 172 268 9000',
      email: 'office@greenfieldheights.in',
      plan: 'PROFESSIONAL',
      totalUnits: 120,
    },
  })
  console.log(`Created Organization: ${org.name}`)

  // 2. Create Blocks
  const blockA = await prisma.block.create({
    data: {
      organizationId: org.id,
      name: 'Block A (Sunflower)',
      description: 'G+4 Residential Tower',
      floors: 4,
      totalUnits: 40,
    },
  })

  const blockB = await prisma.block.create({
    data: {
      organizationId: org.id,
      name: 'Block B (Lotus)',
      description: 'G+4 Residential Tower',
      floors: 4,
      totalUnits: 40,
    },
  })

  const blockC = await prisma.block.create({
    data: {
      organizationId: org.id,
      name: 'Block C (Marigold)',
      description: 'G+4 Residential Tower',
      floors: 4,
      totalUnits: 40,
    },
  })

  // 3. Create Units
  const unitA101 = await prisma.unit.create({
    data: {
      organizationId: org.id,
      blockId: blockA.id,
      unitNumber: 'A-101',
      unitType: 'FLAT_3BHK',
      floor: 1,
      areaSqft: 1850,
      occupancyStatus: 'OWNER_OCCUPIED',
      ownerName: 'Rohit Verma',
      ownerPhone: '9876543212',
      ownerEmail: 'rohit.verma@example.com',
    },
  })

  const unitA102 = await prisma.unit.create({
    data: {
      organizationId: org.id,
      blockId: blockA.id,
      unitNumber: 'A-102',
      unitType: 'FLAT_3BHK',
      floor: 1,
      areaSqft: 1850,
      occupancyStatus: 'TENANT_OCCUPIED',
      ownerName: 'Sanjay Kapoor',
      ownerPhone: '9876543220',
      tenantName: 'Kunal Singhania',
      tenantPhone: '9876543221',
    },
  })

  const unitB204 = await prisma.unit.create({
    data: {
      organizationId: org.id,
      blockId: blockB.id,
      unitNumber: 'B-204',
      unitType: 'FLAT_2BHK',
      floor: 2,
      areaSqft: 1450,
      occupancyStatus: 'OWNER_OCCUPIED',
      ownerName: 'Ananya Gupta',
      ownerPhone: '9876543213',
      ownerEmail: 'ananya.gupta@example.com',
    },
  })

  const unitC302 = await prisma.unit.create({
    data: {
      organizationId: org.id,
      blockId: blockC.id,
      unitNumber: 'C-302',
      unitType: 'PENTHOUSE',
      floor: 4,
      areaSqft: 2800,
      occupancyStatus: 'OWNER_OCCUPIED',
      ownerName: 'Suresh Mehta',
      ownerPhone: '9876543214',
      ownerEmail: 'suresh.mehta@example.com',
    },
  })

  // 4. Create Users (Admin, Treasurer, Residents)
  const passwordHashAdmin = await bcrypt.hash('admin123', 10)
  const passwordHashResident = await bcrypt.hash('resident123', 10)

  const adminUser = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: 'Vikram Malhotra',
      phone: '9876543210',
      email: 'president@greenfieldheights.in',
      passwordHash: passwordHashAdmin,
      role: 'RWA_ADMIN',
      status: 'ACTIVE',
    },
  })

  const treasurerUser = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: 'Pooja Sharma',
      phone: '9876543211',
      email: 'treasurer@greenfieldheights.in',
      passwordHash: passwordHashAdmin,
      role: 'TREASURER',
      status: 'ACTIVE',
    },
  })

  const residentUser1 = await prisma.user.create({
    data: {
      organizationId: org.id,
      unitId: unitA101.id,
      name: 'Rohit Verma',
      phone: '9876543212',
      email: 'rohit.verma@example.com',
      passwordHash: passwordHashResident,
      role: 'RESIDENT',
      status: 'ACTIVE',
    },
  })

  const residentUser2 = await prisma.user.create({
    data: {
      organizationId: org.id,
      unitId: unitB204.id,
      name: 'Ananya Gupta',
      phone: '9876543213',
      email: 'ananya.gupta@example.com',
      passwordHash: passwordHashResident,
      role: 'RESIDENT',
      status: 'ACTIVE',
    },
  })

  console.log(`Created Users: Admin (${adminUser.phone}), Resident (${residentUser1.phone})`)

  // 5. Fund Heads & Charge Heads
  const fundMaint = await prisma.fundHead.create({
    data: {
      organizationId: org.id,
      name: 'General Maintenance Fund',
      type: 'MAINTENANCE',
      description: 'Day-to-day operations and maintenance of common areas',
    },
  })

  const fundSinking = await prisma.fundHead.create({
    data: {
      organizationId: org.id,
      name: 'Sinking & Capital Replacement Fund',
      type: 'SINKING',
      description: 'Long-term structural repairs, lifts, and paint',
    },
  })

  const chargeMaint = await prisma.chargeHead.create({
    data: {
      organizationId: org.id,
      fundHeadId: fundMaint.id,
      name: 'Monthly Maintenance Fee',
      frequency: 'MONTHLY',
      basis: 'FIXED',
      amount: 3500,
      gstPercent: 18,
    },
  })

  const chargeSinking = await prisma.chargeHead.create({
    data: {
      organizationId: org.id,
      fundHeadId: fundSinking.id,
      name: 'Sinking Fund Contribution',
      frequency: 'MONTHLY',
      basis: 'FIXED',
      amount: 500,
      gstPercent: 0,
    },
  })

  const chargeWater = await prisma.chargeHead.create({
    data: {
      organizationId: org.id,
      fundHeadId: fundMaint.id,
      name: 'Water & Common Utility Charge',
      frequency: 'MONTHLY',
      basis: 'FIXED',
      amount: 400,
      gstPercent: 0,
    },
  })

  // 6. Invoices & Payments - start clean with 0 records


  // 7. Notices
  await prisma.notice.create({
    data: {
      organizationId: org.id,
      title: 'Annual General Meeting (AGM) 2026 Notice',
      content:
        'All resident members are cordially invited to attend the Annual General Meeting on Sunday, October 25th at 10:30 AM in the Community Hall. The agenda includes annual accounts review, elections for vacant executive committee seats, and campus CCTV upgrade approval.',
      type: 'MEETING',
      status: 'PUBLISHED',
      channels: 'IN_APP,WHATSAPP',
      publishedAt: new Date(),
      publishedBy: 'Vikram Malhotra (President)',
    },
  })

  await prisma.notice.create({
    data: {
      organizationId: org.id,
      title: 'Water Tank Cleaning Schedule for Block A & B',
      content:
        'Please be informed that routine overhead water tank cleaning is scheduled for Tuesday from 9:00 AM to 1:00 PM. Water supply will remain paused during these hours. Kindly store sufficient water in advance.',
      type: 'MAINTENANCE',
      status: 'PUBLISHED',
      channels: 'IN_APP',
      publishedAt: new Date(Date.now() - 86400000),
      publishedBy: 'Pooja Sharma (Treasurer)',
    },
  })

  await prisma.notice.create({
    data: {
      organizationId: org.id,
      title: 'Diwali Lighting & Cultural Evening - Registration Open',
      content:
        'Join us for an evening of cultural performances, food stalls, and festive lights on Nov 8th. Residents wishing to register their kids for dance or music performances may contact the cultural committee.',
      type: 'EVENT',
      status: 'PUBLISHED',
      channels: 'IN_APP',
      publishedAt: new Date(Date.now() - 172800000),
      publishedBy: 'Cultural Committee',
    },
  })

  // 8. Complaints - start clean with 0 records


  // 9. Amenities
  const clubHouse = await prisma.amenity.create({
    data: {
      organizationId: org.id,
      name: 'Clubhouse Banquet Hall',
      description: 'Air-conditioned hall with seating for up to 100 people and pantry area',
      bookingFee: 2500,
      capacityPersons: 100,
      timingsFrom: '09:00',
      timingsTo: '22:00',
      isActive: true,
      rules: 'No loud music after 10 PM. Hall to be vacated in clean condition.',
    },
  })

  const badmintonCourt = await prisma.amenity.create({
    data: {
      organizationId: org.id,
      name: 'Indoor Badminton Court',
      description: 'Wooden flooring court with LED floodlights',
      bookingFee: 0,
      capacityPersons: 4,
      timingsFrom: '06:00',
      timingsTo: '21:00',
      isActive: true,
      rules: 'Non-marking shoes mandatory.',
    },
  })

  // 10. Sample Notifications
  await prisma.notification.create({
    data: {
      organizationId: org.id,
      userId: residentUser1.id,
      title: 'Maintenance Invoice Generated',
      message: 'Your monthly maintenance bill of ₹5,030 for Oct 2026 is due on 15 Oct.',
      type: 'INVOICE',
      referenceType: 'INVOICE',
      referenceId: 'INV-OCT-2026',
    },
  })

  await prisma.notification.create({
    data: {
      organizationId: org.id,
      userId: residentUser1.id,
      title: 'Complaint Update: TKT-2026-084',
      message: 'Admin commented: Plumber Manoj has been assigned for 4 PM visit.',
      type: 'COMPLAINT',
      referenceType: 'COMPLAINT',
      referenceId: 'TKT-2026-084',
    },
  })

  console.log('✅ Seed completed successfully!')
  console.log('----------------------------------------------------')
  console.log('Test Accounts:')
  console.log('1. Admin:    Phone: 9876543210 | Password: admin123    (OTP: any 6-digit or 123456)')
  console.log('2. Resident: Phone: 9876543212 | Password: resident123 (Flat: A-101, Due Bill: ₹5,030)')
  console.log('3. Resident: Phone: 9876543213 | Password: resident123 (Flat: B-204, Paid Bill)')
  console.log('----------------------------------------------------')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
