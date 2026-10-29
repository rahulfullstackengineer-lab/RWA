import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { emitLiveSocketEvent } from '@/lib/socket-server'
import { logAudit } from '@/lib/audit'
import fs from 'fs'
import path from 'path'

const POLLS_DATA_PATH = path.join(process.cwd(), 'polls_store.json')

function getStoredPolls(orgId: string): any[] {
  try {
    if (fs.existsSync(POLLS_DATA_PATH)) {
      const data = JSON.parse(fs.readFileSync(POLLS_DATA_PATH, 'utf-8'))
      if (data && data[orgId]) return data[orgId]
    }
  } catch (e) {
    console.error('Error reading polls store:', e)
  }

  return []
}

function savePolls(orgId: string, polls: any[]) {
  try {
    let allData: any = {}
    if (fs.existsSync(POLLS_DATA_PATH)) {
      try {
        allData = JSON.parse(fs.readFileSync(POLLS_DATA_PATH, 'utf-8'))
      } catch (e) {}
    }
    allData[orgId] = polls
    fs.writeFileSync(POLLS_DATA_PATH, JSON.stringify(allData, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error saving polls store:', e)
  }
}

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const orgId = user.organizationId!
    const polls = getStoredPolls(orgId)

    const totalUnitsCount = (await prisma.unit.count({ where: { organizationId: orgId } }).catch(() => 0)) || 0

    // Recalculate stats
    const openPolls = polls.filter((p) => p.status === 'OPEN').length
    const closedPolls = polls.filter((p) => p.status === 'CLOSED').length
    const totalVotesCast = polls.reduce((acc, p) => acc + (p.totalVotes || 0), 0)
    const avgTurnout = (polls.length > 0 && totalUnitsCount > 0) ? Math.round((totalVotesCast / (polls.length * totalUnitsCount)) * 100) : 0

    // Provide user / flat-specific voting state
    const { searchParams } = new URL(request.url)
    const requestedUnit = (searchParams.get('unit') || searchParams.get('unitNumber') || '').trim().toUpperCase()
    const userUnit = requestedUnit || ((user.unit ? user.unit.unitNumber : '') || (user as any).unitNumber || '').trim().toUpperCase()

    const sanitizedPolls = polls.map((p) => {
      p.voters = p.voters || []
      p.totalEligible = p.totalEligible || totalUnitsCount
      const myVote = p.voters.find((v: any) =>
        userUnit ? (v.unit && v.unit.toUpperCase() === userUnit) : (v.userId && v.userId === user.id)
      )
      return {
        ...p,
        hasVoted: !!myVote,
        votedOptionId: myVote ? myVote.optionId : null,
        myVotedUnit: myVote ? myVote.unit : null,
      }
    })

    return NextResponse.json({
      polls: sanitizedPolls,
      totalUnits: totalUnitsCount,
      stats: {
        openPolls,
        closedPolls,
        totalVotesCast,
        avgTurnout: avgTurnout,
      },
    })
  } catch (err: unknown) {
    console.error('Error in GET /api/polls:', err)
    return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const orgId = user.organizationId!
    const body = await request.json()
    const {
      title,
      description = '',
      options = [],
      eligibility = 'OWNERS_ONLY',
      isAnonymous = false,
      quorumPercent = 50,
      closes = '',
      status = 'OPEN',
    } = body

    if (!title || !options || options.length < 2) {
      return NextResponse.json({ error: 'Title and at least 2 options are required' }, { status: 400 })
    }

    const polls = getStoredPolls(orgId)
    const newId = `POLL-${Date.now().toString().slice(-3)}`

    const formattedOptions = options.map((opt: string | { label: string }, idx: number) => ({
      id: `opt_${idx + 1}`,
      label: typeof opt === 'string' ? opt : opt.label,
      votes: 0,
      pct: 0,
    }))

    const newPoll = {
      id: newId,
      title: title.trim(),
      description: description.trim(),
      status,
      eligibility,
      eligibilityLabel: eligibility === 'OWNERS_ONLY' ? 'Owners only (314 units)' : 'All Members (342)',
      isAnonymous: !!isAnonymous,
      closes: closes || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      closesFormatted: closes ? new Date(closes).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'In 14 Days',
      totalEligible: eligibility === 'OWNERS_ONLY' ? 314 : 342,
      quorumPercent: Number(quorumPercent) || 50,
      totalVotes: 0,
      voters: [],
      options: formattedOptions,
      createdAt: new Date().toISOString(),
      createdBy: `${user.name} (${user.role.replace('_', ' ')})`,
    }

    polls.unshift(newPoll)
    savePolls(orgId, polls)

    if (status === 'OPEN') {
      emitLiveSocketEvent('new-poll', {
        id: newPoll.id,
        title: newPoll.title,
        eligibility: newPoll.eligibilityLabel,
        closes: newPoll.closesFormatted,
      }, { orgId })

      // 1. Create DB notifications for residents
      try {
        const residents = await prisma.user.findMany({
          where: { organizationId: orgId, status: 'ACTIVE' },
          select: { id: true },
        })
        if (residents.length > 0) {
          await prisma.notification.createMany({
            data: residents.map((r) => ({
              organizationId: orgId,
              userId: r.id,
              title: `🗳️ New Society Poll: ${newPoll.title}`,
              message: `Voting is now live. Cast your ballot before ${newPoll.closesFormatted}.`,
              type: 'POLL',
              referenceType: 'POLL',
              referenceId: newPoll.id,
            })),
          })
        }
      } catch (errNotif) {
        console.error('Error creating poll notifications:', errNotif)
      }

      // 2. Publish an official notice on the Resident Notice Board
      try {
        const notice = await prisma.notice.create({
          data: {
            organizationId: orgId,
            title: `🗳️ Active Community Poll: ${newPoll.title}`,
            content: `The Society Management Committee has opened voting on: "${newPoll.title}".\n\n${newPoll.description || ''}\n\n• Eligibility: ${newPoll.eligibilityLabel}\n• Voting Deadline: ${newPoll.closesFormatted}\n• Quorum Target: ${newPoll.quorumPercent}%\n\nPlease open Community > Polls in your resident portal to cast your ballot.`,
            type: 'GENERAL',
            channels: 'IN_APP',
            status: 'PUBLISHED',
            publishedAt: new Date(),
            publishedBy: `${user.name} (${user.role.replace('_', ' ')})`,
            pinnedUntil: newPoll.closes ? new Date(newPoll.closes) : null,
          },
        })

        emitLiveSocketEvent('new-notice', {
          id: notice.id,
          title: notice.title,
          content: notice.content,
          type: notice.type,
          publishedBy: notice.publishedBy,
          publishedAt: notice.publishedAt,
        }, { orgId })
      } catch (errNotice) {
        console.error('Error publishing poll notice:', errNotice)
      }
    }

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'POLL_CREATED',
      entityType: 'Poll',
      entityId: newPoll.id,
      details: `Society voting poll "${newPoll.title}" created with ${newPoll.options.length} options (${newPoll.status})`,
      severity: 'INFO',
      newValues: {
        pollId: newPoll.id,
        title: newPoll.title,
        optionsCount: newPoll.options.length,
        status: newPoll.status,
      },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    })

    return NextResponse.json({ success: true, poll: newPoll })
  } catch (err: unknown) {
    console.error('Error in POST /api/polls:', err)
    return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireAuth(request)
    if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

    const orgId = user.organizationId!
    const body = await request.json()
    const { id, action, optionId, status, voterUnit = '' } = body

    if (!id) return NextResponse.json({ error: 'Poll ID is required' }, { status: 400 })

    const polls = getStoredPolls(orgId)
    const pollIndex = polls.findIndex((p) => p.id === id)
    if (pollIndex === -1) return NextResponse.json({ error: 'Poll not found' }, { status: 404 })

    const poll = polls[pollIndex]

    if (action === 'VOTE') {
      if (poll.status !== 'OPEN') {
        return NextResponse.json({ error: 'This poll is closed or not active for voting' }, { status: 400 })
      }

      poll.voters = poll.voters || []
      const effectiveUnit = (voterUnit || (user.unit ? user.unit.unitNumber : '') || (user as any).unitNumber || '').trim().toUpperCase()

      const existingVote = poll.voters.find((v: any) =>
        effectiveUnit ? (v.unit && v.unit.toUpperCase() === effectiveUnit) : (v.userId && v.userId === user.id)
      )

      if (existingVote) {
        return NextResponse.json({
          error: `Unit ${effectiveUnit || 'your flat'} has already cast an official ballot in this poll. Society bylaws restrict to 1 vote per flat.`,
        }, { status: 400 })
      }

      const targetOption = poll.options.find((o: any) => o.id === optionId)
      if (!targetOption) return NextResponse.json({ error: 'Invalid voting option' }, { status: 400 })

      targetOption.votes = (targetOption.votes || 0) + 1
      poll.totalVotes = (poll.totalVotes || 0) + 1

      // Recalculate percentages
      poll.options.forEach((opt: any) => {
        opt.pct = Math.round((opt.votes / poll.totalVotes) * 100)
      })

      const voteRecord = {
        userId: user.id,
        unit: effectiveUnit || 'A-101',
        optionId,
        timestamp: new Date().toISOString(),
      }
      poll.voters.push(voteRecord)

      emitLiveSocketEvent('poll-voted', {
        pollId: poll.id,
        totalVotes: poll.totalVotes,
        options: poll.options,
      }, { orgId })

      savePolls(orgId, polls)

      return NextResponse.json({
        success: true,
        poll: {
          ...poll,
          hasVoted: true,
          votedOptionId: optionId,
          myVotedUnit: voteRecord.unit,
        },
        message: 'Vote recorded successfully',
      })
    }

    if (action === 'STATUS') {
      if (user.role !== 'RWA_ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      poll.status = status
      if (status === 'CLOSED') {
        const sortedOptions = [...poll.options].sort((a: any, b: any) => b.votes - a.votes)
        poll.winningOption = sortedOptions[0]?.label || 'No votes cast'
      }

      emitLiveSocketEvent('poll-status-changed', {
        pollId: poll.id,
        status: poll.status,
        winningOption: poll.winningOption,
      }, { orgId })

      await logAudit({
        organizationId: orgId,
        userId: user.id,
        action: 'POLL_STATUS_CHANGED',
        entityType: 'Poll',
        entityId: poll.id,
        details: `Poll "${poll.title}" status changed to ${status}`,
        severity: 'INFO',
        ipAddress: request.headers.get('x-forwarded-for') || null,
        userAgent: request.headers.get('user-agent') || null,
      })

      savePolls(orgId, polls)
      return NextResponse.json({ success: true, poll })
    }

    savePolls(orgId, polls)
    return NextResponse.json({ success: true, poll })
  } catch (err: unknown) {
    console.error('Error in PATCH /api/polls:', err)
    return NextResponse.json({ error: 'Failed to update poll' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Poll ID is required' }, { status: 400 })

    const orgId = user.organizationId!
    let polls = getStoredPolls(orgId)
    const targetPoll = polls.find((p) => p.id === id)
    if (!targetPoll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 })

    polls = polls.filter((p) => p.id !== id)
    savePolls(orgId, polls)

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      action: 'POLL_DELETED',
      entityType: 'Poll',
      entityId: id,
      details: `Poll "${targetPoll.title}" deleted by ${user.name}`,
      severity: 'WARNING',
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    })

    return NextResponse.json({ success: true, message: 'Poll deleted successfully' })
  } catch (err: unknown) {
    console.error('Error in DELETE /api/polls:', err)
    return NextResponse.json({ error: 'Failed to delete poll' }, { status: 500 })
  }
}
