import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getDealFlowStartups } from '@/lib/airtable'

export async function GET(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const vertical = searchParams.get('vertical') || undefined
    const stage    = searchParams.get('stage')    || undefined
    const search   = searchParams.get('search')   || undefined

    const startups = await getDealFlowStartups({ vertical, stage, search })
    return NextResponse.json(startups)
  } catch (err: any) {
    console.error('[/api/dealflow]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
