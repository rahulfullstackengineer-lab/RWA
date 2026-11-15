import { NextResponse } from 'next/server'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { requireAuth, requirePlatformAdmin } from '@/lib/auth'

type DashVideo = {
  id: string
  title: string
  videoUrl: string
  posterUrl: string
  active: boolean
  createdAt: string
}

const storePath = path.join(process.cwd(), 'data', 'dashboard_videos.json')

async function readVideos(): Promise<DashVideo[]> {
  try {
    const raw = await readFile(storePath, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeVideos(videos: DashVideo[]) {
  await mkdir(path.dirname(storePath), { recursive: true })
  await writeFile(storePath, JSON.stringify(videos, null, 2))
}

function activeVideo(videos: DashVideo[]) {
  return videos.find((video) => video.active) || videos[0] || null
}

function cleanUrl(value: unknown) {
  const url = String(value || '').trim()
  if (!url) return ''
  if (url.startsWith('/uploads/dashboard-videos/')) return url
  if (/^https?:\/\//i.test(url)) return url
  return ''
}

export async function GET(request: Request) {
  const { user, error } = await requireAuth(request)
  if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

  const videos = await readVideos()
  return NextResponse.json({ success: true, videos, active: activeVideo(videos) })
}

export async function POST(request: Request) {
  const { user, error } = await requirePlatformAdmin(request)
  if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

  let title = ''
  let videoUrl = ''
  let posterUrl = ''
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData()
    title = String(form.get('title') || '').trim()
    videoUrl = cleanUrl(form.get('videoUrl'))
    posterUrl = cleanUrl(form.get('posterUrl'))
    const file = form.get('file')
    if (file && typeof file === 'object' && 'arrayBuffer' in file && file.size > 0) {
      if (file.size > 40 * 1024 * 1024) {
        return NextResponse.json({ error: 'Video must be 40 MB or smaller. Paste a link for a larger file.' }, { status: 400 })
      }
      const ext = path.extname(file.name || '').toLowerCase()
      if (!['.mp4', '.webm', '.ogg'].includes(ext)) {
        return NextResponse.json({ error: 'Upload an mp4, webm, or ogg file, or paste a video link.' }, { status: 400 })
      }
      const dir = path.join(process.cwd(), 'public', 'uploads', 'dashboard-videos')
      await mkdir(dir, { recursive: true })
      const filename = `${Date.now()}${ext}`
      await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()))
      videoUrl = `/uploads/dashboard-videos/${filename}`
    }
  } else {
    const body = await request.json().catch(() => ({}))
    title = String(body.title || '').trim()
    videoUrl = cleanUrl(body.videoUrl)
    posterUrl = cleanUrl(body.posterUrl)
  }

  if (!title) return NextResponse.json({ error: 'A title is required' }, { status: 400 })
  if (!videoUrl) return NextResponse.json({ error: 'Add a video link or upload an mp4 file' }, { status: 400 })

  const videos = await readVideos()
  videos.forEach((video) => { video.active = false })
  const video: DashVideo = {
    id: `vid-${Date.now()}`,
    title,
    videoUrl,
    posterUrl,
    active: true,
    createdAt: new Date().toISOString(),
  }
  videos.unshift(video)
  await writeVideos(videos)
  return NextResponse.json({ success: true, video, videos, active: video })
}

export async function PATCH(request: Request) {
  const { user, error } = await requirePlatformAdmin(request)
  if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const id = String(body.id || '')
  const videos = await readVideos()
  const target = videos.find((video) => video.id === id)
  if (!target) return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  videos.forEach((video) => { video.active = video.id === id })
  await writeVideos(videos)
  return NextResponse.json({ success: true, videos, active: target })
}

export async function DELETE(request: Request) {
  const { user, error } = await requirePlatformAdmin(request)
  if (error || !user) return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })

  const id = new URL(request.url).searchParams.get('id') || ''
  const videos = (await readVideos()).filter((video) => video.id !== id)
  if (videos.length && !videos.some((video) => video.active)) videos[0].active = true
  await writeVideos(videos)
  return NextResponse.json({ success: true, videos, active: activeVideo(videos) })
}
