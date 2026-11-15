const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const names = [
  'Ram Singh', 'Dharmendra Kumar', 'Bijender Yadav', 'Manoj Tiwari', 'Suraj Sharma',
  'Ramesh Paswan', 'Sunita Devi', 'Rekha Rani', 'Mahesh Electrician', 'Shankar Plumber', 'Radhey Shyam',
]
const phones = [
  '9876543231', '9876543232', '9876543233', '9876543234', '9876543235',
  '9876543236', '9876543237', '9876543238', '9876543239', '9876543240', '9876543241',
]

async function main() {
  const users = await prisma.user.findMany({
    where: { OR: [{ name: { in: names } }, { phone: { in: phones } }] },
    select: { id: true, name: true, phone: true, role: true },
  })
  console.log('Matching users:', users)

  const duties = await prisma.staffDuty.deleteMany({
    where: { OR: [{ staffName: { in: names } }, { phone: { in: phones } }] },
  })
  console.log('Deleted staff duties:', duties.count)

  const ids = users.filter((u) => u.role === 'STAFF').map((u) => u.id)
  if (ids.length) {
    await prisma.payment.updateMany({ where: { userId: { in: ids } }, data: { userId: null } })
    await prisma.complaint.deleteMany({ where: { raisedById: { in: ids } } })
    await prisma.document.deleteMany({ where: { uploadedById: { in: ids } } })
    const deleted = await prisma.user.deleteMany({ where: { id: { in: ids } } })
    console.log('Deleted sample staff users:', deleted.count)
  } else {
    console.log('No STAFF users to delete')
  }

  const passCodes = [
    'PASS-84920', 'PASS-61294', 'PASS-99381', 'PASS-55201', 'PASS-41890', 'PASS-73019',
    'PASS-22001', 'PASS-22002', 'PASS-22003', 'PASS-22004', 'PASS-22005', 'PASS-22006',
  ]
  const passes = await prisma.entryPass.deleteMany({
    where: { passCode: { in: passCodes } },
  })
  console.log('Deleted sample visitor passes:', passes.count)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
