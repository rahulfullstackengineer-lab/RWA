import { NextResponse } from 'next/server'
import { getTokenFromRequest, invalidateSession } from '@/lib/auth'

export async function POST(request: Request) {
  const token = getTokenFromRequest(request)
  if (token) {
    await invalidateSession(token)
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' })
  response.cookies.delete('rwa_token')
  return response
}
