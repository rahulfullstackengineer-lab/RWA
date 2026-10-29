/**
 * Google Calendar Integration Utility
 * Supports Google Calendar Web URL generation, iCal/ICS generation, and Google Calendar API sync.
 */

export interface GoogleCalendarEventInput {
  title: string
  description?: string
  location?: string
  startDate: string | Date
  endDate?: string | Date
  allDay?: boolean
  eventType?: 'MEETING' | 'COMPLIANCE' | 'AMENITY' | 'GENERAL'
}

/**
 * Format a Date object to Google Calendar's required format:
 * - Timed: YYYYMMDDTHHmmssZ
 * - All Day: YYYYMMDD
 */
export function formatGoogleCalendarDate(dateInput: string | Date, allDay = false): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(d.getTime())) {
    const fallback = new Date()
    return fallback.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const pad = (n: number) => String(n).padStart(2, '0')

  const year = d.getUTCFullYear()
  const month = pad(d.getUTCMonth() + 1)
  const day = pad(d.getUTCDate())

  if (allDay) {
    return `${year}${month}${day}`
  }

  const hours = pad(d.getUTCHours())
  const minutes = pad(d.getUTCMinutes())
  const seconds = pad(d.getUTCSeconds())

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

/**
 * Generate direct 1-click Google Calendar Event creation URL
 */
export function generateGoogleCalendarUrl(event: GoogleCalendarEventInput): string {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE'

  const title = encodeURIComponent(event.title || 'Society Event')
  const details = encodeURIComponent(
    (event.description || '') +
    '\n\n---\nOrganized by Sector 22 Residents Welfare Association (RWA Manager)'
  )
  const location = encodeURIComponent(event.location || 'Sector 22 RWA, Chandigarh')

  const startFormatted = formatGoogleCalendarDate(event.startDate, event.allDay)

  let endFormatted: string
  if (event.endDate) {
    endFormatted = formatGoogleCalendarDate(event.endDate, event.allDay)
  } else if (event.allDay) {
    // Next day for all-day events in Google Calendar
    const nextDay = new Date(typeof event.startDate === 'string' ? event.startDate : event.startDate.getTime())
    nextDay.setDate(nextDay.getDate() + 1)
    endFormatted = formatGoogleCalendarDate(nextDay, true)
  } else {
    // Default 1 hour duration
    const end = new Date(typeof event.startDate === 'string' ? event.startDate : event.startDate.getTime())
    end.setHours(end.getHours() + 1)
    endFormatted = formatGoogleCalendarDate(end, false)
  }

  const datesParam = `${startFormatted}/${endFormatted}`

  return `${baseUrl}&text=${title}&dates=${datesParam}&details=${details}&location=${location}`
}

/**
 * Generate standard iCal (.ics) format
 */
export function generateIcsContent(event: GoogleCalendarEventInput): string {
  const uid = `rwa-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@sector22rwa.org`
  const now = formatGoogleCalendarDate(new Date())
  const start = formatGoogleCalendarDate(event.startDate, event.allDay)
  const end = event.endDate
    ? formatGoogleCalendarDate(event.endDate, event.allDay)
    : formatGoogleCalendarDate(new Date(new Date(event.startDate).getTime() + 3600000))

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RWA Society Management//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location || 'Sector 22 RWA'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
