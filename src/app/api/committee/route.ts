import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { notifyUsers } from '@/lib/socket-server'
import { logAudit } from '@/lib/audit'
import fs from 'fs'
import path from 'path'

const COMMITTEE_DATA_PATH = path.join(process.cwd(), 'committee_store.json')

async function publishElectionNotice(orgId: string, actorId: string, actorName: string, title: string, content: string) {
  const notice = await prisma.notice.create({
    data: {
      organizationId: orgId,
      title,
      content,
      type: 'ELECTION',
      channels: 'IN_APP',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      publishedBy: `${actorName} (Election Officer)`,
    },
  })
  await notifyUsers({
    orgId,
    roles: ['admin', 'resident'],
    excludeUserId: actorId,
    title: `Election notice: ${title}`,
    message: content,
    type: 'NOTICE',
    event: 'new-notice',
    referenceType: 'NOTICE',
    referenceId: notice.id,
    data: {
      id: notice.id,
      title: notice.title,
      type: notice.type,
      publishedBy: notice.publishedBy,
    },
  })
}

export interface CommitteeMember {
  id: string
  name: string
  role: string
  unit: string
  phone?: string
  email?: string
  termStart: string
  termEnd: string
  status: 'CURRENT' | 'PAST'
  color: string
  appointedDate: string
}

export interface Nomination {
  id: string
  candidateName: string
  unit: string
  phone?: string
  email?: string
  proposer: string
  seconder: string
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
  manifesto?: string
  votes: number
  userId?: string
  submittedAt: string
}

export interface ContestedPosition {
  id: string
  title: string
  seats: number
  eligibility: string
  nominations: Nomination[]
}

export interface ElectionCycle {
  id: string
  title: string
  term: string
  status: 'DRAFT' | 'NOMINATIONS_OPEN' | 'NOMINATIONS_CLOSED' | 'VOTING_ACTIVE' | 'RESULTS_DECLARED' | 'COMPLETED'
  nominationOpen: string
  nominationClose: string
  votingStart: string
  votingEnd: string
  secretBallot: boolean
  proxyAllowed: boolean
  votingMode: 'SECRET_BALLOT' | 'SHOW_OF_HANDS' | 'PAPER_BALLOT'
  totalEligibleVoters: number
  totalVotesCast: number
  positions: ContestedPosition[]
  ballots?: { userId: string; positionId: string; nominationId: string }[]
  createdAt: string
  updatedAt: string
}

export interface CommitteeStoreData {
  members: CommitteeMember[]
  election: ElectionCycle
}

async function getInitialRealData(orgId: string): Promise<CommitteeStoreData> {
  // Query actual users & units in the organization
  const realUsers = await prisma.user.findMany({
    where: { organizationId: orgId, status: 'ACTIVE' },
    include: { unit: true },
    take: 15,
  })

  const realUnits = await prisma.unit.findMany({
    where: { organizationId: orgId },
    take: 15,
  })

  // Build realistic committee roster based on actual db members
  const adminUser = realUsers.find((u) => u.role === 'RWA_ADMIN') || realUsers[0]
  const residentUsers = realUsers.filter((u) => u.id !== adminUser?.id)

  const adminName = adminUser ? adminUser.name : 'Rajesh Kumar'
  const adminUnit = adminUser?.unit ? adminUser.unit.unitNumber : 'A-1001'

  const member1 = residentUsers[0]
  const m1Name = member1 ? member1.name : 'Sunita Sharma'
  const m1Unit = member1?.unit ? member1.unit.unitNumber : 'A-1002'

  const member2 = residentUsers[1]
  const m2Name = member2 ? member2.name : 'Vijay Mehta'
  const m2Unit = member2?.unit ? member2.unit.unitNumber : 'B-501'

  const member3 = residentUsers[2]
  const m3Name = member3 ? member3.name : 'Kavita Gupta'
  const m3Unit = member3?.unit ? member3.unit.unitNumber : 'B-502'

  const member4 = residentUsers[3]
  const m4Name = member4 ? member4.name : 'Ritu Arora'
  const m4Unit = member4?.unit ? member4.unit.unitNumber : 'C-801'

  const defaultMembers: CommitteeMember[] = [
    {
      id: 'CM-01',
      name: adminName,
      role: 'President',
      unit: adminUnit,
      phone: adminUser?.phone || '1234567890',
      email: adminUser?.email || 'president@rwa.org',
      termStart: 'Apr 2026',
      termEnd: 'Mar 2027',
      status: 'CURRENT',
      color: 'blue',
      appointedDate: '2026-04-01',
    },
    {
      id: 'CM-02',
      name: m1Name,
      role: 'Secretary',
      unit: m1Unit,
      phone: member1?.phone || '9876543210',
      email: member1?.email || 'secretary@rwa.org',
      termStart: 'Apr 2026',
      termEnd: 'Mar 2027',
      status: 'CURRENT',
      color: 'green',
      appointedDate: '2026-04-01',
    },
    {
      id: 'CM-03',
      name: m2Name,
      role: 'Treasurer',
      unit: m2Unit,
      phone: member2?.phone || '9811223344',
      email: member2?.email || 'treasurer@rwa.org',
      termStart: 'Apr 2026',
      termEnd: 'Mar 2027',
      status: 'CURRENT',
      color: 'amber',
      appointedDate: '2026-04-01',
    },
    {
      id: 'CM-04',
      name: m3Name,
      role: 'Joint Secretary',
      unit: m3Unit,
      phone: member3?.phone || '9822334455',
      email: member3?.email || 'jointsec@rwa.org',
      termStart: 'Apr 2026',
      termEnd: 'Mar 2027',
      status: 'CURRENT',
      color: 'purple',
      appointedDate: '2026-04-01',
    },
    {
      id: 'CM-05',
      name: m4Name,
      role: 'Committee Member',
      unit: m4Unit,
      phone: member4?.phone || '9833445566',
      email: member4?.email || 'member@rwa.org',
      termStart: 'Apr 2026',
      termEnd: 'Mar 2027',
      status: 'CURRENT',
      color: 'teal',
      appointedDate: '2026-04-01',
    },
  ]

  const totalUnitsCount = await prisma.unit.count({ where: { organizationId: orgId } })

  const defaultElection: ElectionCycle = {
    id: 'ELEC-2027',
    title: 'Managing Committee Elections 2027',
    term: 'Apr 2027 – Mar 2028',
    status: 'DRAFT',
    nominationOpen: '2026-10-20',
    nominationClose: '2026-10-25',
    votingStart: '2026-10-27',
    votingEnd: '2026-10-28',
    secretBallot: true,
    proxyAllowed: false,
    votingMode: 'SECRET_BALLOT',
    totalEligibleVoters: totalUnitsCount,
    totalVotesCast: 0,
    positions: [
      {
        id: 'POS-01',
        title: 'President',
        seats: 1,
        eligibility: 'Flat owner resident for minimum 2 years with zero maintenance dues',
        nominations: [
          {
            id: 'NOM-101',
            candidateName: adminName,
            unit: adminUnit,
            phone: adminUser?.phone || '1234567890',
            proposer: m1Name + ` (${m1Unit})`,
            seconder: m2Name + ` (${m2Unit})`,
            status: 'APPROVED',
            manifesto: 'Complete solar rooftop grid and transparent ledger audits for all residents.',
            votes: 0,
            submittedAt: '2026-10-21T10:00:00Z',
          },
        ],
      },
      {
        id: 'POS-02',
        title: 'Secretary',
        seats: 1,
        eligibility: 'Flat owner with administrative experience and good standing',
        nominations: [
          {
            id: 'NOM-102',
            candidateName: m1Name,
            unit: m1Unit,
            phone: member1?.phone || '9876543210',
            proposer: adminName + ` (${adminUnit})`,
            seconder: m3Name + ` (${m3Unit})`,
            status: 'APPROVED',
            manifesto: 'Digital grievance redressal within 24 hours and quarterly townhalls.',
            votes: 0,
            submittedAt: '2026-10-21T11:30:00Z',
          },
        ],
      },
      {
        id: 'POS-03',
        title: 'Treasurer',
        seats: 1,
        eligibility: 'Finance/accounts background preferred. Mandatory owner resident.',
        nominations: [
          {
            id: 'NOM-103',
            candidateName: m2Name,
            unit: m2Unit,
            phone: member2?.phone || '9811223344',
            proposer: m1Name + ` (${m1Unit})`,
            seconder: m4Name + ` (${m4Unit})`,
            status: 'APPROVED',
            manifesto: 'Zero deficit budget, automated GST compliance, and high interest on sinking fund FDs.',
            votes: 0,
            submittedAt: '2026-10-22T09:15:00Z',
          },
        ],
      },
      {
        id: 'POS-04',
        title: 'Joint Secretary',
        seats: 1,
        eligibility: 'Owner resident in good standing',
        nominations: [
          {
            id: 'NOM-104',
            candidateName: m3Name,
            unit: m3Unit,
            phone: member3?.phone || '9822334455',
            proposer: m2Name + ` (${m2Unit})`,
            seconder: m1Name + ` (${m1Unit})`,
            status: 'APPROVED',
            manifesto: 'Youth and sports facilities upgrade in central clubhouse.',
            votes: 0,
            submittedAt: '2026-10-22T14:00:00Z',
          },
        ],
      },
      {
        id: 'POS-05',
        title: 'Committee Member (2 Seats)',
        seats: 2,
        eligibility: 'Registered society member with active tenancy or ownership',
        nominations: [
          {
            id: 'NOM-105',
            candidateName: m4Name,
            unit: m4Unit,
            phone: member4?.phone || '9833445566',
            proposer: adminName + ` (${adminUnit})`,
            seconder: m2Name + ` (${m2Unit})`,
            status: 'APPROVED',
            manifesto: 'Rainwater harvesting and waste segregation enforcement.',
            votes: 0,
            submittedAt: '2026-10-23T16:20:00Z',
          },
        ],
      },
    ],
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  }

  return {
    members: defaultMembers,
    election: defaultElection,
  }
}

async function getStoredCommitteeData(orgId: string): Promise<CommitteeStoreData> {
  try {
    if (fs.existsSync(COMMITTEE_DATA_PATH)) {
      const data = JSON.parse(fs.readFileSync(COMMITTEE_DATA_PATH, 'utf-8'))
      if (data && data[orgId]) {
        return data[orgId]
      }
    }
  } catch (e) {
    console.error('Error reading committee store:', e)
  }

  return {
    members: [],
    election: null as any,
  }
}

function pickWinners(position: ContestedPosition) {
  const seats = Math.max(1, Number(position.seats) || 1)
  const ballot = (position.nominations || [])
    .filter((n) => n.status === 'APPROVED' && Number(n.votes) > 0)
    .sort((a, b) => Number(b.votes) - Number(a.votes) || a.candidateName.localeCompare(b.candidateName))
  if (ballot.length === 0) return []
  const cutoff = Number(ballot[Math.min(seats, ballot.length) - 1].votes)
  const picked = ballot.filter((n, index) => index < seats || Number(n.votes) === cutoff)
  const above = picked.filter((n) => Number(n.votes) > cutoff).length
  const sharingCutoff = picked.filter((n) => Number(n.votes) === cutoff).length
  const tied = sharingCutoff > Math.max(0, seats - above)
  return picked.map((n) => ({
    id: n.id,
    candidateName: n.candidateName,
    unit: n.unit,
    votes: Number(n.votes) || 0,
    tied: tied && Number(n.votes) === cutoff,
  }))
}

function describeWinners(election: ElectionCycle) {
  return (election.positions || []).map((position) => {
    const winners = pickWinners(position)
    if (winners.length === 0) return `${position.title}: no winner`
    return `${position.title}: ${winners.map((winner) => `${winner.candidateName} (Flat ${winner.unit}, ${winner.votes} vote${winner.votes === 1 ? '' : 's'}${winner.tied ? ', tie' : ''})`).join('; ')}`
  }).join('\n')
}

function electionForMember(election: ElectionCycle | null, userId: string, phone?: string | null) {
  if (!election) return null
  const showCounts = election.status === 'RESULTS_DECLARED' || election.status === 'COMPLETED'
  const myVotes = (election.ballots || [])
    .filter((b) => b.userId === userId)
    .map((b) => ({ positionId: b.positionId, nominationId: b.nominationId }))
  return {
    id: election.id,
    title: election.title,
    term: election.term,
    status: election.status,
    nominationOpen: election.nominationOpen,
    nominationClose: election.nominationClose,
    votingStart: election.votingStart,
    votingEnd: election.votingEnd,
    secretBallot: election.secretBallot,
    totalEligibleVoters: election.totalEligibleVoters,
    totalVotesCast: showCounts ? election.totalVotesCast : undefined,
    winners: showCounts ? (election.positions || []).map((position) => ({
      positionId: position.id,
      title: position.title,
      seats: position.seats,
      winners: pickWinners(position),
    })) : [],
    myVotes,
    positions: (election.positions || []).map((p) => ({
      id: p.id,
      title: p.title,
      seats: p.seats,
      eligibility: p.eligibility,
      nominations: (p.nominations || [])
        .filter((n) => {
          const mine = n.userId === userId || (!!phone && !!n.phone && n.phone === phone)
          if (mine) return true
          return n.status === 'APPROVED'
        })
        .map((n) => ({
          id: n.id,
          candidateName: n.candidateName,
          unit: n.unit,
          status: n.status,
          manifesto: n.manifesto || '',
          votes: showCounts ? n.votes || 0 : undefined,
          mine: n.userId === userId || (!!phone && !!n.phone && n.phone === phone),
        })),
    })),
  }
}

function saveCommitteeData(orgId: string, data: CommitteeStoreData) {
  try {
    let allData: any = {}
    if (fs.existsSync(COMMITTEE_DATA_PATH)) {
      try {
        allData = JSON.parse(fs.readFileSync(COMMITTEE_DATA_PATH, 'utf-8'))
      } catch (e) {}
    }
    allData[orgId] = data
    fs.writeFileSync(COMMITTEE_DATA_PATH, JSON.stringify(allData, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error saving committee store:', e)
  }
}

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    if (!user.organizationId) return NextResponse.json({ members: [], election: null, availableResidents: [], availableUnits: [] })
    const orgId = user.organizationId
    const committeeData = await getStoredCommitteeData(orgId)

    // Also fetch registered residents and units for modal pickers
    const membersList = await prisma.user.findMany({
      where: { organizationId: orgId, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        unit: {
          select: {
            id: true,
            unitNumber: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    const unitsList = await prisma.unit.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        unitNumber: true,
        ownerName: true,
        ownerPhone: true,
      },
      orderBy: { unitNumber: 'asc' },
    })

    const officeRoles = ['RWA_ADMIN', 'ADMIN', 'TREASURER', 'SECRETARY', 'PRESIDENT', 'COMMITTEE_MEMBER', 'MANAGER', 'PLATFORM_ADMIN', 'PLATFORM_SUPER_ADMIN']
    if (!officeRoles.includes(user.role)) {
      return NextResponse.json({
        members: (committeeData.members || []).filter((m) => m.status === 'CURRENT').map((m) => ({
          id: m.id,
          name: m.name,
          role: m.role,
          unit: m.unit,
          termStart: m.termStart,
          termEnd: m.termEnd,
          status: m.status,
        })),
        election: electionForMember(committeeData.election, user.id, user.phone),
        availableResidents: [],
        availableUnits: [],
      })
    }

    return NextResponse.json({
      members: committeeData.members,
      election: committeeData.election,
      availableResidents: membersList,
      availableUnits: unitsList,
    })
  } catch (err: unknown) {
    console.error('Committee GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch committee data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body
    const auth = action === 'SELF_NOMINATE' ? await requireAuth(request) : await requireAdmin(request)
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Forbidden' }, { status: action === 'SELF_NOMINATE' ? 401 : 403 })
    }
    const user = auth.user

    const orgId = user.organizationId!
    const data = await getStoredCommitteeData(orgId)

    if (action === 'SELF_NOMINATE') {
      if (user.role !== 'RESIDENT') {
        return NextResponse.json({ error: 'Only a resident can nominate themselves from this screen' }, { status: 403 })
      }
      if (!data.election || data.election.status !== 'NOMINATIONS_OPEN') {
        return NextResponse.json({ error: 'Nominations are not open' }, { status: 400 })
      }
      const { positionId, manifesto } = body
      const pos = data.election.positions.find((p) => p.id === positionId)
      if (!pos) return NextResponse.json({ error: 'Position not found' }, { status: 404 })

      const resident = await prisma.user.findUnique({
        where: { id: user.id },
        include: { unit: true },
      })
      const unitNumber = resident?.unit?.unitNumber || ''
      if (!resident || !unitNumber) {
        return NextResponse.json({ error: 'Your flat is not linked yet. Ask the office to connect your flat before you nominate yourself.' }, { status: 400 })
      }

      const already = pos.nominations.find((n) => n.userId === user.id || (resident.phone && n.phone === resident.phone))
      if (already && already.status !== 'REJECTED' && already.status !== 'WITHDRAWN') {
        return NextResponse.json({ error: `You already have a nomination for ${pos.title}` }, { status: 400 })
      }

      const newNom: Nomination = {
        id: `NOM-${Date.now()}`,
        candidateName: resident.name,
        unit: unitNumber,
        phone: resident.phone || '',
        email: resident.email || '',
        proposer: 'Self nomination',
        seconder: '',
        status: 'PENDING_REVIEW',
        manifesto: manifesto ? String(manifesto).trim() : '',
        votes: 0,
        userId: user.id,
        submittedAt: new Date().toISOString(),
      }
      pos.nominations.push(newNom)
      saveCommitteeData(orgId, data)

      await notifyUsers({
        orgId,
        roles: ['admin'],
        excludeUserId: user.id,
        title: `Self nomination: ${resident.name} for ${pos.title}`,
        message: `${resident.name} (Flat ${unitNumber}) nominated themselves for ${pos.title}. Review it under Committee & Elections.`,
        type: 'ELECTION',
        event: 'new-notice',
        referenceType: 'Election',
        referenceId: data.election.id,
      }).catch(() => {})

      await notifyUsers({
        orgId,
        userIds: [user.id],
        title: `Nomination sent for ${pos.title}`,
        message: `Your nomination for ${pos.title} is with the society office. You will be told when it is approved or rejected.`,
        type: 'ELECTION',
        event: 'new-notice',
        referenceType: 'Election',
        referenceId: data.election.id,
      }).catch(() => {})

      return NextResponse.json({ success: true, nomination: { id: newNom.id, status: newNom.status }, message: 'Nomination sent to the office' })
    }

    // 1. Add / Appoint Committee Member
    if (action === 'ADD_MEMBER') {
      const { name, role, unit, phone, email, termStart = 'Apr 2026', termEnd = 'Mar 2027' } = body
      if (!name || !role) {
        return NextResponse.json({ error: 'Name and designation are required' }, { status: 400 })
      }

      const colors = ['blue', 'green', 'amber', 'purple', 'teal', 'red']
      const assignedColor = colors[Math.floor(Math.random() * colors.length)]

      const newMember: CommitteeMember = {
        id: `CM-${Date.now()}`,
        name: name.trim(),
        role: role.trim(),
        unit: unit ? unit.trim() : 'General',
        phone: phone ? phone.trim() : '',
        email: email ? email.trim() : '',
        termStart,
        termEnd,
        status: 'CURRENT',
        color: assignedColor,
        appointedDate: new Date().toISOString().split('T')[0],
      }

      data.members.push(newMember)
      saveCommitteeData(orgId, data)

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'COMMITTEE_MEMBER_APPOINTED',
        entityType: 'Committee',
        entityId: newMember.id,
        details: `Appointed ${newMember.name} as ${newMember.role} (${newMember.unit}) for term ${termStart} - ${termEnd}`,
        severity: 'INFO',
        newValues: newMember,
      })

      return NextResponse.json({ success: true, member: newMember, message: `${name} appointed as ${role} successfully` })
    }

    // 2. Add New Contested Position
    if (action === 'ADD_POSITION') {
      const { title, seats = 1, eligibility = 'Flat owner in good standing' } = body
      if (!title) return NextResponse.json({ error: 'Position title required' }, { status: 400 })

      const newPos: ContestedPosition = {
        id: `POS-${Date.now()}`,
        title: title.trim(),
        seats: Number(seats) || 1,
        eligibility: eligibility.trim(),
        nominations: [],
      }

      data.election.positions.push(newPos)
      saveCommitteeData(orgId, data)

      return NextResponse.json({ success: true, position: newPos, message: `Position "${title}" added to election` })
    }

    // 3. File Nomination for Candidate
    if (action === 'FILE_NOMINATION') {
      const { positionId, candidateName, unit, phone, email, proposer, seconder, manifesto } = body
      if (!positionId || !candidateName) {
        return NextResponse.json({ error: 'Position and candidate name are required' }, { status: 400 })
      }

      const pos = data.election.positions.find((p) => p.id === positionId)
      if (!pos) return NextResponse.json({ error: 'Position not found' }, { status: 404 })

      const newNom: Nomination = {
        id: `NOM-${Date.now()}`,
        candidateName: candidateName.trim(),
        unit: unit ? unit.trim() : 'A-1',
        phone: phone ? phone.trim() : '',
        email: email ? email.trim() : '',
        proposer: proposer ? proposer.trim() : `${user.name}`,
        seconder: seconder ? seconder.trim() : 'Committee Member',
        status: 'APPROVED',
        manifesto: manifesto ? manifesto.trim() : '',
        votes: 0,
        submittedAt: new Date().toISOString(),
      }

      pos.nominations.push(newNom)
      saveCommitteeData(orgId, data)

      await publishElectionNotice(
        orgId,
        user.id,
        user.name,
        `Nomination filed: ${candidateName}`,
        `${candidateName} (${newNom.unit}) was nominated for ${pos.title} in ${data.election.title}.`
      ).catch((err) => console.error('Nomination notice error:', err))

      return NextResponse.json({ success: true, nomination: newNom, message: `Nomination filed for ${candidateName}` })
    }

    // 4. Initialize New Election Cycle
    if (action === 'NEW_ELECTION') {
      const { title, term, nominationOpen, nominationClose, votingStart, votingEnd } = body
      const totalUnitsCount = await prisma.unit.count({ where: { organizationId: orgId } })

      const newElec: ElectionCycle = {
        id: `ELEC-${Date.now()}`,
        title: title || 'Managing Committee Elections 2027',
        term: term || 'Apr 2027 – Mar 2028',
        status: 'DRAFT',
        nominationOpen: nominationOpen || '2026-10-20',
        nominationClose: nominationClose || '2026-10-25',
        votingStart: votingStart || '2026-10-27',
        votingEnd: votingEnd || '2026-10-28',
        secretBallot: true,
        proxyAllowed: false,
        votingMode: 'SECRET_BALLOT',
        totalEligibleVoters: totalUnitsCount,
        totalVotesCast: 0,
        positions: [
          { id: 'POS-01', title: 'President', seats: 1, eligibility: 'Flat owner member for 2+ years', nominations: [] },
          { id: 'POS-02', title: 'Secretary', seats: 1, eligibility: 'Registered owner in good standing', nominations: [] },
          { id: 'POS-03', title: 'Treasurer', seats: 1, eligibility: 'Finance experience preferred', nominations: [] },
          { id: 'POS-04', title: 'Joint Secretary', seats: 1, eligibility: 'Owner resident', nominations: [] },
          { id: 'POS-05', title: 'Committee Member', seats: 2, eligibility: 'Active member', nominations: [] },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      data.election = newElec
      saveCommitteeData(orgId, data)

      await publishElectionNotice(
        orgId,
        user.id,
        user.name,
        `New election: ${newElec.title}`,
        `${newElec.title} (${newElec.term}) has been created. Nominations: ${newElec.nominationOpen} to ${newElec.nominationClose}. Voting: ${newElec.votingStart} to ${newElec.votingEnd}.`
      ).catch((err) => console.error('New election notice error:', err))

      return NextResponse.json({ success: true, election: newElec, message: 'New election cycle initialized' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: unknown) {
    console.error('Committee POST error:', err)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { action } = body
    const residentVote = action === 'CAST_VOTE'
    const auth = residentVote ? await requireAuth(request) : await requireAdmin(request)
    if (auth.error || !auth.user) return NextResponse.json({ error: auth.error || 'Forbidden' }, { status: 403 })
    const user = auth.user
    if (residentVote && user.role === 'STAFF') {
      return NextResponse.json({ error: 'Guards do not vote in society elections' }, { status: 403 })
    }

    const orgId = user.organizationId!

    const data = await getStoredCommitteeData(orgId)

    // 1. Update Election Timeline & Rules
    if (action === 'UPDATE_TIMELINE') {
      const { nominationOpen, nominationClose, votingStart, votingEnd, secretBallot, proxyAllowed, votingMode } = body
      if (nominationOpen) data.election.nominationOpen = nominationOpen
      if (nominationClose) data.election.nominationClose = nominationClose
      if (votingStart) data.election.votingStart = votingStart
      if (votingEnd) data.election.votingEnd = votingEnd
      if (typeof secretBallot === 'boolean') data.election.secretBallot = secretBallot
      if (typeof proxyAllowed === 'boolean') data.election.proxyAllowed = proxyAllowed
      if (votingMode) data.election.votingMode = votingMode
      data.election.updatedAt = new Date().toISOString()

      saveCommitteeData(orgId, data)

      const electionTitle = data.election.title || 'Society election'
      await publishElectionNotice(
        orgId,
        user.id,
        user.name,
        `Election calendar updated: ${electionTitle}`,
        `Nominations (${data.election.nominationOpen} to ${data.election.nominationClose}), Voting (${data.election.votingStart} to ${data.election.votingEnd}).`
      ).catch((err) => console.error('Election calendar notice error:', err))

      return NextResponse.json({ success: true, election: data.election, message: 'Election calendar timeline updated' })
    }

    // 2. Start Nominations
    if (action === 'START_NOMINATIONS') {
      data.election.status = 'NOMINATIONS_OPEN'
      data.election.updatedAt = new Date().toISOString()

      try {
        const noticeTitle = `Official Notice: ${data.election.title} — Nominations Now Open!`
        const noticeContent = `Nominations for ${data.election.title} are open.\n\nPositions:\n${data.election.positions.map((p) => `• ${p.title} (${p.seats} seat${p.seats > 1 ? 's' : ''})`).join('\n')}\n\nNomination close: ${data.election.nominationClose}\nVoting: ${data.election.votingStart} to ${data.election.votingEnd}`
        await publishElectionNotice(orgId, user.id, user.name, noticeTitle, noticeContent)
      } catch (eNotice) {
        console.error('Notice creation for election error:', eNotice)
      }

      saveCommitteeData(orgId, data)

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'ELECTION_NOMINATIONS_OPENED',
        entityType: 'Election',
        entityId: data.election.id,
        details: `Election nominations officially opened for ${data.election.title}`,
        severity: 'INFO',
      })

      return NextResponse.json({ success: true, election: data.election, message: 'Nominations opened and published to notice board!' })
    }

    // 3. Start Voting
    if (action === 'START_VOTING') {
      data.election.status = 'VOTING_ACTIVE'
      data.election.updatedAt = new Date().toISOString()

      try {
        await publishElectionNotice(
          orgId,
          user.id,
          user.name,
          `Voting is now live: ${data.election.title}`,
          `Voting for ${data.election.title} is open. Cast your ballot before ${data.election.votingEnd}.`
        )
      } catch (e) {
        console.error('Voting notice error:', e)
      }

      saveCommitteeData(orgId, data)
      return NextResponse.json({ success: true, election: data.election, message: 'Voting is now live for all eligible voters!' })
    }

    // 4. Declare Results
    if (action === 'DECLARE_RESULTS') {
      data.election.status = 'RESULTS_DECLARED'
      data.election.updatedAt = new Date().toISOString()

      try {
        await publishElectionNotice(
          orgId,
          user.id,
          user.name,
          `Results declared: ${data.election.title}`,
          `The results for ${data.election.title} have been declared.\n\n${describeWinners(data.election)}`
        )
      } catch (e) {
        console.error('Results notice error:', e)
      }

      saveCommitteeData(orgId, data)
      return NextResponse.json({ success: true, election: data.election, message: 'Election results declared and archived!' })
    }

    // 5. Update Candidate Nomination Status (Approve / Reject)
    if (action === 'UPDATE_NOMINATION_STATUS') {
      const { positionId, nominationId, status } = body
      const pos = data.election.positions.find((p) => p.id === positionId)
      if (!pos) return NextResponse.json({ error: 'Position not found' }, { status: 404 })

      const nom = pos.nominations.find((n) => n.id === nominationId)
      if (!nom) return NextResponse.json({ error: 'Nomination not found' }, { status: 404 })

      nom.status = status
      saveCommitteeData(orgId, data)

      await publishElectionNotice(
        orgId,
        user.id,
        user.name,
        `Nomination ${String(status).toLowerCase().replace(/_/g, ' ')}: ${nom.candidateName}`,
        `${nom.candidateName} (${nom.unit}) for ${pos.title} is now ${status}.`
      ).catch((err) => console.error('Nomination status notice error:', err))

      return NextResponse.json({ success: true, nomination: nom, message: `Nomination marked as ${status}` })
    }

    // 6. Cast Vote for Candidate
    if (action === 'CAST_VOTE') {
      const { positionId, nominationId } = body
      const pos = data.election.positions.find((p) => p.id === positionId)
      if (!pos) return NextResponse.json({ error: 'Position not found' }, { status: 404 })

      const nom = pos.nominations.find((n) => n.id === nominationId)
      if (!nom) return NextResponse.json({ error: 'Nomination not found' }, { status: 404 })
      if (data.election.status !== 'VOTING_ACTIVE') {
        return NextResponse.json({ error: 'Voting is not open' }, { status: 400 })
      }
      if (nom.status !== 'APPROVED') {
        return NextResponse.json({ error: 'This nomination is not on the ballot' }, { status: 400 })
      }
      const ballots = data.election.ballots || []
      if (ballots.some((b) => b.userId === user.id && b.positionId === positionId)) {
        return NextResponse.json({ error: 'You have already voted for this post' }, { status: 400 })
      }

      nom.votes = (nom.votes || 0) + 1
      data.election.totalVotesCast = (data.election.totalVotesCast || 0) + 1
      data.election.ballots = [...ballots, { userId: user.id, positionId, nominationId }]
      saveCommitteeData(orgId, data)
      return NextResponse.json({ success: true, totalVotesCast: data.election.totalVotesCast })
    }

    // 7. Update Committee Member
    if (action === 'UPDATE_MEMBER') {
      const { id, role, termStart, termEnd, phone, email, status } = body
      const m = data.members.find((x) => x.id === id)
      if (!m) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

      if (role) m.role = role.trim()
      if (termStart) m.termStart = termStart.trim()
      if (termEnd) m.termEnd = termEnd.trim()
      if (phone) m.phone = phone.trim()
      if (email) m.email = email.trim()
      if (status) m.status = status

      saveCommitteeData(orgId, data)
      return NextResponse.json({ success: true, member: m, message: 'Committee member updated' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: unknown) {
    console.error('Committee PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update committee' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const orgId = user.organizationId!
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'MEMBER' | 'POSITION' | 'NOMINATION'
    const id = searchParams.get('id')
    const positionId = searchParams.get('positionId')

    const data = await getStoredCommitteeData(orgId)

    if (type === 'MEMBER') {
      data.members = data.members.filter((m) => m.id !== id)
      saveCommitteeData(orgId, data)
      return NextResponse.json({ success: true, message: 'Committee member removed' })
    }

    if (type === 'POSITION') {
      data.election.positions = data.election.positions.filter((p) => p.id !== id)
      saveCommitteeData(orgId, data)
      return NextResponse.json({ success: true, message: 'Position removed from election' })
    }

    if (type === 'NOMINATION') {
      const pos = data.election.positions.find((p) => p.id === positionId)
      if (pos) {
        pos.nominations = pos.nominations.filter((n) => n.id !== id)
        saveCommitteeData(orgId, data)
        return NextResponse.json({ success: true, message: 'Nomination removed' })
      }
    }

    return NextResponse.json({ error: 'Invalid delete request' }, { status: 400 })
  } catch (err: unknown) {
    console.error('Committee DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
