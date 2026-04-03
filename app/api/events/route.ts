import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

export const revalidate = 0

const BASE = 'https://api.airtable.com/v0/appzew2eaB6QOy0RF'
const TABLE = process.env.AIRTABLE_EVENTS_TABLE_ID ?? ''
const TOKEN = process.env.AIRTABLE_API_TOKEN!

export interface VCCEvent {
  id: string
  title: string
  date: string
  endDate?: string
  location: string
  url: string
  source: string
  description: string
  type: string
  tags: string[]
  isPrivate?: boolean
}

async function getAirtableEvents(): Promise<VCCEvent[]> {
  if (!TABLE || !TOKEN) return []
  try {
    const res = await fetch(
      BASE + '/' + TABLE + '?sort[0][field]=Date&sort[0][direction]=asc',
      { headers: { Authorization: 'Bearer ' + TOKEN }, next: { revalidate: 0 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.records ?? []).map((r: any): VCCEvent => ({
      id: r.id,
      title: r.fields.Title ?? '',
      date: r.fields.Date ?? '',
      endDate: r.fields['End Date'] ?? undefined,
      location: r.fields.Location ?? 'TBD',
      url: r.fields.URL ?? '#',
      source: 'Custom',
      description: r.fields.Description ?? '',
      type: r.fields.Type ?? 'meetup',
      tags: Array.isArray(r.fields.Tags)
        ? r.fields.Tags
        : (r.fields.Tags ?? '').split(',').map((t) => t.trim()).filter(Boolean),
      isPrivate: r.fields['Is Private'] ?? false,
    }))
  } catch {
    return []
  }
}

export async function GET() {
  const airtable = await getAirtableEvents()
  const now = new Date()
  const filtered = airtable
    .filter(e => {
      const end = e.endDate ? new Date(e.endDate) : new Date(e.date)
      return end >= now
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return NextResponse.json({ events: filtered })
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!TABLE || !TOKEN) {
    return NextResponse.json({ error: 'AIRTABLE_EVENTS_TABLE_ID not configured' }, { status: 503 })
  }
  try {
    const body = await req.json()
    const fields: Record<string, any> = {}
    if (body.title)       fields['Title']       = body.title
    if (body.date)        fields['Date']        = body.date
    if (body.endDate)     fields['End Date']    = body.endDate
    if (body.location)    fields['Location']    = body.location
    if (body.url)         fields['URL']         = body.url
    if (body.description) fields['Description'] = body.description
    if (body.type)        fields['Type']        = body.type
    if (body.tags)        fields['Tags']        = body.tags
    if (body.isPrivate)   fields['Is Private']  = body.isPrivate
    const res = await fetch(BASE + '/' + TABLE, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.error?.message ?? 'Failed' }, { status: 500 })
    return NextResponse.json({ success: true, id: data.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
