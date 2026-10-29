const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAllOrgs() {
  const orgs = await prisma.organization.findMany();
  console.log(`Found ${orgs.length} organizations to seed complaints for.`);

  const casesData = [
    // --- MONDAY (2 cases) ---
    {
      name: 'Victor Royce',
      phone: '9833344455',
      title: 'Water Pipe Seepage in Kitchen Corner',
      category: 'Repair',
      status: 'OPEN',
      priority: 'HIGH',
      assignedTo: 'Housing Team',
      date: '2026-10-12T09:15:00.000Z',
      updatedAt: '2026-10-12T11:30:00.000Z',
    },
    {
      name: 'Glenna Beaumont',
      phone: '9811122233',
      title: 'Late Night Balcony Noise Complaint',
      category: 'Complaint',
      status: 'OPEN',
      priority: 'MEDIUM',
      assignedTo: 'CS Team',
      date: '2026-10-12T14:20:00.000Z',
      updatedAt: null,
    },

    // --- TUESDAY (4 cases) ---
    {
      name: 'Carey Murgatroyd',
      phone: '9822233344',
      title: 'Quarterly Maintenance Audit Minutes Request',
      category: 'FOI request',
      status: 'IN_PROGRESS',
      priority: 'LOW',
      assignedTo: 'DP Team',
      date: '2026-10-13T08:30:00.000Z',
      updatedAt: '2026-10-13T10:15:00.000Z',
    },
    {
      name: 'Glenna Beaumont',
      phone: '9811122233',
      title: 'Common Corridor Trash Bin Overflow',
      category: 'Waste',
      status: 'OPEN',
      priority: 'MEDIUM',
      assignedTo: 'CS Team',
      date: '2026-10-13T11:00:00.000Z',
      updatedAt: null,
    },
    {
      name: 'Victor Royce',
      phone: '9833344455',
      title: 'Passenger Elevator Sensor Calibration',
      category: 'Repair',
      status: 'OPEN',
      priority: 'HIGH',
      assignedTo: 'Housing Team',
      date: '2026-10-13T12:15:00.000Z',
      updatedAt: '2026-10-13T12:55:00.000Z',
    },
    {
      name: 'Carey Murgatroyd',
      phone: '9822233344',
      title: 'Parking Bay Unauthorized Vehicle Parked',
      category: 'Complaint',
      status: 'OPEN',
      priority: 'MEDIUM',
      assignedTo: 'CS Team',
      date: '2026-10-13T16:45:00.000Z',
      updatedAt: null,
    },

    // --- WEDNESDAY (5 cases) ---
    {
      name: 'Carey Murgatroyd',
      phone: '9822233344',
      title: 'CCTV Footage Request for Main Gate #2',
      category: 'FOI request',
      status: 'IN_PROGRESS',
      priority: 'LOW',
      assignedTo: 'DP Team',
      date: '2026-10-14T07:15:00.000Z',
      updatedAt: '2026-10-14T09:15:00.000Z',
    },
    {
      name: 'Glenna Beaumont',
      phone: '9811122233',
      title: 'Tenant Verification & Move-in Pass',
      category: 'Admission',
      status: 'OPEN',
      priority: 'MEDIUM',
      assignedTo: 'CS Team',
      date: '2026-10-14T10:00:00.000Z',
      updatedAt: null,
    },
    {
      name: 'Victor Royce',
      phone: '9833344455',
      title: 'Main Lobby Glass Door Closer Repair',
      category: 'Repair',
      status: 'OPEN',
      priority: 'HIGH',
      assignedTo: 'Housing Team',
      date: '2026-10-14T11:30:00.000Z',
      updatedAt: '2026-10-14T13:00:00.000Z',
    },
    {
      name: 'Glenna Beaumont',
      phone: '9811122233',
      title: 'Clubhouse Music Beyond Allowed Hours',
      category: 'Complaint',
      status: 'OPEN',
      priority: 'MEDIUM',
      assignedTo: 'CS Team',
      date: '2026-10-14T15:20:00.000Z',
      updatedAt: null,
    },
    {
      name: 'Carey Murgatroyd',
      phone: '9822233344',
      title: 'Septic & Organic Waste Segregation Bag Shortage',
      category: 'Waste',
      status: 'RESOLVED',
      priority: 'LOW',
      assignedTo: 'CS Team',
      date: '2026-10-14T17:40:00.000Z',
      updatedAt: '2026-10-14T18:30:00.000Z',
    },

    // --- THURSDAY (7 cases) ---
    {
      name: 'Glenna Beaumont',
      phone: '9811122233',
      title: 'Dog Leash Bylaw Non-Compliance at Garden Path',
      category: 'Complaint',
      status: 'OPEN',
      priority: 'MEDIUM',
      assignedTo: 'CS Team',
      date: '2026-10-15T08:39:00.000Z',
      updatedAt: null,
    },
    {
      name: 'Carey Murgatroyd',
      phone: '9822233344',
      title: 'Society Bye-Laws PDF & Election Rule Request',
      category: 'FOI request',
      status: 'IN_PROGRESS',
      priority: 'LOW',
      assignedTo: 'DP Team',
      date: '2026-10-15T09:45:00.000Z',
      updatedAt: '2026-10-15T11:20:00.000Z',
    },
    {
      name: 'Victor Royce',
      phone: '9833344455',
      title: 'Basement Fire Hose Valve Gasket Replacement',
      category: 'Repair',
      status: 'OPEN',
      priority: 'HIGH',
      assignedTo: 'Housing Team',
      date: '2026-10-15T11:15:00.000Z',
      updatedAt: '2026-10-15T14:10:00.000Z',
    },
    {
      name: 'Glenna Beaumont',
      phone: '9811122233',
      title: 'Visitor Vehicle Blocking Driveway Access',
      category: 'Complaint',
      status: 'OPEN',
      priority: 'MEDIUM',
      assignedTo: 'CS Team',
      date: '2026-10-15T13:30:00.000Z',
      updatedAt: null,
    },
    {
      name: 'Carey Murgatroyd',
      phone: '9822233344',
      title: 'Maintenance Dues Online Receipt Not Generated',
      category: 'Collection',
      status: 'OPEN',
      priority: 'MEDIUM',
      assignedTo: 'CS Team',
      date: '2026-10-15T15:00:00.000Z',
      updatedAt: null,
    },
    {
      name: 'Victor Royce',
      phone: '9833344455',
      title: 'Domestic Staff RFID Badge & Security Registration',
      category: 'Admission',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      assignedTo: 'CS Team',
      date: '2026-10-15T16:20:00.000Z',
      updatedAt: '2026-10-15T17:00:00.000Z',
    },
    {
      name: 'Glenna Beaumont',
      phone: '9811122233',
      title: 'Garden Sprinkler Overspray on Parked Vehicles',
      category: 'Complaint',
      status: 'OPEN',
      priority: 'MEDIUM',
      assignedTo: 'CS Team',
      date: '2026-10-15T18:00:00.000Z',
      updatedAt: null,
    },

    // --- FRIDAY (9 cases - Peak) ---
    {
      name: 'Victor Royce',
      phone: '9833344455',
      title: 'Main Sump Pump Float Switch Failure',
      category: 'Repair',
      status: 'OPEN',
      priority: 'HIGH',
      assignedTo: 'Housing Team',
      date: '2026-10-16T08:15:00.000Z',
      updatedAt: '2026-10-16T09:40:00.000Z',
    },
    {
      name: 'Carey Murgatroyd',
      phone: '9822233344',
      title: 'Annual Pest Control Vendor Contract Disclosure',
      category: 'FOI request',
      status: 'IN_PROGRESS',
      priority: 'LOW',
      assignedTo: 'DP Team',
      date: '2026-10-16T09:30:00.000Z',
      updatedAt: '2026-10-16T11:00:00.000Z',
    },
    {
      name: 'Glenna Beaumont',
      phone: '9811122233',
      title: 'Delivery Courier Horn Honking Near Block A',
      category: 'Complaint',
      status: 'OPEN',
      priority: 'MEDIUM',
      assignedTo: 'CS Team',
      date: '2026-10-16T10:45:00.000Z',
      updatedAt: null,
    },
    {
      name: 'Carey Murgatroyd',
      phone: '9822233344',
      title: 'Door-to-Door Waste Collection Delay on 3rd Floor',
      category: 'Waste',
      status: 'OPEN',
      priority: 'MEDIUM',
      assignedTo: 'CS Team',
      date: '2026-10-16T11:50:00.000Z',
      updatedAt: null,
    },
    {
      name: 'Glenna Beaumont',
      phone: '9811122233',
      title: 'Direct Debit Maintenance Fee Double Deduction',
      category: 'Collection',
      status: 'OPEN',
      priority: 'HIGH',
      assignedTo: 'CS Team',
      date: '2026-10-16T13:10:00.000Z',
      updatedAt: '2026-10-16T14:30:00.000Z',
    },
    {
      name: 'Victor Royce',
      phone: '9833344455',
      title: 'New Vehicle Sticker Registration & Fastag Sync',
      category: 'Admission',
      status: 'RESOLVED',
      priority: 'LOW',
      assignedTo: 'CS Team',
      date: '2026-10-16T14:30:00.000Z',
      updatedAt: '2026-10-16T16:00:00.000Z',
    },
    {
      name: 'Glenna Beaumont',
      phone: '9811122233',
      title: 'Stray Cat Nuisance in Basement Stairwell',
      category: 'Complaint',
      status: 'OPEN',
      priority: 'MEDIUM',
      assignedTo: 'CS Team',
      date: '2026-10-16T15:45:00.000Z',
      updatedAt: null,
    },
    {
      name: 'Carey Murgatroyd',
      phone: '9822233344',
      title: 'Horticulture Green Waste Disposal Collection',
      category: 'Waste',
      status: 'RESOLVED',
      priority: 'LOW',
      assignedTo: 'CS Team',
      date: '2026-10-16T17:00:00.000Z',
      updatedAt: '2026-10-16T17:45:00.000Z',
    },
    {
      name: 'Glenna Beaumont',
      phone: '9811122233',
      title: 'Corridor Lighting Flickering at Entrance 2',
      category: 'Complaint',
      status: 'RESOLVED',
      priority: 'LOW',
      assignedTo: 'Housing Team',
      date: '2026-10-16T18:20:00.000Z',
      updatedAt: '2026-10-16T19:10:00.000Z',
    },

    // --- SATURDAY (5 cases) ---
    {
      name: 'Glenna Beaumont',
      phone: '9811122233',
      title: 'Clubhouse Banquet Hall AC Noise Complaint',
      category: 'Complaint',
      status: 'OPEN',
      priority: 'MEDIUM',
      assignedTo: 'CS Team',
      date: '2026-10-17T09:00:00.000Z',
      updatedAt: null,
    },
    {
      name: 'Carey Murgatroyd',
      phone: '9822233344',
      title: 'Dry & Wet Waste Bin Placement in Block B',
      category: 'Waste',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      assignedTo: 'CS Team',
      date: '2026-10-17T11:20:00.000Z',
      updatedAt: '2026-10-17T13:00:00.000Z',
    },
    {
      name: 'Victor Royce',
      phone: '9833344455',
      title: 'Move-in Elevator Padding Request for Flat B-302',
      category: 'Admission',
      status: 'RESOLVED',
      priority: 'LOW',
      assignedTo: 'Housing Team',
      date: '2026-10-17T13:40:00.000Z',
      updatedAt: '2026-10-17T14:30:00.000Z',
    },
    {
      name: 'Carey Murgatroyd',
      phone: '9822233344',
      title: 'Billing Sinking Fund Surcharge Clarification',
      category: 'Collection',
      status: 'IN_PROGRESS',
      priority: 'LOW',
      assignedTo: 'CS Team',
      date: '2026-10-17T15:30:00.000Z',
      updatedAt: '2026-10-17T16:15:00.000Z',
    },
    {
      name: 'Glenna Beaumont',
      phone: '9811122233',
      title: 'Swimming Pool Filter High Chlorine Odor',
      category: 'Complaint',
      status: 'OPEN',
      priority: 'HIGH',
      assignedTo: 'CS Team',
      date: '2026-10-17T17:15:00.000Z',
      updatedAt: null,
    },

    // --- SUNDAY (1 case) ---
    {
      name: 'Glenna Beaumont',
      phone: '9811122233',
      title: 'Car Washing Pressure Hose Blockage in Basement',
      category: 'Complaint',
      status: 'OPEN',
      priority: 'MEDIUM',
      assignedTo: 'CS Team',
      date: '2026-10-18T10:30:00.000Z',
      updatedAt: null,
    },
  ];

  for (const org of orgs) {
    console.log(`Processing org: ${org.name} (${org.id})`);

    // Clean existing complaints in this org
    const orgComplaints = await prisma.complaint.findMany({ where: { organizationId: org.id }, select: { id: true } });
    if (orgComplaints.length > 0) {
      const cIds = orgComplaints.map(c => c.id);
      await prisma.complaintComment.deleteMany({ where: { complaintId: { in: cIds } } });
      await prisma.complaint.deleteMany({ where: { organizationId: org.id } });
    }

    // Get or create reporter users in this org
    const userMap = {};
    for (const item of casesData) {
      if (!userMap[item.name]) {
        let u = await prisma.user.findFirst({ where: { organizationId: org.id, name: item.name } });
        if (!u) {
          u = await prisma.user.create({
            data: {
              organizationId: org.id,
              name: item.name,
              phone: item.phone + String(Math.floor(100 + Math.random() * 900)),
              email: `${item.name.toLowerCase().replace(' ', '.')}.${org.id.slice(-4)}@society.in`,
              role: 'RESIDENT',
              status: 'ACTIVE',
            },
          });
        }
        userMap[item.name] = u;
      }
    }

    // Seed 33 cases
    for (let i = 0; i < casesData.length; i++) {
      const item = casesData[i];
      const u = userMap[item.name];
      const ticketNumber = `TKT-${org.id.slice(-4).toUpperCase()}-${String(3000 + i + 1).padStart(4, '0')}`;
      await prisma.complaint.create({
        data: {
          organizationId: org.id,
          raisedById: u.id,
          ticketNumber,
          title: item.title,
          description: item.title + '. Logged via society helpdesk.',
          category: item.category,
          status: item.status,
          priority: item.priority,
          assignedTo: item.assignedTo,
          createdAt: new Date(item.date),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(item.date),
        },
      });
    }

    const cCount = await prisma.complaint.count({ where: { organizationId: org.id } });
    console.log(`Org ${org.name}: successfully seeded ${cCount} complaints!`);
  }

  console.log('Finished seeding all organizations!');
}

seedAllOrgs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
