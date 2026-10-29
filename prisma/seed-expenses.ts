import { prisma } from '../src/lib/prisma';

async function seedExpenses() {
  const orgs = await prisma.organization.findMany();
  console.log(`Found ${orgs.length} organizations.`);

  for (const org of orgs) {
    const count = await prisma.expense.count({ where: { organizationId: org.id } });
    if (count === 0) {
      console.log(`Seeding expenses for: ${org.name} (${org.id})`);
      await prisma.expense.createMany({
        data: [
          {
            organizationId: org.id,
            title: 'Monthly Security Guard Services',
            category: 'Security',
            vendorName: 'SkyGuard Security',
            amount: 42000,
            totalAmount: 42000,
            status: 'PAID',
            paidDate: new Date('2026-10-01'),
            approvedBy: 'Rajesh K',
            createdBy: 'Admin',
            createdAt: new Date('2026-10-01T10:00:00Z'),
          },
          {
            organizationId: org.id,
            title: 'Electrical Panel & Generator Maintenance',
            category: 'Maintenance',
            vendorName: 'Ashok Electricals',
            amount: 8400,
            totalAmount: 8400,
            status: 'APPROVED',
            approvedBy: 'Rajesh K',
            createdBy: 'Admin',
            createdAt: new Date('2026-09-28T14:30:00Z'),
          },
          {
            organizationId: org.id,
            title: 'Water Pipeline & Valve Repair — Block B',
            category: 'Plumbing',
            vendorName: 'Sharma Plumbing Works',
            amount: 3200,
            totalAmount: 3200,
            status: 'PENDING_APPROVAL',
            createdBy: 'Admin',
            createdAt: new Date('2026-09-26T11:15:00Z'),
          },
          {
            organizationId: org.id,
            title: 'Office Stationery & Meeting Registers',
            category: 'Admin',
            vendorName: 'Stationary Mart',
            amount: 1800,
            totalAmount: 1800,
            status: 'PAID',
            paidDate: new Date('2026-09-20'),
            approvedBy: 'Rajesh K',
            createdBy: 'Admin',
            createdAt: new Date('2026-09-20T09:45:00Z'),
          },
          {
            organizationId: org.id,
            title: 'Lawn Mowing & Monsoon Tree Trimming',
            category: 'Horticulture',
            vendorName: 'Green Thumb Gardens',
            amount: 12000,
            totalAmount: 12000,
            status: 'PENDING_APPROVAL',
            createdBy: 'Admin',
            createdAt: new Date('2026-09-15T16:00:00Z'),
          },
        ],
      });
    }
  }

  const total = await prisma.expense.count();
  console.log(`Expense seeding complete! Total expenses now: ${total}`);
}

seedExpenses()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
