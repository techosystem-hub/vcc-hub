import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getDealFlowStartups, type DealFlowStartup } from '@/lib/airtable'

let _cache: { data: DealFlowStartup[]; ts: number } | null = null
const TTL = 5 * 60 * 1000

async function getAllCached(): Promise<DealFlowStartup[]> {
  const now = Date.now()
  if (_cache && now - _cache.ts < TTL) return _cache.data
  try {
    const data = await getDealFlowStartups()
    _cache = { data, ts: now }
    return data
  } catch (err) {
    if (_cache) { console.warn('[dealflow] stale cache', err); return _cache.data }
    throw err
  }
}

export async function GET(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(req.url)
    const vertical = searchParams.get('vertical') || undefined
    const stage    = searchParams.get('stage')    || undefined
    const search   = searchParams.get('search')   || undefined
    let data = await getAllCached()
    if (vertical) data = data.filter(s => s.vertical === vertical)
    if (stage)    data = data.filter(s => s.roundStage === stage)
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.founders.toLowerCase().includes(q))
    }
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[/api/dealflow]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
        }
