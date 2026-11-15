const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function wipe() {
  const steps = [
    () => prisma.otpCode.deleteMany(),
    () => prisma.session.deleteMany(),
    () => prisma.notification.deleteMany(),
    () => prisma.complaintComment.deleteMany(),
    () => prisma.complaint.deleteMany(),
    () => prisma.payment.deleteMany(),
    () => prisma.invoiceItem.deleteMany(),
    () => prisma.invoice.deleteMany(),
    () => prisma.document.deleteMany(),
    () => prisma.amenityBooking.deleteMany(),
    () => prisma.amenity.deleteMany(),
    () => prisma.entryPass.deleteMany(),
    () => prisma.staffDuty.deleteMany(),
    () => prisma.emergencyContact.deleteMany(),
    () => prisma.auditLog.deleteMany(),
    () => prisma.expense.deleteMany(),
    () => prisma.notice.deleteMany(),
    () => prisma.meeting.deleteMany(),
    () => prisma.vehicle.deleteMany(),
    () => prisma.chargeHead.deleteMany(),
    () => prisma.fundHead.deleteMany(),
    () => prisma.unit.deleteMany(),
    () => prisma.block.deleteMany(),
    () => prisma.user.deleteMany(),
    () => prisma.organization.deleteMany(),
  ]

  for (const step of steps) {
    const result = await step()
    console.log('deleted', result.count)
  }

  const stores = [
    'staff_store.json',
    'committee_store.json',
    'settings_store.json',
    'documents_store.json',
    'compliance_store.json',
    'platform_subscriptions_store.json',
  ]
  for (const name of stores) {
    const file = path.join(__dirname, '..', name)
    if (fs.existsSync(file)) {
      fs.writeFileSync(file, '{}\n')
      console.log('cleared', name)
    }
  }

  const users = await prisma.user.count()
  const orgs = await prisma.organization.count()
  console.log('remaining users', users, 'organizations', orgs)
}

wipe()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
