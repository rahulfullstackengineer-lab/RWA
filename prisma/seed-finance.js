const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findUnique({
    where: { id: 'cmutll6x4000m53u0qjq16wno' },
  });
  if (!org) {
    console.error('Sector 22 org not found');
    return;
  }

  console.log('Targeting active org:', org.name, org.id);

  // Check or create charge heads
  let maintCharge = await prisma.chargeHead.findFirst({
    where: { organizationId: org.id, name: 'Monthly Maintenance' },
  });

  if (!maintCharge) {
    maintCharge = await prisma.chargeHead.create({
      data: {
        organizationId: org.id,
        name: 'Monthly Maintenance',
        frequency: 'MONTHLY',
        basis: 'FIXED',
        amount: 3000,
        gstPercent: 0,
        isActive: true,
      },
    });
    console.log('Created Monthly Maintenance charge head');
  }

  let sinkingCharge = await prisma.chargeHead.findFirst({
    where: { organizationId: org.id, name: 'Sinking Fund' },
  });

  if (!sinkingCharge) {
    sinkingCharge = await prisma.chargeHead.create({
      data: {
        organizationId: org.id,
        name: 'Sinking Fund',
        frequency: 'MONTHLY',
        basis: 'FIXED',
        amount: 200,
        gstPercent: 0,
        isActive: true,
      },
    });
    console.log('Created Sinking Fund charge head');
  }

  const billingMonth = '2026-10';
  const units = await prisma.unit.findMany({ where: { organizationId: org.id } });
  console.log(`Found ${units.length} units in ${org.name}`);

  let created = 0;
  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const existing = await prisma.invoice.findFirst({
      where: { organizationId: org.id, unitId: unit.id, billingMonth },
    });
    if (existing) continue;

    const totalAmount = 3200;
    const invoiceNumber = `INV-2610-${unit.unitNumber.replace(/[^A-Za-z0-9]/g, '')}`;
    const dueDate = new Date(2026, 9, 15);

    let status = 'ISSUED';
    let paidAmount = 0;
    let balanceAmount = totalAmount;
    let paidAt = null;

    if (i < 40) {
      status = 'PAID';
      paidAmount = totalAmount;
      balanceAmount = 0;
      paidAt = new Date();
    } else if (i >= 40 && i < 65) {
      status = 'OVERDUE';
    }

    const inv = await prisma.invoice.create({
      data: {
        organizationId: org.id,
        unitId: unit.id,
        invoiceNumber,
        billingMonth,
        dueDate,
        status,
        totalAmount,
        paidAmount,
        balanceAmount,
        issuedAt: new Date(),
        paidAt,
        items: {
          create: [
            {
              chargeHeadId: maintCharge.id,
              description: 'Monthly Maintenance Charge',
              amount: 3000,
              gstPercent: 0,
              gstAmount: 0,
              totalAmount: 3000,
            },
            {
              chargeHeadId: sinkingCharge.id,
              description: 'Sinking Fund Contribution',
              amount: 200,
              gstPercent: 0,
              gstAmount: 0,
              totalAmount: 200,
            },
          ],
        },
      },
    });

    if (status === 'PAID') {
      await prisma.payment.create({
        data: {
          organizationId: org.id,
          invoiceId: inv.id,
          amount: totalAmount,
          currency: 'INR',
          source: 'ONLINE_GATEWAY',
          status: 'SUCCESS',
          razorpayOrderId: `order_seed_${i}`,
          razorpayPaymentId: `pay_seed_${i}`,
          razorpaySignature: 'seed_verified_hmac',
          method: 'ONLINE',
          paidAt: new Date(),
        },
      });
    }

    created++;
  }

  console.log(`Successfully generated ${created} invoices for ${org.name}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
