const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function resetCleanSlate() {
  console.log('--- Starting Complete Clean Slate Database Reset ---');

  // 1. Delete dependent models in order
  console.log('Purging AuditLogs...');
  await prisma.auditLog.deleteMany({});

  console.log('Purging AmenityBookings & Amenities...');
  await prisma.amenityBooking.deleteMany({});
  await prisma.amenity.deleteMany({});

  console.log('Purging Notifications...');
  await prisma.notification.deleteMany({});

  console.log('Purging Documents...');
  await prisma.document.deleteMany({});

  console.log('Purging ComplaintComments & Complaints...');
  await prisma.complaintComment.deleteMany({});
  await prisma.complaint.deleteMany({});

  console.log('Purging Meetings...');
  await prisma.meeting.deleteMany({});

  console.log('Purging Notices...');
  await prisma.notice.deleteMany({});

  console.log('Purging Expenses...');
  await prisma.expense.deleteMany({});

  console.log('Purging Payments & Invoices...');
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});

  console.log('Purging Charges & Funds...');
  await prisma.chargeHead.deleteMany({});
  await prisma.fundHead.deleteMany({});

  console.log('Purging Vehicles...');
  await prisma.vehicle.deleteMany({});

  console.log('Purging Sessions & OtpCodes...');
  await prisma.session.deleteMany({});
  await prisma.otpCode.deleteMany({});

  console.log('Purging Users...');
  await prisma.user.deleteMany({});

  console.log('Purging Units & Blocks...');
  await prisma.unit.deleteMany({});
  await prisma.block.deleteMany({});

  console.log('Purging Organizations (all societies)...');
  await prisma.organization.deleteMany({});

  // 2. Hash Super Admin PIN 4550
  console.log('Seeding Super Admin (8219587657) with PIN 4550...');
  const hashedPin = await bcrypt.hash('4550', 12);

  const superAdmin = await prisma.user.create({
    data: {
      phone: '8219587657',
      name: 'Super Admin',
      role: 'PLATFORM_ADMIN',
      status: 'ACTIVE',
      passwordHash: hashedPin,
      organizationId: null,
      unitId: null,
    },
  });

  console.log('Super Admin created successfully:', {
    id: superAdmin.id,
    phone: superAdmin.phone,
    name: superAdmin.name,
    role: superAdmin.role,
  });

  // Verify PIN matches
  const match = await bcrypt.compare('4550', superAdmin.passwordHash);
  console.log('PIN 4550 bcrypt verification test:', match ? 'PASSED (valid)' : 'FAILED');

  // 3. Reset settings_store.json
  const settingsStorePath = path.join(__dirname, '..', 'settings_store.json');
  fs.writeFileSync(settingsStorePath, JSON.stringify({}, null, 2), 'utf-8');
  console.log('settings_store.json has been reset to {}');

  // Final count checks
  const orgCount = await prisma.organization.count();
  const userCount = await prisma.user.count();
  const unitCount = await prisma.unit.count();

  console.log('--- Database Reset Complete ---');
  console.log(`Societies remaining: ${orgCount}`);
  console.log(`Users remaining: ${userCount}`);
  console.log(`Units remaining: ${unitCount}`);
}

resetCleanSlate()
  .catch((e) => {
    console.error('Error during database reset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
