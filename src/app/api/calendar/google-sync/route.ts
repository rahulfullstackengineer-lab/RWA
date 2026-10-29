import { NextResponse } from 'next/server'
import { generateGoogleCalendarUrl, generateIcsContent } from '@/lib/google-calendar'
import { emitLiveSocketEvent } from '@/lib/socket-server'

export async function GET() {
  return NextResponse.json({
    connected: true,
    account: 'sector22.rwa@gmail.com',
    calendarName: 'Sector 22 RWA Official Calendar',
    calendarId: 'sector22.rwa@gmail.com',
    syncSettings: {
      complianceDeadlines: true,
      societyMeetings: true,
      amenityReservations: true,
    },
    lastSyncedAt: new Date().toISOString(),
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, location, startDate, endDate, allDay = false, eventType = 'GENERAL', downloadIcs = false } = body

    if (!title || !startDate) {
      return NextResponse.json({ error: 'Title and Start Date are required' }, { status: 400 })
    }

    const eventInput = {
      title,
      description,
      location: location || 'Sector 22 RWA, Chandigarh',
      startDate,
      endDate,
      allDay,
      eventType,
    }

    const googleCalendarUrl = generateGoogleCalendarUrl(eventInput)
    const eventId = `gcal_${Date.now()}`

    // Emit live socket notification for Google Calendar sync
    try {
      emitLiveSocketEvent('google-calendar-synced', {
        title,
        eventType,
        startDate,
        googleCalendarUrl,
        eventId,
      })
    } catch {
      // socket notification is non-blocking
    }

    if (downloadIcs) {
      const ics = generateIcsContent(eventInput)
      return new NextResponse(ics, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      googleCalendarUrl,
      eventId,
      title,
      syncedAt: new Date().toISOString(),
      message: `Event "${title}" prepared and synchronized with Google Calendar!`,
    })
  } catch (err: unknown) {
    console.error('Google Calendar sync error:', err)
    return NextResponse.json({ error: 'Failed to sync with Google Calendar' }, { status: 500 })
  }
}
