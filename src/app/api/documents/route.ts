import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { emitLiveSocketEvent } from '@/lib/socket-server'
import { logAudit } from '@/lib/audit'
import fs from 'fs'
import path from 'path'

const DOCUMENTS_DATA_PATH = path.join(process.cwd(), 'documents_store.json')

export interface DocumentVersion {
  version: number
  date: string
  uploadedBy: string
  note: string
  size: string
}

export interface DocumentItem {
  id: string
  name: string
  folder: string
  ext: 'PDF' | 'PNG' | 'JPG' | 'DOCX' | 'XLSX' | string
  size: string
  sizeBytes?: number
  visibility: 'ALL_RESIDENTS' | 'COMMITTEE' | 'AUDITOR'
  version: number
  uploadedBy: string
  uploadedAt: string
  displayDate: string
  description?: string
  tags?: string[]
  fileUrl?: string
  versionHistory?: DocumentVersion[]
}

export interface FolderItem {
  id: string
  name: string
  icon: string
  isSystem: boolean
  createdAt: string
}

export interface DocumentsStoreData {
  folders: FolderItem[]
  documents: DocumentItem[]
}

const DEFAULT_FOLDERS: FolderItem[] = [
  { id: 'fld-1', name: 'Registration & Legal', icon: '📁', isSystem: true, createdAt: '2019-01-01' },
  { id: 'fld-2', name: 'Bylaws', icon: '📁', isSystem: true, createdAt: '2019-01-01' },
  { id: 'fld-3', name: 'Meeting Minutes', icon: '📁', isSystem: true, createdAt: '2019-01-01' },
  { id: 'fld-4', name: 'Audit Reports', icon: '📁', isSystem: true, createdAt: '2019-01-01' },
  { id: 'fld-5', name: 'Vendor Contracts', icon: '📁', isSystem: true, createdAt: '2019-01-01' },
  { id: 'fld-6', name: 'Insurance', icon: '📁', isSystem: true, createdAt: '2019-01-01' },
  { id: 'fld-7', name: 'Financial Reports', icon: '📁', isSystem: true, createdAt: '2019-01-01' },
  { id: 'fld-8', name: 'Election Records', icon: '📁', isSystem: true, createdAt: '2019-01-01' },
]

function getInitialDocuments(adminName = 'Managing Committee'): DocumentItem[] {
  return [
    {
      id: 'DOC-001',
      name: 'Registration Certificate',
      folder: 'Registration & Legal',
      ext: 'PDF',
      size: '1.2 MB',
      visibility: 'ALL_RESIDENTS',
      version: 1,
      uploadedBy: adminName,
      uploadedAt: '2019-03-15T10:00:00.000Z',
      displayDate: 'Mar 2019',
      description: 'Official society registration certificate issued by Registrar of Societies, Chandigarh (Reg No: SOC/CHD/2019/482).',
      tags: ['Statutory', 'Permanent', 'Registration'],
      fileUrl: '/documents/registration_certificate.pdf',
      versionHistory: [
        { version: 1, date: 'Mar 2019', uploadedBy: adminName, note: 'Initial registration document issued under Societies Act.', size: '1.2 MB' }
      ]
    },
    {
      id: 'DOC-002',
      name: 'Society Seal & Official Stamp',
      folder: 'Registration & Legal',
      ext: 'PNG',
      size: '42 KB',
      visibility: 'COMMITTEE',
      version: 1,
      uploadedBy: adminName,
      uploadedAt: '2019-03-20T10:00:00.000Z',
      displayDate: 'Mar 2019',
      description: 'High-resolution official digital vector seal and authorized signatory stamp for formal communications.',
      tags: ['Branding', 'Seal', 'Restricted'],
      fileUrl: '/documents/society_seal.png',
      versionHistory: [
        { version: 1, date: 'Mar 2019', uploadedBy: adminName, note: 'Digitized society common seal for certified documents.', size: '42 KB' }
      ]
    },
    {
      id: 'DOC-003',
      name: '12A & 80G Tax Exemption Certificate',
      folder: 'Registration & Legal',
      ext: 'PDF',
      size: '560 KB',
      visibility: 'COMMITTEE',
      version: 1,
      uploadedBy: adminName,
      uploadedAt: '2020-06-12T10:00:00.000Z',
      displayDate: 'Jun 2020',
      description: 'Income Tax department order granting exemption status under Section 12A and 80G.',
      tags: ['Tax', 'Exemption', 'IT Dept'],
      fileUrl: '/documents/12a_certificate.pdf',
      versionHistory: [
        { version: 1, date: 'Jun 2020', uploadedBy: adminName, note: 'Approved 12A exemption certificate order.', size: '560 KB' }
      ]
    },
    {
      id: 'DOC-004',
      name: 'Land Conveyance & Title Deed',
      folder: 'Registration & Legal',
      ext: 'PDF',
      size: '3.4 MB',
      visibility: 'ALL_RESIDENTS',
      version: 1,
      uploadedBy: adminName,
      uploadedAt: '2018-11-05T10:00:00.000Z',
      displayDate: 'Nov 2018',
      description: 'Registered tripartite conveyance deed transferring land title and common areas to society association.',
      tags: ['Title Deed', 'Conveyance', 'Legal'],
      fileUrl: '/documents/conveyance_deed.pdf',
      versionHistory: [
        { version: 1, date: 'Nov 2018', uploadedBy: adminName, note: 'Registered deed registered with Sub-Registrar.', size: '3.4 MB' }
      ]
    },
    {
      id: 'DOC-005',
      name: 'Bylaws — Current (2023 Amendment)',
      folder: 'Bylaws',
      ext: 'PDF',
      size: '890 KB',
      visibility: 'ALL_RESIDENTS',
      version: 3,
      uploadedBy: adminName,
      uploadedAt: '2023-01-14T10:00:00.000Z',
      displayDate: 'Jan 2023',
      description: 'Comprehensive updated society constitution & governance rules adopted in the Special General Body Meeting.',
      tags: ['Bylaws', 'Governance', 'Rules'],
      fileUrl: '/documents/bylaws_current_2023.pdf',
      versionHistory: [
        { version: 1, date: 'Mar 2019', uploadedBy: adminName, note: 'Initial founding bylaws.', size: '750 KB' },
        { version: 2, date: 'Oct 2021', uploadedBy: adminName, note: 'Added EV charging station installation policy.', size: '820 KB' },
        { version: 3, date: 'Jan 2023', uploadedBy: adminName, note: 'Adopted updated quorum and online voting provisions.', size: '890 KB' }
      ]
    },
    {
      id: 'DOC-006',
      name: 'Parking, Pet & Common Area Code of Conduct',
      folder: 'Bylaws',
      ext: 'PDF',
      size: '320 KB',
      visibility: 'ALL_RESIDENTS',
      version: 2,
      uploadedBy: adminName,
      uploadedAt: '2025-08-10T10:00:00.000Z',
      displayDate: 'Aug 2025',
      description: 'Standard operational rules for resident parking slot usage, visitor parking tags, pet leashing and clubhouse etiquette.',
      tags: ['Parking', 'Pets', 'Rules'],
      fileUrl: '/documents/parking_pet_guidelines.pdf',
      versionHistory: [
        { version: 1, date: 'Jun 2022', uploadedBy: adminName, note: 'Draft resident etiquette guidelines.', size: '280 KB' },
        { version: 2, date: 'Aug 2025', uploadedBy: adminName, note: 'Added designated visitor parking time slots.', size: '320 KB' }
      ]
    },
    {
      id: 'DOC-007',
      name: 'AGM 2026 General Body Minutes & Passed Resolutions',
      folder: 'Meeting Minutes',
      ext: 'PDF',
      size: '1.1 MB',
      visibility: 'ALL_RESIDENTS',
      version: 1,
      uploadedBy: adminName,
      uploadedAt: '2026-10-02T10:00:00.000Z',
      displayDate: 'Oct 2026',
      description: 'Approved minutes and attendance register from the Annual General Meeting held in Community Hall.',
      tags: ['AGM', 'Minutes', 'Resolutions'],
      fileUrl: '/documents/agm_2026_minutes.pdf',
      versionHistory: [
        { version: 1, date: 'Oct 2026', uploadedBy: adminName, note: 'Duly signed minutes approved by President & Secretary.', size: '1.1 MB' }
      ]
    },
    {
      id: 'DOC-008',
      name: 'EGM 2026 — Lift Modernization Approval Minutes',
      folder: 'Meeting Minutes',
      ext: 'PDF',
      size: '740 KB',
      visibility: 'ALL_RESIDENTS',
      version: 1,
      uploadedBy: adminName,
      uploadedAt: '2026-08-20T10:00:00.000Z',
      displayDate: 'Aug 2026',
      description: 'Extraordinary General Meeting minutes resolving 3-block elevator modernization and special assessment levy.',
      tags: ['EGM', 'Lifts', 'Minutes'],
      fileUrl: '/documents/egm_lift_modernization.pdf',
      versionHistory: [
        { version: 1, date: 'Aug 2026', uploadedBy: adminName, note: 'Approved by 88% supermajority vote.', size: '740 KB' }
      ]
    },
    {
      id: 'DOC-009',
      name: 'Managing Committee Monthly Meeting — Sep 2026',
      folder: 'Meeting Minutes',
      ext: 'PDF',
      size: '450 KB',
      visibility: 'COMMITTEE',
      version: 1,
      uploadedBy: adminName,
      uploadedAt: '2026-09-18T10:00:00.000Z',
      displayDate: 'Sep 2026',
      description: 'Monthly agenda review, vendor invoice clearances, and security guard festive bonus allocations.',
      tags: ['MC Meeting', 'Monthly', 'Committee'],
      fileUrl: '/documents/mc_meeting_sep2026.pdf',
      versionHistory: [
        { version: 1, date: 'Sep 2026', uploadedBy: adminName, note: 'Signed committee meeting record.', size: '450 KB' }
      ]
    },
    {
      id: 'DOC-010',
      name: 'Statutory Independent Audit Report FY 2025-26',
      folder: 'Audit Reports',
      ext: 'PDF',
      size: '2.8 MB',
      visibility: 'AUDITOR',
      version: 1,
      uploadedBy: 'Kapoor & Associates CA',
      uploadedAt: '2026-06-30T10:00:00.000Z',
      displayDate: 'Jun 2026',
      description: 'Statutory audit report, bank reconciliation confirmation, and notes to accounts issued by registered CA.',
      tags: ['Audit', 'Statutory', 'Financial Year'],
      fileUrl: '/documents/statutory_audit_fy2526.pdf',
      versionHistory: [
        { version: 1, date: 'Jun 2026', uploadedBy: 'Kapoor & Associates CA', note: 'Unqualified clean audit opinion report.', size: '2.8 MB' }
      ]
    },
    {
      id: 'DOC-011',
      name: 'Internal Financial Audit Review Q2',
      folder: 'Audit Reports',
      ext: 'PDF',
      size: '1.4 MB',
      visibility: 'COMMITTEE',
      version: 1,
      uploadedBy: adminName,
      uploadedAt: '2026-09-28T10:00:00.000Z',
      displayDate: 'Sep 2026',
      description: 'Quarterly internal control review of maintenance fee collections, petty cash vouchers, and electricity billing.',
      tags: ['Internal Audit', 'Quarterly', 'Finance'],
      fileUrl: '/documents/internal_audit_q2.pdf',
      versionHistory: [
        { version: 1, date: 'Sep 2026', uploadedBy: adminName, note: 'Internal audit committee review sign-off.', size: '1.4 MB' }
      ]
    },
    {
      id: 'DOC-012',
      name: 'Audited Balance Sheet & Profit-Loss Account FY25',
      folder: 'Audit Reports',
      ext: 'PDF',
      size: '820 KB',
      visibility: 'ALL_RESIDENTS',
      version: 1,
      uploadedBy: adminName,
      uploadedAt: '2026-07-15T10:00:00.000Z',
      displayDate: 'Jul 2026',
      description: 'Full financial disclosures, corpus fund balance, and audited expenditure summary distributed to members.',
      tags: ['Balance Sheet', 'Financials', 'Annual'],
      fileUrl: '/documents/balance_sheet_fy25.pdf',
      versionHistory: [
        { version: 1, date: 'Jul 2026', uploadedBy: adminName, note: 'Adopted at general body convention.', size: '820 KB' }
      ]
    },
    {
      id: 'DOC-013',
      name: 'Apex Facility & Security Services SLA 2026-27',
      folder: 'Vendor Contracts',
      ext: 'PDF',
      size: '1.6 MB',
      visibility: 'COMMITTEE',
      version: 2,
      uploadedBy: adminName,
      uploadedAt: '2026-03-25T10:00:00.000Z',
      displayDate: 'Mar 2026',
      description: 'Service level agreement for 14 security guards, 2 gate supervisors, biometric attendance, and patrolling dogs.',
      tags: ['Security', 'Contract', 'SLA'],
      fileUrl: '/documents/apex_security_sla.pdf',
      versionHistory: [
        { version: 1, date: 'Mar 2025', uploadedBy: adminName, note: 'Original contract draft.', size: '1.4 MB' },
        { version: 2, date: 'Mar 2026', uploadedBy: adminName, note: 'Annual renewal with updated gate guard shift schedule.', size: '1.6 MB' }
      ]
    },
    {
      id: 'DOC-014',
      name: 'Otis Elevators Comprehensive AMC Contract',
      folder: 'Vendor Contracts',
      ext: 'PDF',
      size: '980 KB',
      visibility: 'COMMITTEE',
      version: 1,
      uploadedBy: adminName,
      uploadedAt: '2026-04-10T10:00:00.000Z',
      displayDate: 'Apr 2026',
      description: 'Annual comprehensive maintenance contract covering all 6 passenger elevators and emergency response guarantees.',
      tags: ['Otis', 'Elevator', 'AMC'],
      fileUrl: '/documents/otis_amc_contract.pdf',
      versionHistory: [
        { version: 1, date: 'Apr 2026', uploadedBy: adminName, note: 'Signed 1-year comprehensive AMC.', size: '980 KB' }
      ]
    },
    {
      id: 'DOC-015',
      name: 'GreenCare Landscaping & Horticulture Agreement',
      folder: 'Vendor Contracts',
      ext: 'PDF',
      size: '650 KB',
      visibility: 'COMMITTEE',
      version: 1,
      uploadedBy: adminName,
      uploadedAt: '2026-01-18T10:00:00.000Z',
      displayDate: 'Jan 2026',
      description: 'Weekly lawn maintenance, tree trimming, seasonal flower bed rotation, and sprinkler upkeep contract.',
      tags: ['Landscaping', 'Garden', 'Contract'],
      fileUrl: '/documents/greencare_contract.pdf',
      versionHistory: [
        { version: 1, date: 'Jan 2026', uploadedBy: adminName, note: 'Executed agreement for central greens maintenance.', size: '650 KB' }
      ]
    },
    {
      id: 'DOC-016',
      name: 'Comprehensive Society Building & Fire Insurance Policy',
      folder: 'Insurance',
      ext: 'PDF',
      size: '2.1 MB',
      visibility: 'ALL_RESIDENTS',
      version: 1,
      uploadedBy: adminName,
      uploadedAt: '2026-07-01T10:00:00.000Z',
      displayDate: 'Jul 2026',
      description: 'ICICI Lombard policy covering ₹45 Crore structural reinstatement value, earthquake, storm, and fire damage.',
      tags: ['Insurance', 'Fire Policy', 'Structure'],
      fileUrl: '/documents/society_fire_policy.pdf',
      versionHistory: [
        { version: 1, date: 'Jul 2026', uploadedBy: adminName, note: 'Valid from July 1, 2026 to June 30, 2027.', size: '2.1 MB' }
      ]
    },
    {
      id: 'DOC-017',
      name: 'Public Liability & Lift Accident Insurance Policy',
      folder: 'Insurance',
      ext: 'PDF',
      size: '780 KB',
      visibility: 'COMMITTEE',
      version: 1,
      uploadedBy: adminName,
      uploadedAt: '2026-05-15T10:00:00.000Z',
      displayDate: 'May 2026',
      description: 'Third-party public liability cover up to ₹5 Crore for visitor injuries, common area mishaps, and lift operations.',
      tags: ['Insurance', 'Liability', 'Safety'],
      fileUrl: '/documents/public_liability_policy.pdf',
      versionHistory: [
        { version: 1, date: 'May 2026', uploadedBy: adminName, note: 'Policy schedule and premium payment receipt.', size: '780 KB' }
      ]
    },
    {
      id: 'DOC-018',
      name: 'Annual Society Budget Projection FY 2026-27',
      folder: 'Financial Reports',
      ext: 'XLSX',
      size: '420 KB',
      visibility: 'ALL_RESIDENTS',
      version: 2,
      uploadedBy: adminName,
      uploadedAt: '2026-04-05T10:00:00.000Z',
      displayDate: 'Apr 2026',
      description: 'Itemized operational expense forecast, capital expenditure roadmap, and expected maintenance dues schedule.',
      tags: ['Budget', 'Projection', 'Finance'],
      fileUrl: '/documents/annual_budget_projection.xlsx',
      versionHistory: [
        { version: 1, date: 'Mar 2026', uploadedBy: adminName, note: 'Draft presentation to finance sub-committee.', size: '390 KB' },
        { version: 2, date: 'Apr 2026', uploadedBy: adminName, note: 'Approved operational budget with diesel hike factored.', size: '420 KB' }
      ]
    },
    {
      id: 'DOC-019',
      name: 'Sinking Fund & Fixed Deposit Portfolio Statement',
      folder: 'Financial Reports',
      ext: 'PDF',
      size: '610 KB',
      visibility: 'ALL_RESIDENTS',
      version: 1,
      uploadedBy: adminName,
      uploadedAt: '2026-09-30T10:00:00.000Z',
      displayDate: 'Sep 2026',
      description: 'SBI and HDFC Fixed Deposit receipts breakdown with maturity dates and earned interest summary.',
      tags: ['Sinking Fund', 'Fixed Deposits', 'Investments'],
      fileUrl: '/documents/sinking_fund_statement.pdf',
      versionHistory: [
        { version: 1, date: 'Sep 2026', uploadedBy: adminName, note: 'Semi-annual reserve audit statement.', size: '610 KB' }
      ]
    },
    {
      id: 'DOC-020',
      name: 'Managing Committee Election 2026 Official Declaration',
      folder: 'Election Records',
      ext: 'PDF',
      size: '530 KB',
      visibility: 'ALL_RESIDENTS',
      version: 1,
      uploadedBy: adminName,
      uploadedAt: '2026-03-31T10:00:00.000Z',
      displayDate: 'Mar 2026',
      description: 'Official notification of elected office bearers, vote counts, and returning officer certification.',
      tags: ['Elections', 'Committee', 'Gazette'],
      fileUrl: '/documents/election_2026_declaration.pdf',
      versionHistory: [
        { version: 1, date: 'Mar 2026', uploadedBy: adminName, note: 'Certified by Returning Officer and General Body.', size: '530 KB' }
      ]
    },
    {
      id: 'DOC-021',
      name: 'Returning Officer Scrutiny & Vote Tally Sheet',
      folder: 'Election Records',
      ext: 'PDF',
      size: '380 KB',
      visibility: 'COMMITTEE',
      version: 1,
      uploadedBy: adminName,
      uploadedAt: '2026-03-30T10:00:00.000Z',
      displayDate: 'Mar 2026',
      description: 'Verification logs for voter eligibility, invalid ballot exclusions, and final vote count tallies.',
      tags: ['Elections', 'Tally', 'Scrutiny'],
      fileUrl: '/documents/election_scrutiny_sheet.pdf',
      versionHistory: [
        { version: 1, date: 'Mar 2026', uploadedBy: adminName, note: 'Original signed scrutiny register.', size: '380 KB' }
      ]
    }
  ]
}

function getStoredDocumentsData(orgId: string, adminName = 'Managing Committee'): DocumentsStoreData {
  try {
    if (fs.existsSync(DOCUMENTS_DATA_PATH)) {
      const data = JSON.parse(fs.readFileSync(DOCUMENTS_DATA_PATH, 'utf-8'))
      if (data && data[orgId]) {
        return data[orgId]
      }
    }
  } catch (e) {
    console.error('Error reading documents store:', e)
  }

  const initial: DocumentsStoreData = {
    folders: DEFAULT_FOLDERS,
    documents: getInitialDocuments(adminName)
  }
  saveDocumentsData(orgId, initial)
  return initial
}

function saveDocumentsData(orgId: string, data: DocumentsStoreData) {
  try {
    let allData: any = {}
    if (fs.existsSync(DOCUMENTS_DATA_PATH)) {
      try {
        allData = JSON.parse(fs.readFileSync(DOCUMENTS_DATA_PATH, 'utf-8'))
      } catch (e) {}
    }
    allData[orgId] = data
    fs.writeFileSync(DOCUMENTS_DATA_PATH, JSON.stringify(allData, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error saving documents store:', e)
  }
}

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const orgId = user.organizationId!
    const data = getStoredDocumentsData(orgId, user.name || 'Managing Committee')

    const url = new URL(request.url)
    const folderFilter = url.searchParams.get('folder') || 'all'
    const visibilityFilter = url.searchParams.get('visibility') || 'all'
    const searchQuery = (url.searchParams.get('search') || '').toLowerCase().trim()

    // Calculate folder counts across all documents
    const folderCounts: Record<string, number> = {}
    data.folders.forEach(f => {
      folderCounts[f.name] = data.documents.filter(d => d.folder === f.name).length
    })

    // Filter documents
    let filtered = [...data.documents]

    if (folderFilter !== 'all') {
      filtered = filtered.filter(d => d.folder.toLowerCase() === folderFilter.toLowerCase())
    }

    if (visibilityFilter !== 'all') {
      if (visibilityFilter === 'committee') {
        filtered = filtered.filter(d => d.visibility === 'COMMITTEE')
      } else if (visibilityFilter === 'residents') {
        filtered = filtered.filter(d => d.visibility === 'ALL_RESIDENTS')
      } else if (visibilityFilter === 'auditor') {
        filtered = filtered.filter(d => d.visibility === 'AUDITOR')
      }
    }

    if (searchQuery) {
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(searchQuery) ||
        (d.description && d.description.toLowerCase().includes(searchQuery)) ||
        (d.tags && d.tags.some(t => t.toLowerCase().includes(searchQuery))) ||
        d.folder.toLowerCase().includes(searchQuery)
      )
    }

    return NextResponse.json({
      folders: data.folders,
      documents: filtered,
      allDocuments: data.documents,
      folderCounts,
      counts: {
        total: data.documents.length,
        committeeOnly: data.documents.filter(d => d.visibility === 'COMMITTEE').length,
        allResidents: data.documents.filter(d => d.visibility === 'ALL_RESIDENTS').length,
        auditor: data.documents.filter(d => d.visibility === 'AUDITOR').length,
      }
    })
  } catch (err: unknown) {
    console.error('Documents GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { action = 'UPLOAD_DOCUMENT' } = body
    const orgId = user.organizationId!
    const data = getStoredDocumentsData(orgId, user.name || 'Managing Committee')

    if (action === 'CREATE_FOLDER') {
      const { name, icon = '📁' } = body
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
      }
      const trimmedName = name.trim()
      if (data.folders.some(f => f.name.toLowerCase() === trimmedName.toLowerCase())) {
        return NextResponse.json({ error: 'A folder with this name already exists' }, { status: 400 })
      }

      const newFolder: FolderItem = {
        id: `fld-${Date.now()}`,
        name: trimmedName,
        icon,
        isSystem: false,
        createdAt: new Date().toISOString()
      }

      data.folders.push(newFolder)
      saveDocumentsData(orgId, data)

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'CREATE_FOLDER',
        entityType: 'DocumentFolder',
        entityId: newFolder.id,
        details: `Created document folder: "${newFolder.name}"`,
      })

      emitLiveSocketEvent('document_folder_created', { folder: newFolder })
      return NextResponse.json({ success: true, folder: newFolder, folders: data.folders })
    }

    if (action === 'UPLOAD_DOCUMENT') {
      const {
        name,
        folder = 'Registration & Legal',
        ext = 'PDF',
        size = '1.2 MB',
        visibility = 'ALL_RESIDENTS',
        description = '',
        tags = [],
        fileUrl = '',
      } = body

      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Document name is required' }, { status: 400 })
      }

      const now = new Date()
      const displayDate = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const docId = `DOC-${String(data.documents.length + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`

      const newDoc: DocumentItem = {
        id: docId,
        name: name.trim(),
        folder: folder.trim(),
        ext: (ext.toUpperCase() || 'PDF'),
        size: size || '1.0 MB',
        visibility: visibility || 'ALL_RESIDENTS',
        version: 1,
        uploadedBy: user.name || 'Managing Committee',
        uploadedAt: now.toISOString(),
        displayDate,
        description: description.trim() || `Uploaded on ${displayDate} by ${user.name || 'Admin'}`,
        tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map((t: string) => t.trim()) : []),
        fileUrl: fileUrl || `/documents/${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}.${(ext || 'pdf').toLowerCase()}`,
        versionHistory: [
          {
            version: 1,
            date: displayDate,
            uploadedBy: user.name || 'Managing Committee',
            note: 'Initial document upload',
            size: size || '1.0 MB'
          }
        ]
      }

      data.documents.unshift(newDoc)
      saveDocumentsData(orgId, data)

      // Also sync to Prisma Document if possible
      try {
        await prisma.document.create({
          data: {
            id: newDoc.id,
            organizationId: orgId,
            uploadedById: user.id,
            name: newDoc.name,
            category: newDoc.folder,
            fileUrl: newDoc.fileUrl || '',
            fileSize: 1024 * 1024,
            mimeType: newDoc.ext === 'PNG' ? 'image/png' : newDoc.ext === 'JPG' ? 'image/jpeg' : 'application/pdf',
            isPublic: newDoc.visibility === 'ALL_RESIDENTS'
          }
        })
      } catch (e) {
        // Safe to continue if Prisma already has matching or slight schema variance
      }

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'UPLOAD_DOCUMENT',
        entityType: 'Document',
        entityId: newDoc.id,
        details: `Uploaded document "${newDoc.name}" into folder "${newDoc.folder}" (Visibility: ${newDoc.visibility})`,
      })

      emitLiveSocketEvent('document_uploaded', { document: newDoc })
      return NextResponse.json({ success: true, document: newDoc })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: unknown) {
    console.error('Documents POST error:', err)
    return NextResponse.json({ error: 'Failed to process document request' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { id, action = 'UPDATE_DOCUMENT' } = body
    if (!id) return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })

    const orgId = user.organizationId!
    const data = getStoredDocumentsData(orgId, user.name || 'Managing Committee')
    const docIndex = data.documents.findIndex(d => d.id === id)

    if (docIndex === -1) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const doc = data.documents[docIndex]

    if (action === 'BUMP_VERSION') {
      const { note = 'Version update', newSize = doc.size } = body
      const newVersion = (doc.version || 1) + 1
      const now = new Date()
      const displayDate = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

      const newHistoryItem: DocumentVersion = {
        version: newVersion,
        date: displayDate,
        uploadedBy: user.name || 'Managing Committee',
        note: note.trim() || `Updated to version ${newVersion}`,
        size: newSize || doc.size
      }

      doc.version = newVersion
      doc.size = newSize || doc.size
      doc.uploadedAt = now.toISOString()
      doc.displayDate = displayDate
      if (!doc.versionHistory) doc.versionHistory = []
      doc.versionHistory.unshift(newHistoryItem)

      saveDocumentsData(orgId, data)

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'BUMP_DOCUMENT_VERSION',
        entityType: 'Document',
        entityId: doc.id,
        details: `Updated "${doc.name}" to version v${newVersion} - ${note}`,
      })

      emitLiveSocketEvent('document_updated', { document: doc })
      return NextResponse.json({ success: true, document: doc })
    }

    // Default: Edit metadata
    const { name, folder, visibility, description, tags } = body
    if (name) doc.name = name.trim()
    if (folder) doc.folder = folder.trim()
    if (visibility) doc.visibility = visibility
    if (description !== undefined) doc.description = description.trim()
    if (tags !== undefined) {
      doc.tags = Array.isArray(tags) ? tags : String(tags).split(',').map((t: string) => t.trim())
    }

    saveDocumentsData(orgId, data)

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'UPDATE_DOCUMENT',
      entityType: 'Document',
      entityId: doc.id,
      details: `Updated details for document "${doc.name}"`,
    })

    emitLiveSocketEvent('document_updated', { document: doc })
    return NextResponse.json({ success: true, document: doc })
  } catch (err: unknown) {
    console.error('Documents PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const url = new URL(request.url)
    let id = url.searchParams.get('id')
    if (!id) {
      try {
        const body = await request.json()
        id = body.id
      } catch {}
    }

    if (!id) return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })

    const orgId = user.organizationId!
    const data = getStoredDocumentsData(orgId, user.name || 'Managing Committee')
    const docIndex = data.documents.findIndex(d => d.id === id)

    if (docIndex === -1) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const removed = data.documents.splice(docIndex, 1)[0]
    saveDocumentsData(orgId, data)

    try {
      await prisma.document.delete({ where: { id: removed.id } })
    } catch {}

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'DELETE_DOCUMENT',
      entityType: 'Document',
      entityId: removed.id,
      details: `Deleted document "${removed.name}" from folder "${removed.folder}"`,
      severity: 'WARNING'
    })

    emitLiveSocketEvent('document_deleted', { id: removed.id })
    return NextResponse.json({ success: true, deleted: removed })
  } catch (err: unknown) {
    console.error('Documents DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
