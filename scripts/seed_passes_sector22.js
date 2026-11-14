const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const orgId = 'cmvm5febw0037i1h2pou6gfpz';
  const passes = [
    { passCode: 'PASS-22001', otpPin: '4821', visitorName: 'Amitava Sen', visitorPhone: '9818123456', visitorType: 'GUEST', vehicleNumber: 'CH 01 BG 4421', purpose: 'Family dinner & weekend meet', residentName: 'Dr. Vikram Malhotra', residentPhone: '9812345678', residentUnit: 'A-402', gateNumber: 'Gate 1 - Main Gate', status: 'CHECKED_IN', notes: 'Parked in Guest Bay G-04', checkedInBy: 'Ram Singh (Gate 1)', checkedInAt: new Date() },
    { passCode: 'PASS-22002', otpPin: '7392', visitorName: 'Raju Kumar (Zomato)', visitorPhone: '9829384756', visitorType: 'DELIVERY', vehicleNumber: 'PB 65 AB 7712', purpose: 'Food delivery #ZOM-88219', residentName: 'Ananya Sharma', residentPhone: '9823456789', residentUnit: 'B-201', gateNumber: 'Gate 1 - Main Gate', status: 'APPROVED', notes: 'Direct intercom verified with flat' },
    { passCode: 'PASS-22003', otpPin: '2490', visitorName: 'Sukhwinder Singh (Uber)', visitorPhone: '9872109834', visitorType: 'CAB', vehicleNumber: 'HR 26 DQ 8832', purpose: 'Airport drop cab pickup', residentName: 'Rajesh Kumar', residentPhone: '9834567890', residentUnit: 'A-104', gateNumber: 'Gate 1 - Main Gate', status: 'CHECKED_IN', notes: '5 min waiting allowed at porch', checkedInBy: 'Ram Singh (Gate 1)', checkedInAt: new Date() },
    { passCode: 'PASS-22004', otpPin: '6115', visitorName: 'Manoj (Urban Company)', visitorPhone: '9811223344', visitorType: 'SERVICE', vehicleNumber: 'PB 01 XY 3302', purpose: 'RO Water Purifier Service', residentName: 'Sunil Verma', residentPhone: '9845678901', residentUnit: 'B-305', gateNumber: 'Gate 2 - Service Gate', status: 'CHECKED_IN', notes: 'Service toolkit verified by security', checkedInBy: 'Ram Singh (Gate 1)', checkedInAt: new Date() },
    { passCode: 'PASS-22005', otpPin: '8204', visitorName: 'Pooja Singhania', visitorPhone: '9876501234', visitorType: 'GUEST', vehicleNumber: 'DL 3C AU 9901', purpose: 'Family celebration visit', residentName: 'Meenakshi Sundaram', residentPhone: '9856789012', residentUnit: 'A-301', gateNumber: 'Gate 1 - Main Gate', status: 'CHECKED_OUT', notes: 'Exited campus at Gate 1', checkedInBy: 'Ram Singh (Gate 1)', checkedOutBy: 'Suraj Sharma (Gate 1)', checkedInAt: new Date(), checkedOutAt: new Date() },
    { passCode: 'PASS-22006', otpPin: '3187', visitorName: 'Mukesh (Amazon Logistics)', visitorPhone: '9833445566', visitorType: 'DELIVERY', vehicleNumber: 'PB 02 C 1290', purpose: 'Amazon parcel delivery', residentName: 'Rohit Bansal', residentPhone: '9867890123', residentUnit: 'A-202', gateNumber: 'Gate 2 - Service Gate', status: 'CHECKED_OUT', notes: 'Heavy appliance delivery', checkedInBy: 'Ram Singh (Gate 1)', checkedOutBy: 'Ram Singh (Gate 1)', checkedInAt: new Date(), checkedOutAt: new Date() }
  ];

  for (const p of passes) {
    const existing = await prisma.entryPass.findUnique({ where: { passCode: p.passCode } });
    if (!existing) {
      await prisma.entryPass.create({
        data: {
          ...p,
          organizationId: orgId,
          validFrom: new Date(Date.now() - 3600000),
          validUntil: new Date(Date.now() + 86400000),
        }
      });
      console.log('Created pass:', p.passCode);
    }
  }
  console.log('Done seeding Sector 22 passes');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
