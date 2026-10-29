const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  console.log('Cleaning dummy complaints, payments, and invoices...');
  const deletedComments = await prisma.complaintComment.deleteMany();
  console.log('Deleted complaint comments:', deletedComments.count);

  const deletedComplaints = await prisma.complaint.deleteMany();
  console.log('Deleted complaints:', deletedComplaints.count);

  const deletedPayments = await prisma.payment.deleteMany();
  console.log('Deleted payments:', deletedPayments.count);

  const deletedInvoiceItems = await prisma.invoiceItem.deleteMany();
  console.log('Deleted invoice items:', deletedInvoiceItems.count);

  const deletedInvoices = await prisma.invoice.deleteMany();
  console.log('Deleted invoices:', deletedInvoices.count);

  // Update units: if ownerName is null or empty, ensure occupancyStatus is VACANT
  const vacantUpdate = await prisma.unit.updateMany({
    where: {
      ownerName: null,
      tenantName: null,
    },
    data: {
      occupancyStatus: 'VACANT',
    },
  });
  console.log('Set vacant status on unassigned units:', vacantUpdate.count);

  console.log('Done database cleanup!');
}

clean()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
