import { NextResponse } from 'next/server'

export const revalidate = 300

const BASE   = 'https://api.airtable.com/v0/appzew2eaB6QOy0RF'
const TABLE  = process.env.AIRTABLE_EVENTS_TABLE_ID ?? ''
const TOKEN  = process.env.AIRTABLE_API_TOKEN!

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

// ── Curated global VC/startup events 2026 ──────────────────────────────────
const CURATED: Omit<VCCEvent, 'id'>[] = [
  { title: 'Ukrainian Startup Fund — Grant Applications', date: '2026-04-01', endDate: '2026-04-30', location: 'Online', url: 'https://startupfund.com.ua', source: 'USF', description: 'Open applications for Ukrainian startups. Up to $25K non-dilutive grant.', type: 'deadline', tags: ['ukraine','grant','funding'] },
  { title: 'UNIT.City Demo Day — Spring 2026', date: '2026-04-24', location: 'Kyiv, Ukraine', url: 'https://unit.city', source: 'UNIT.City', description: "Pitch competition from Ukraine's leading innovation park.", type: 'demo-day', tags: ['ukraine','kyiv','demo-day'] },
  { title: 'iForum 2026', date: '2026-05-14', location: 'Kyiv, Ukraine', url: 'https://iforum.ua', source: 'iForum', description: "Ukraine's largest internet & tech conference.", type: 'conference', tags: ['ukraine','kyiv'] },
  { title: 'Startup Wise Guys — CEE Demo Day', date: '2026-05-15', location: 'Riga / Online', url: 'https://startupwiseguys.com', source: 'SWG', description: 'CEE cohort demo day. Ukrainian startups pitching to EU investors.', type: 'demo-day', tags: ['cee','ukraine','accelerator'] },
  { title: 'VivaTech 2026', date: '2026-06-17', endDate: '2026-06-20', location: 'Paris, France', url: 'https://vivatechnology.com', source: 'VivaTech', description: "Europe's biggest startup & tech event.", type: 'conference', tags: ['europe','startup','vc'] },
  { title: 'Lviv IT Cluster — Investment Forum', date: '2026-05-22', location: 'Lviv, Ukraine', url: 'https://itcluster.lviv.ua', source: 'IT Cluster Lviv', description: 'Annual forum connecting Ukrainian startups with CEE investors.', type: 'conference', tags: ['ukraine','lviv','investment'] },
  { title: 'EIC Accelerator — Application Deadline', date: '2026-07-08', location: 'Online (EU)', url: 'https://eic.ec.europa.eu', source: 'EIC', description: 'EU grants & equity for deep tech. Up to EUR 17.5M per startup.', type: 'deadline', tags: ['eu','grant','deeptech'] },
  { title: 'Noah Conference 2026', date: '2026-06-10', endDate: '2026-06-11', location: 'Zurich, Switzerland', url: 'https://noah-conference.com', source: 'Noah', description: 'Exclusive European digital & internet conference for C-level.', type: 'conference', tags: ['europe','vc','digital'] },
  { title: 'SaaStr Annual 2026', date: '2026-05-12', endDate: '2026-05-14', location: 'San Francisco, USA', url: 'https://saastrannual.com', source: 'SaaStr', description: "World's largest SaaS community. 10,000+ founders & investors.", type: 'conference', tags: ['saas','usa','vc'] },
  { title: 'IT Arena 2026', date: '2026-09-25', endDate: '2026-09-27', location: 'Lviv, Ukraine', url: 'https://itarena.ua', source: 'IT Arena', description: "Ukraine's largest tech conference. 5,000+ attendees.", type: 'conference', tags: ['ukraine','lviv'] },
  { title: 'TC Disrupt 2026', date: '2026-10-13', endDate: '2026-10-15', location: 'San Francisco, USA', url: 'https://techcrunch.com/events/tc-disrupt', source: 'TechCrunch', description: "TechCrunch's flagship startup & investor conference.", type: 'conference', tags: ['usa','startup','vc'] },
  { title: 'Web Summit 2026', date: '2026-11-09', endDate: '2026-11-12', location: 'Lisbon, Portugal', url: 'https://websummit.com', source: 'Web Summit', description: "World's largest tech conference. Strong CEE/Ukraine startup presence.", type: 'conference', tags: ['global','startup','networking'] },
  { title: 'Slush 2026', date: '2026-11-18', endDate: '2026-11-19', location: 'Helsinki, Finland', url: 'https://slush.org', source: 'Slush', description: 'World-leading startup & investor event. Strong CEE/UA startup track.', type: 'conference', tags: ['europe','startup','vc'] },
]

async function getAirtableEvents(): Promise<VCCEvent[]> {
  if (!TABLE || !TOKEN) return []
  try {
    const res = await fetch(
      BASE + '/' + TABLE + '?sort[0][field]=Date&sort[0][direction]=asc',
      { headers: { Authorization: 'Bearer ' + TOKEN }, next: { revalidate: 300 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.records ?? []).map((r: any): VCCEvent => ({
      id:          r.id,
      title:       r.fields.Title        ?? '',
      date:        r.fields.Date         ?? '',
      endDate:     r.fields['End Date']  ?? undefined,
      location:    r.fields.Location     ?? 'TBD',
      url:         r.fields.URL          ?? '#',
      source:      'Custom',
      description: r.fields.Description  ?? '',
      type:        r.fields.Type         ?? 'meetup',
      tags:        (r.fields.Tags ?? '').split(',').map((t: string) => t.trim()).filter(Boolean),
      isPrivate:   r.fields['Is Private'] ?? false,
    }))
  } catch { return [] }
}

export async function GET() {
  const airtable = await getAirtableEvents()
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const all = [
    ...CURATED.map((e, i) => ({ ...e, id: 'c-' + i })),
    ...airtable,
  ]
    .filter(e => e.date && new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return NextResponse.json({ events: all })
}

export async function POST(req: Request) {
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
