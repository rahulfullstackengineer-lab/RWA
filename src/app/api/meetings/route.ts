import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { emitLiveSocketEvent } from '@/lib/socket-server'
import { logAudit } from '@/lib/audit'
import fs from 'fs'
import path from 'path'

const MEETINGS_DATA_PATH = path.join(process.cwd(), 'meetings_store.json')

export interface AgendaItem {
  num: number
  title: string
  desc?: string
}

export interface MeetingResolution {
  id: string
  title: string
  outcome: 'PASSED' | 'MAJORITY' | 'PENDING' | 'DEFERRED'
  proposer: string
  seconder: string
  notes?: string
}

export interface MeetingActionItem {
  id: string
  title: string
  assignee: string
  due: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
}

export interface MeetingRecord {
  id: string
  type: 'AGM' | 'COMMITTEE' | 'EGM' | 'TOWNHALL'
  title: string
  scheduledAt: string
  dateFormatted: string
  venue: string
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  agenda: AgendaItem[]
  quorum: string
  quorumRequired: number
  totalEligible: number
  noticeSent: boolean
  noticeDate?: string
  meetingLink?: string
  conductedBy?: string
  attendees?: string[]
  minutesPublished?: boolean
  minutes?: string
  resolutions?: MeetingResolution[]
  actionItems?: MeetingActionItem[]
  createdAt: string
}

function getStoredMeetings(orgId: string): MeetingRecord[] {
  try {
    if (fs.existsSync(MEETINGS_DATA_PATH)) {
      const data = JSON.parse(fs.readFileSync(MEETINGS_DATA_PATH, 'utf-8'))
      if (data && data[orgId]) return data[orgId]
    }
  } catch (e) {
    console.error('Error reading meetings store:', e)
  }

  return []
}

function saveMeetings(orgId: string, meetings: MeetingRecord[]) {
  try {
    let allData: any = {}
    if (fs.existsSync(MEETINGS_DATA_PATH)) {
      try {
        allData = JSON.parse(fs.readFileSync(MEETINGS_DATA_PATH, 'utf-8'))
      } catch (e) {}
    }
    allData[orgId] = meetings
    fs.writeFileSync(MEETINGS_DATA_PATH, JSON.stringify(allData, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error saving meetings store:', e)
  }
}

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const orgId = user.organizationId!
    const meetings = getStoredMeetings(orgId)

    const upcoming = meetings.filter((m) => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS')
    const past = meetings.filter((m) => m.status === 'COMPLETED' || m.status === 'CANCELLED')
    const allActionItems = meetings.flatMap((m) =>
      (m.actionItems || []).map((a) => ({ ...a, meetingTitle: m.title, meetingId: m.id }))
    )

    return NextResponse.json({
      meetings,
      upcoming,
      past,
      actionItems: allActionItems,
      counts: {
        upcoming: upcoming.length,
        past: past.length,
        actionItems: allActionItems.length,
      },
    })
  } catch (err: unknown) {
    console.error('Meetings GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const {
      title,
      type = 'COMMITTEE',
      scheduledAt,
      venue = 'Community Hall, Sector 22',
      meetingLink = '',
      agenda = '',
      quorum = '',
      quorumRequired = 5,
      totalEligible = 7,
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Meeting title is required' }, { status: 400 })
    }

    const orgId = user.organizationId!
    const meetings = getStoredMeetings(orgId)

    const meetDate = scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const dateFormatted = meetDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ` · ${meetDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`

    // Parse agenda lines
    let agendaItems: AgendaItem[] = []
    if (Array.isArray(agenda)) {
      agendaItems = agenda
    } else if (typeof agenda === 'string' && agenda.trim()) {
      agendaItems = agenda
        .split('\n')
        .map((line) => line.trim())
        .filter((l) => l.length > 0)
        .map((line, idx) => {
          const clean = line.replace(/^\d+[\.\)]\s*/, '')
          return { num: idx + 1, title: clean }
        })
    }

    if (agendaItems.length === 0) {
      agendaItems = [
        { num: 1, title: 'Opening remarks & roll call' },
        { num: 2, title: 'Discussion of key society matters' },
        { num: 3, title: 'Any other business with permission of Chair' },
      ]
    }

    const newMeeting: MeetingRecord = {
      id: `MTG-${Math.floor(100 + Math.random() * 900)}`,
      type,
      title: title.trim(),
      scheduledAt: meetDate.toISOString(),
      dateFormatted,
      venue: venue.trim(),
      status: 'SCHEDULED',
      quorum: quorum || (type === 'AGM' ? '33% (114 members)' : `${quorumRequired} members`),
      quorumRequired: Number(quorumRequired) || (type === 'AGM' ? 114 : 5),
      totalEligible: Number(totalEligible) || (type === 'AGM' ? 342 : 7),
      noticeSent: false,
      meetingLink: meetingLink.trim(),
      conductedBy: `${user.name} (${user.role.replace('_', ' ')})`,
      agenda: agendaItems,
      attendees: [],
      resolutions: [],
      actionItems: [],
      createdAt: new Date().toISOString(),
    }

    meetings.unshift(newMeeting)
    saveMeetings(orgId, meetings)

    emitLiveSocketEvent('new-meeting-scheduled', {
      id: newMeeting.id,
      title: newMeeting.title,
      type: newMeeting.type,
      scheduledAt: newMeeting.scheduledAt,
      venue: newMeeting.venue,
    }, { orgId })

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'MEETING_SCHEDULED',
      entityType: 'Meeting',
      entityId: newMeeting.id,
      details: `${newMeeting.type} meeting "${newMeeting.title}" scheduled for ${newMeeting.dateFormatted}`,
      severity: 'INFO',
      newValues: newMeeting,
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    })

    return NextResponse.json({ success: true, meeting: newMeeting })
  } catch (err: unknown) {
    console.error('Meetings POST error:', err)
    return NextResponse.json({ error: 'Failed to schedule meeting' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const orgId = user.organizationId!
    const body = await request.json()
    const { id, action, title, venue, agenda, minutes, resolutions, actionItems, attendees, status } = body

    if (!id) return NextResponse.json({ error: 'Meeting ID required' }, { status: 400 })

    const meetings = getStoredMeetings(orgId)
    const idx = meetings.findIndex((m) => m.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

    const meeting = meetings[idx]

    // 1. Dispatch formal notice
    if (action === 'SEND_NOTICE') {
      meeting.noticeSent = true
      meeting.noticeDate = new Date().toISOString().split('T')[0]

      // Automatically publish to society Notice Board so residents see it
      try {
        const noticeTitle = `📢 Formal Notice: ${meeting.title} (${meeting.type})`
        const noticeContent = `Notice is hereby given that the ${meeting.title} will be held on ${meeting.dateFormatted} at ${meeting.venue}.\n\nAgenda:\n${meeting.agenda.map((a) => `${a.num}. ${a.title}`).join('\n')}\n\nQuorum Requirement: ${meeting.quorum}.\nAll eligible members are requested to attend promptly.`

        const notice = await prisma.notice.create({
          data: {
            organizationId: orgId,
            title: noticeTitle,
            content: noticeContent,
            type: 'EVENT',
            channels: 'IN_APP',
            status: 'PUBLISHED',
            publishedAt: new Date(),
            publishedBy: `${user.name} (Management Committee)`,
            pinnedUntil: new Date(meeting.scheduledAt),
          },
        })

        emitLiveSocketEvent('new-notice', {
          id: notice.id,
          title: notice.title,
          type: notice.type,
          publishedBy: notice.publishedBy,
        }, { orgId })

        // Send notifications to residents
        const residents = await prisma.user.findMany({
          where: { organizationId: orgId, status: 'ACTIVE' },
          select: { id: true },
        })
        if (residents.length > 0) {
          await prisma.notification.createMany({
            data: residents.map((r) => ({
              organizationId: orgId,
              userId: r.id,
              title: `📅 ${meeting.title} Notice`,
              message: `Meeting scheduled for ${meeting.dateFormatted} at ${meeting.venue}. View agenda in notices.`,
              type: 'MEETING',
              referenceType: 'MEETING',
              referenceId: meeting.id,
            })),
          })
        }
      } catch (errNotice) {
        console.error('Error auto-creating meeting notice:', errNotice)
      }

      saveMeetings(orgId, meetings)
      return NextResponse.json({ success: true, meeting, message: 'Notice dispatched and published to residents' })
    }

    // 2. Publish minutes
    if (action === 'PUBLISH_MINUTES') {
      meeting.minutes = minutes || meeting.minutes
      meeting.minutesPublished = true
      meeting.status = 'COMPLETED'
      if (resolutions) meeting.resolutions = resolutions
      if (attendees) meeting.attendees = attendees

      saveMeetings(orgId, meetings)
      return NextResponse.json({ success: true, meeting, message: 'Minutes published and archived' })
    }

    // 3. Update attendance
    if (action === 'ATTENDANCE') {
      if (attendees) meeting.attendees = attendees
      saveMeetings(orgId, meetings)
      return NextResponse.json({ success: true, meeting })
    }

    // 4. General updates
    if (title) meeting.title = title.trim()
    if (venue) meeting.venue = venue.trim()
    if (status) meeting.status = status
    if (agenda) meeting.agenda = agenda
    if (resolutions) meeting.resolutions = resolutions
    if (actionItems) meeting.actionItems = actionItems

    saveMeetings(orgId, meetings)
    return NextResponse.json({ success: true, meeting })
  } catch (err: unknown) {
    console.error('Meetings PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const orgId = user.organizationId!
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Meeting ID required' }, { status: 400 })

    const meetings = getStoredMeetings(orgId)
    const filtered = meetings.filter((m) => m.id !== id)
    saveMeetings(orgId, filtered)

    return NextResponse.json({ success: true, message: 'Meeting cancelled' })
  } catch (err: unknown) {
    console.error('Meetings DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 })
  }
}

